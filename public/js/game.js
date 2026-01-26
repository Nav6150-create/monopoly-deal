// Property Deal - Client-side game logic
const socket = io();

// State
let gameState = null;
let myPlayerId = null;
let gameCode = null;
let selectedCard = null;
let selectedTarget = null;
let isHost = false;

// DOM Elements
const screens = {
  home: document.getElementById('home-screen'),
  lobby: document.getElementById('lobby-screen'),
  game: document.getElementById('game-screen')
};

const modals = {
  name: document.getElementById('name-modal'),
  rules: document.getElementById('rules-modal'),
  target: document.getElementById('target-modal'),
  payment: document.getElementById('payment-modal'),
  color: document.getElementById('color-modal'),
  gameover: document.getElementById('gameover-modal'),
  actionChoice: document.getElementById('action-choice-modal'),
  rent: document.getElementById('rent-modal')
};

// Initialize
function init() {
  setupEventListeners();
  checkUrlForGameCode();
}

function setupEventListeners() {
  // Home screen
  document.getElementById('play-btn').addEventListener('click', () => showNameModal('create'));
  document.getElementById('join-btn').addEventListener('click', () => showNameModal('join'));
  document.getElementById('how-to-play-btn').addEventListener('click', () => showModal('rules'));

  // Name modal
  document.getElementById('modal-cancel').addEventListener('click', () => hideModal('name'));
  document.getElementById('modal-confirm').addEventListener('click', handleNameConfirm);
  document.getElementById('player-name').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleNameConfirm();
  });

  // Rules modal
  document.getElementById('close-rules').addEventListener('click', () => hideModal('rules'));

  // Lobby
  document.getElementById('leave-lobby').addEventListener('click', leaveLobby);
  document.getElementById('copy-code').addEventListener('click', copyGameCode);
  document.getElementById('start-game').addEventListener('click', startGame);

  // Game actions
  document.getElementById('draw-btn').addEventListener('click', drawCards);
  document.getElementById('end-turn-btn').addEventListener('click', endTurn);

  // Target modal
  document.getElementById('target-cancel').addEventListener('click', () => hideModal('target'));
  document.getElementById('target-confirm').addEventListener('click', confirmTarget);

  // Color modal
  document.getElementById('color-cancel').addEventListener('click', () => {
    hideModal('color');
    selectedCard = null;
  });

  // Payment modal
  document.getElementById('pay-btn').addEventListener('click', submitPayment);
  document.getElementById('say-no-btn').addEventListener('click', playSayNo);

  // Game over
  document.getElementById('back-home').addEventListener('click', () => {
    hideModal('gameover');
    showScreen('home');
  });

  // Rent chart modal
  document.getElementById('close-rent').addEventListener('click', () => hideModal('rent'));

  // Socket events
  socket.on('gameCreated', handleGameCreated);
  socket.on('gameJoined', handleGameJoined);
  socket.on('playerJoined', handlePlayerJoined);
  socket.on('playerLeft', handlePlayerLeft);
  socket.on('gameStarted', handleGameStarted);
  socket.on('gameState', handleGameState);
  socket.on('gameOver', handleGameOver);
  socket.on('error', handleError);
}

// Check URL for game code
function checkUrlForGameCode() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('game');
  if (code) {
    showNameModal('join', code);
  }
}

// Screen management
function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

function showModal(name) {
  modals[name].classList.add('active');
}

function hideModal(name) {
  modals[name].classList.remove('active');
}

// Name modal
let modalAction = null;
let prefilledCode = null;

function showNameModal(action, code = null) {
  modalAction = action;
  prefilledCode = code;

  const codeInput = document.getElementById('game-code-input');
  const title = document.getElementById('modal-title');
  const nameInput = document.getElementById('player-name');
  const joinCodeInput = document.getElementById('join-code');

  nameInput.value = localStorage.getItem('playerName') || '';

  if (action === 'join') {
    title.textContent = 'Join Game';
    codeInput.classList.remove('hidden');
    joinCodeInput.value = code || '';
  } else {
    title.textContent = 'Enter Your Name';
    codeInput.classList.add('hidden');
  }

  showModal('name');
  nameInput.focus();
}

function handleNameConfirm() {
  const name = document.getElementById('player-name').value.trim();
  if (!name) {
    showToast('Please enter your name', 'error');
    return;
  }

  localStorage.setItem('playerName', name);

  if (modalAction === 'create') {
    socket.emit('createGame', name);
  } else {
    const code = document.getElementById('join-code').value.trim().toUpperCase();
    if (!code) {
      showToast('Please enter a game code', 'error');
      return;
    }
    socket.emit('joinGame', { gameCode: code, playerName: name });
  }

  hideModal('name');
}

// Game creation and joining
function handleGameCreated(data) {
  gameCode = data.gameCode;
  myPlayerId = data.playerId;
  isHost = true;
  updateLobby(data.players);
  showScreen('lobby');
  updateUrl();
}

function handleGameJoined(data) {
  gameCode = data.gameCode;
  myPlayerId = data.playerId;
  isHost = false;
  updateLobby(data.players);
  showScreen('lobby');
  updateUrl();
}

function handlePlayerJoined(data) {
  updateLobby(data.players);
}

function handlePlayerLeft(data) {
  updateLobby(data.players);
}

function updateUrl() {
  const url = new URL(window.location);
  url.searchParams.set('game', gameCode);
  window.history.pushState({}, '', url);
}

function updateLobby(players) {
  document.getElementById('lobby-code').textContent = gameCode;
  document.getElementById('player-count').textContent = `(${players.length}/5)`;

  const playerList = document.getElementById('player-list');
  playerList.innerHTML = '';

  players.forEach(player => {
    const div = document.createElement('div');
    div.className = 'player-item';
    div.innerHTML = `
      <div class="player-avatar" style="background-color: ${player.avatar}">
        ${player.name.charAt(0).toUpperCase()}
      </div>
      <div class="player-info">
        <div class="player-name">${escapeHtml(player.name)}</div>
        <div class="player-status">${player.id === myPlayerId ? 'You' : 'Ready'}</div>
      </div>
      ${player.isHost ? '<span class="host-badge">HOST</span>' : ''}
    `;
    playerList.appendChild(div);

    // Update host status
    if (player.id === myPlayerId && player.isHost) {
      isHost = true;
    }
  });

  // Update start button
  const startBtn = document.getElementById('start-game');
  if (isHost) {
    if (players.length >= 2) {
      startBtn.disabled = false;
      startBtn.textContent = 'Start Game';
    } else {
      startBtn.disabled = true;
      startBtn.textContent = 'Need at least 2 players';
    }
  } else {
    startBtn.disabled = true;
    startBtn.textContent = 'Waiting for host to start...';
  }
}

function copyGameCode() {
  const url = `${window.location.origin}${window.location.pathname}?game=${gameCode}`;
  navigator.clipboard.writeText(url).then(() => {
    showToast('Link copied!', 'success');
    const codeEl = document.getElementById('lobby-code');
    codeEl.classList.add('copied');
    setTimeout(() => codeEl.classList.remove('copied'), 300);
  }).catch(() => {
    showToast('Failed to copy', 'error');
  });
}

function leaveLobby() {
  window.location.href = window.location.pathname;
}

function startGame() {
  socket.emit('startGame');
}

// Game state handling
function handleGameStarted(state) {
  gameState = state;
  showScreen('game');
  renderGame();
}

function handleGameState(state) {
  gameState = state;
  renderGame();
}

function handleGameOver(data) {
  document.getElementById('winner-name').textContent = `${data.winnerName} Wins!`;
  showModal('gameover');
}

function handleError(data) {
  showToast(data.message, 'error');
}

// Game rendering
function renderGame() {
  if (!gameState) return;

  const myPlayer = gameState.players.find(p => p.id === myPlayerId);
  const isMyTurn = gameState.currentPlayerId === myPlayerId;

  // Update turn indicator
  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);
  document.getElementById('current-turn').textContent = isMyTurn ? 'Your Turn' : `${currentPlayer?.name}'s Turn`;
  document.getElementById('actions-left').textContent = isMyTurn ?
    `${gameState.actionsRemaining} actions left` : 'Waiting...';

  // Add your-turn class for CSS animation
  const gameContainer = document.querySelector('.game-container');
  if (gameContainer) {
    gameContainer.classList.toggle('your-turn', isMyTurn);
  }

  // Update deck count
  document.getElementById('deck-count').textContent = gameState.deckCount;

  // Update action buttons
  const drawBtn = document.getElementById('draw-btn');
  const endTurnBtn = document.getElementById('end-turn-btn');

  // Hide draw button since drawing is now automatic
  drawBtn.style.display = 'none';

  // End turn button - only needed when player still has actions and wants to pass
  endTurnBtn.disabled = !isMyTurn || !gameState.hasDrawnThisTurn ||
    gameState.mustDiscard > 0 || gameState.pendingAction;

  // Update end turn button text based on remaining actions
  if (isMyTurn && gameState.hasDrawnThisTurn) {
    if (gameState.actionsRemaining > 0) {
      endTurnBtn.textContent = `End Turn (${gameState.actionsRemaining} actions left)`;
    } else {
      endTurnBtn.textContent = 'End Turn';
    }
  } else {
    endTurnBtn.textContent = 'End Turn';
  }

  // Render opponents
  renderOpponents();

  // Render my properties
  renderProperties(myPlayer.properties, 'my-properties');

  // Render my bank
  renderBank(myPlayer.bank);

  // Render my hand
  renderHand(myPlayer.hand);

  // Handle pending actions
  if (gameState.pendingAction) {
    // Check if someone just used Say No (and it wasn't us)
    if (gameState.pendingAction.sayNoUsedBy &&
        gameState.pendingAction.sayNoUsedBy.playerId !== myPlayerId) {
      const sayNoKey = `${gameState.pendingAction.sayNoUsedBy.playerId}-${Date.now()}`;
      // Only show if we haven't shown this one yet
      if (lastSayNoUsedBy !== gameState.pendingAction.sayNoUsedBy.playerId + gameState.pendingAction.type) {
        lastSayNoUsedBy = gameState.pendingAction.sayNoUsedBy.playerId + gameState.pendingAction.type;
        showSayNoNotification(gameState.pendingAction.sayNoUsedBy.playerName);
      }
    }
    handlePendingAction();
  } else {
    // Reset Say No tracking when action resolves
    lastSayNoUsedBy = null;
  }

  // Handle must discard - show persistent message
  const actionPrompt = document.getElementById('action-prompt');
  if (gameState.mustDiscard > 0 && isMyTurn) {
    actionPrompt.innerHTML = `
      <h3>Discard Cards</h3>
      <p>You must discard ${gameState.mustDiscard} card(s) to end your turn. Click cards in your hand to discard.</p>
    `;
    actionPrompt.classList.remove('hidden');
  } else if (!gameState.pendingAction) {
    actionPrompt.classList.add('hidden');
  }
}

function renderOpponents() {
  const container = document.getElementById('opponents-area');
  container.innerHTML = '';

  const opponents = gameState.players.filter(p => p.id !== myPlayerId);

  opponents.forEach(player => {
    const isActive = player.id === gameState.currentPlayerId;
    const div = document.createElement('div');
    div.className = `opponent-board ${isActive ? 'active-player' : ''}`;
    div.innerHTML = `
      <div class="opponent-header">
        <div class="opponent-avatar" style="background-color: ${player.avatar}">
          ${player.name.charAt(0).toUpperCase()}
        </div>
        <span class="opponent-name">${escapeHtml(player.name)}</span>
        <span class="opponent-cards">${player.handCount}</span>
      </div>
      <div class="opponent-hand">
        ${Array(Math.min(player.handCount, 7)).fill('<div class="card-back"></div>').join('')}
      </div>
      <div class="opponent-props">
        ${renderOpponentProperties(player.properties)}
      </div>
      <div class="opponent-bank">${player.bankTotal}M</div>
    `;
    container.appendChild(div);
  });
}

function renderOpponentProperties(properties) {
  let html = '';
  const colors = gameState.propertyColors;

  Object.entries(properties).forEach(([color, cards]) => {
    const colorInfo = colors[color];
    if (colorInfo && cards.length > 0) {
      // Check if set is complete
      const propertyCards = cards.filter(c =>
        c.type === 'property' || c.type === 'property_wild' || c.type === 'property_wild_all'
      );
      const isComplete = propertyCards.length >= colorInfo.setSize;

      // Check for house/hotel
      const hasHouse = cards.some(c => c.action === 'house');
      const hasHotel = cards.some(c => c.action === 'hotel');

      // Create stacked set display
      const stackWidth = 24 + (cards.length - 1) * 6;
      html += `<div class="prop-set-mini ${isComplete ? 'complete' : ''}" style="width: ${stackWidth}px; position: relative; display: inline-block; margin-right: 8px; margin-bottom: 4px;">`;

      cards.forEach((card, idx) => {
        let bgColor = colorInfo.color;
        let icon = '';

        if (card.action === 'house') {
          bgColor = '#27ae60';
          icon = 'H';
        } else if (card.action === 'hotel') {
          bgColor = '#e74c3c';
          icon = 'HT';
        }

        html += `<div class="prop-mini stacked" style="background-color: ${bgColor}; left: ${idx * 6}px; z-index: ${idx};">${icon}</div>`;
      });

      // Add house/hotel indicator badge on top
      if (hasHouse || hasHotel) {
        const badge = hasHotel ? '🏨' : '🏠';
        html += `<span class="building-badge">${badge}</span>`;
      }

      html += '</div>';
    }
  });

  return html || '<span style="font-size: 10px; color: #888;">No properties</span>';
}

function renderProperties(properties, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  const colors = gameState.propertyColors;

  Object.entries(properties).forEach(([color, cards]) => {
    const colorInfo = colors[color];
    if (!colorInfo || cards.length === 0) return;

    const propertyCards = cards.filter(c =>
      c.type === 'property' || c.type === 'property_wild' || c.type === 'property_wild_all'
    );
    const isComplete = propertyCards.length >= colorInfo.setSize;

    const setDiv = document.createElement('div');
    setDiv.className = `property-set ${isComplete ? 'complete' : ''}`;
    setDiv.dataset.color = color;

    // Create stacked card display
    const cardsHtml = cards.map((card, index) => {
      const offset = index * 18; // Stack cards with offset
      return renderStackedMiniCard(card, colorInfo.color, `prop-${color}-${index}`, offset);
    }).join('');

    setDiv.innerHTML = `
      <div class="set-header">${colorInfo.name} (${propertyCards.length}/${colorInfo.setSize})</div>
      <div class="set-cards stacked" style="height: ${60 + (cards.length - 1) * 18}px;">
        ${cardsHtml}
      </div>
    `;

    // Add click handler to show rent chart
    setDiv.addEventListener('click', () => showRentChart(color, colorInfo, cards));

    container.appendChild(setDiv);
  });

  if (Object.keys(properties).length === 0) {
    container.innerHTML = '<div style="color: #888; font-size: 12px;">No properties yet</div>';
  }
}

function renderStackedMiniCard(card, color, id, offset) {
  let bgColor = color || '#3498db';
  let content = '';

  if (card.type === 'money') {
    bgColor = '#27ae60';
    content = `$${card.value}`;
  } else if (card.action === 'house') {
    bgColor = '#27ae60';
    content = 'H';
  } else if (card.action === 'hotel') {
    bgColor = '#e74c3c';
    content = 'HT';
  }

  return `<div class="game-card mini stacked-card" style="border-top-color: ${bgColor}; color: ${bgColor}; top: ${offset}px;" data-id="${id}">
    <div class="card-header"><span class="card-value">$${card.value}</span></div>
    <div class="card-body" style="font-size: 10px; font-weight: bold;">${content}</div>
  </div>`;
}

function renderMiniCard(card, color, id) {
  let bgColor = color || '#3498db';
  let content = '';

  if (card.type === 'money') {
    bgColor = '#27ae60';
    content = `$${card.value}`;
  } else if (card.action === 'house') {
    bgColor = '#27ae60';
    content = 'H';
  } else if (card.action === 'hotel') {
    bgColor = '#e74c3c';
    content = 'HT';
  }

  return `<div class="game-card mini" style="border-top-color: ${bgColor}; color: ${bgColor};" data-id="${id}">
    <div class="card-header"><span class="card-value">$${card.value}</span></div>
    <div class="card-body" style="font-size: 10px; font-weight: bold;">${content}</div>
  </div>`;
}

function renderBank(bank) {
  const container = document.getElementById('my-bank');
  const totalEl = document.getElementById('my-bank-total');

  let total = 0;
  container.innerHTML = '';

  bank.forEach((card, index) => {
    total += card.value;
    const div = document.createElement('div');
    div.className = 'game-card mini';
    div.style.borderTopColor = '#27ae60';
    div.innerHTML = `
      <div class="card-header"><span class="card-value">$${card.value}</span></div>
      <div class="card-body" style="background: #27ae60; color: white; margin: 3px; border-radius: 3px;">$${card.value}</div>
    `;
    div.dataset.index = index;
    div.dataset.type = 'bank';
    container.appendChild(div);
  });

  totalEl.textContent = total;
}

function renderHand(hand) {
  const container = document.getElementById('my-hand');
  container.innerHTML = '';

  hand.forEach((card, index) => {
    const cardEl = createCardElement(card, index);
    cardEl.addEventListener('click', () => handleCardClick(card, index));
    container.appendChild(cardEl);
  });
}

function createCardElement(card, index) {
  const div = document.createElement('div');
  div.className = `game-card ${card.type}`;
  div.dataset.index = index;

  const colors = gameState.propertyColors;

  switch (card.type) {
    case 'money':
      div.innerHTML = `
        <div class="card-header"><span class="card-value">$${card.value}M</span></div>
        <div class="card-body">${getMoneyIcon(card.value)}</div>
        <div class="card-name">Money</div>
      `;
      break;

    case 'property':
      const propColor = colors[card.color];
      const borderColor = propColor?.color || '#3498db';
      div.style.borderTopColor = borderColor;
      div.innerHTML = `
        <div class="card-header"><span class="card-value">$${card.value}M</span></div>
        <div class="card-body property-body" style="background: ${borderColor};">
          ${getPropertyIcon(card.color)}
        </div>
        <div class="card-name">${card.name}</div>
      `;
      break;

    case 'property_wild':
      const wildColors = card.colors.map(c => colors[c]?.color || '#333');
      div.style.background = `linear-gradient(135deg, ${wildColors[0]} 50%, ${wildColors[1]} 50%)`;
      div.innerHTML = `
        <div class="card-header"><span class="card-value card-value-light">$${card.value}M</span></div>
        <div class="card-body wild-body">
          ${getWildIcon()}
        </div>
        <div class="card-name">${card.name}</div>
      `;
      break;

    case 'property_wild_all':
      div.style.background = 'linear-gradient(45deg, #e74c3c, #f39c12, #27ae60, #3498db, #9b59b6)';
      div.innerHTML = `
        <div class="card-header"><span class="card-value card-value-light">$${card.value}M</span></div>
        <div class="card-body wild-body">
          ${getRainbowWildIcon()}
        </div>
        <div class="card-name">Any Color</div>
      `;
      break;

    case 'action':
      div.innerHTML = `
        <div class="card-header"><span class="card-value">$${card.value}M</span></div>
        <div class="card-body action-body">
          ${getActionIcon(card.action)}
        </div>
        <div class="card-name">${card.name}</div>
      `;
      break;

    case 'rent':
      if (card.colors === 'ALL') {
        div.style.background = 'linear-gradient(45deg, #e74c3c, #f39c12, #27ae60, #3498db)';
      } else {
        const rentColors = card.colors.map(c => colors[c]?.color || '#333');
        div.style.background = `linear-gradient(135deg, ${rentColors[0]} 50%, ${rentColors[1]} 50%)`;
      }
      div.innerHTML = `
        <div class="card-header"><span class="card-value card-value-light">$${card.value}M</span></div>
        <div class="card-body rent-body">
          ${getRentIcon()}
        </div>
        <div class="card-name">${card.name}</div>
      `;
      break;
  }

  return div;
}

// SVG Icons for cards
function getMoneyIcon(value) {
  return `<svg viewBox="0 0 48 48" class="card-icon-svg">
    <circle cx="24" cy="24" r="20" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
    <text x="24" y="32" text-anchor="middle" fill="white" font-size="22" font-weight="900">$${value}</text>
  </svg>`;
}

function getPropertyIcon(colorType) {
  const icons = {
    BROWN: `<svg viewBox="0 0 48 48" class="card-icon-svg"><path d="M12 38V18L24 8l12 10v20H12z" fill="rgba(255,255,255,0.9)" stroke="rgba(0,0,0,0.2)" stroke-width="1"/><rect x="20" y="26" width="8" height="12" fill="currentColor" opacity="0.6"/><rect x="18" y="18" width="5" height="5" fill="currentColor" opacity="0.4"/><rect x="25" y="18" width="5" height="5" fill="currentColor" opacity="0.4"/></svg>`,
    LIGHT_BLUE: `<svg viewBox="0 0 48 48" class="card-icon-svg"><path d="M10 38V20L24 8l14 12v18H10z" fill="rgba(255,255,255,0.9)" stroke="rgba(0,0,0,0.2)" stroke-width="1"/><rect x="20" y="28" width="8" height="10" fill="currentColor" opacity="0.6"/><circle cx="24" cy="16" r="4" fill="currentColor" opacity="0.5"/></svg>`,
    PINK: `<svg viewBox="0 0 48 48" class="card-icon-svg"><rect x="10" y="14" width="28" height="24" rx="2" fill="rgba(255,255,255,0.9)" stroke="rgba(0,0,0,0.2)" stroke-width="1"/><rect x="14" y="18" width="6" height="6" fill="currentColor" opacity="0.5"/><rect x="21" y="18" width="6" height="6" fill="currentColor" opacity="0.5"/><rect x="28" y="18" width="6" height="6" fill="currentColor" opacity="0.5"/><rect x="20" y="28" width="8" height="10" fill="currentColor" opacity="0.6"/></svg>`,
    ORANGE: `<svg viewBox="0 0 48 48" class="card-icon-svg"><path d="M8 38V16L24 6l16 10v22H8z" fill="rgba(255,255,255,0.9)" stroke="rgba(0,0,0,0.2)" stroke-width="1"/><rect x="18" y="26" width="12" height="12" fill="currentColor" opacity="0.6"/><path d="M20 16h8v6h-8z" fill="currentColor" opacity="0.4"/></svg>`,
    RED: `<svg viewBox="0 0 48 48" class="card-icon-svg"><rect x="8" y="12" width="32" height="26" rx="2" fill="rgba(255,255,255,0.9)" stroke="rgba(0,0,0,0.2)" stroke-width="1"/><rect x="12" y="16" width="8" height="8" fill="currentColor" opacity="0.5"/><rect x="28" y="16" width="8" height="8" fill="currentColor" opacity="0.5"/><rect x="20" y="28" width="8" height="10" fill="currentColor" opacity="0.6"/></svg>`,
    YELLOW: `<svg viewBox="0 0 48 48" class="card-icon-svg"><path d="M6 38V14L24 4l18 10v24H6z" fill="rgba(255,255,255,0.9)" stroke="rgba(0,0,0,0.2)" stroke-width="1"/><rect x="18" y="24" width="12" height="14" fill="currentColor" opacity="0.6"/><circle cx="24" cy="14" r="5" fill="currentColor" opacity="0.5"/></svg>`,
    GREEN: `<svg viewBox="0 0 48 48" class="card-icon-svg"><rect x="6" y="10" width="36" height="28" rx="3" fill="rgba(255,255,255,0.9)" stroke="rgba(0,0,0,0.2)" stroke-width="1"/><rect x="10" y="14" width="10" height="10" fill="currentColor" opacity="0.5"/><rect x="28" y="14" width="10" height="10" fill="currentColor" opacity="0.5"/><rect x="18" y="26" width="12" height="12" fill="currentColor" opacity="0.6"/></svg>`,
    BLUE: `<svg viewBox="0 0 48 48" class="card-icon-svg"><path d="M4 38V12L24 2l20 10v26H4z" fill="rgba(255,255,255,0.9)" stroke="rgba(0,0,0,0.2)" stroke-width="1"/><rect x="16" y="22" width="16" height="16" fill="currentColor" opacity="0.6"/><path d="M18 12h12v6H18z" fill="currentColor" opacity="0.5"/><circle cx="24" cy="8" r="3" fill="currentColor" opacity="0.4"/></svg>`,
    RAILROAD: `<svg viewBox="0 0 48 48" class="card-icon-svg"><rect x="8" y="32" width="32" height="4" fill="rgba(255,255,255,0.8)"/><rect x="12" y="28" width="4" height="8" fill="rgba(255,255,255,0.9)"/><rect x="32" y="28" width="4" height="8" fill="rgba(255,255,255,0.9)"/><circle cx="24" cy="20" r="10" fill="rgba(255,255,255,0.9)" stroke="rgba(0,0,0,0.2)" stroke-width="1"/><circle cx="24" cy="20" r="5" fill="currentColor" opacity="0.6"/></svg>`,
    UTILITY: `<svg viewBox="0 0 48 48" class="card-icon-svg"><path d="M24 6L28 18H38L30 26L34 38L24 30L14 38L18 26L10 18H20L24 6Z" fill="rgba(255,255,255,0.9)" stroke="rgba(0,0,0,0.2)" stroke-width="1"/><circle cx="24" cy="24" r="6" fill="currentColor" opacity="0.5"/></svg>`
  };
  return icons[colorType] || icons.BROWN;
}

function getWildIcon() {
  return `<svg viewBox="0 0 48 48" class="card-icon-svg wild-icon">
    <circle cx="24" cy="24" r="18" fill="rgba(255,255,255,0.95)" stroke="rgba(0,0,0,0.2)" stroke-width="1"/>
    <text x="24" y="20" text-anchor="middle" fill="#333" font-size="10" font-weight="800">WILD</text>
    <path d="M16 28L24 34L32 28" stroke="#333" stroke-width="2" fill="none"/>
  </svg>`;
}

function getRainbowWildIcon() {
  return `<svg viewBox="0 0 48 48" class="card-icon-svg wild-icon">
    <circle cx="24" cy="24" r="18" fill="rgba(255,255,255,0.95)" stroke="rgba(0,0,0,0.2)" stroke-width="1"/>
    <circle cx="24" cy="24" r="12" fill="none" stroke="url(#rainbow)" stroke-width="4"/>
    <text x="24" y="28" text-anchor="middle" fill="#333" font-size="8" font-weight="800">ANY</text>
    <defs>
      <linearGradient id="rainbow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#e74c3c"/>
        <stop offset="25%" style="stop-color:#f39c12"/>
        <stop offset="50%" style="stop-color:#27ae60"/>
        <stop offset="75%" style="stop-color:#3498db"/>
        <stop offset="100%" style="stop-color:#9b59b6"/>
      </linearGradient>
    </defs>
  </svg>`;
}

function getActionIcon(action) {
  const icons = {
    passGo: `<svg viewBox="0 0 48 48" class="card-icon-svg action-icon">
      <circle cx="24" cy="24" r="18" fill="#27ae60"/>
      <path d="M16 24L22 30L34 18" stroke="white" stroke-width="4" fill="none" stroke-linecap="round"/>
      <text x="24" y="42" text-anchor="middle" fill="#9b59b6" font-size="8" font-weight="800">GO</text>
    </svg>`,
    birthday: `<svg viewBox="0 0 48 48" class="card-icon-svg action-icon">
      <rect x="12" y="20" width="24" height="18" rx="2" fill="#f39c12"/>
      <rect x="10" y="16" width="28" height="6" rx="1" fill="#e74c3c"/>
      <rect x="22" y="8" width="4" height="12" fill="#f39c12"/>
      <circle cx="24" cy="6" r="3" fill="#e74c3c"/>
    </svg>`,
    debtCollector: `<svg viewBox="0 0 48 48" class="card-icon-svg action-icon">
      <circle cx="24" cy="18" r="10" fill="#3498db"/>
      <path d="M14 32C14 26 19 24 24 24S34 26 34 32V38H14V32Z" fill="#3498db"/>
      <text x="24" y="44" text-anchor="middle" fill="#9b59b6" font-size="7" font-weight="800">$5M</text>
    </svg>`,
    slyDeal: `<svg viewBox="0 0 48 48" class="card-icon-svg action-icon">
      <path d="M8 20L24 8L40 20V38H8V20Z" fill="#e74c3c" opacity="0.8"/>
      <path d="M34 24L42 18V36L34 30V24Z" fill="#27ae60"/>
      <path d="M28 26L36 32" stroke="white" stroke-width="2" stroke-dasharray="2,2"/>
    </svg>`,
    forcedDeal: `<svg viewBox="0 0 48 48" class="card-icon-svg action-icon">
      <rect x="6" y="14" width="14" height="20" rx="2" fill="#3498db"/>
      <rect x="28" y="14" width="14" height="20" rx="2" fill="#e74c3c"/>
      <path d="M20 20H28M20 28H28" stroke="#9b59b6" stroke-width="3" marker-end="url(#arrow)"/>
      <path d="M28 24H20" stroke="#9b59b6" stroke-width="3"/>
    </svg>`,
    dealBreaker: `<svg viewBox="0 0 48 48" class="card-icon-svg action-icon">
      <path d="M8 16L24 6L40 16V38H8V16Z" fill="#e74c3c"/>
      <path d="M24 14L40 24V42H8V24L24 14Z" fill="#c0392b"/>
      <text x="24" y="34" text-anchor="middle" fill="white" font-size="10" font-weight="900">!!!</text>
    </svg>`,
    sayNo: `<svg viewBox="0 0 48 48" class="card-icon-svg action-icon">
      <circle cx="24" cy="24" r="18" fill="#e74c3c"/>
      <path d="M14 14L34 34M34 14L14 34" stroke="white" stroke-width="5" stroke-linecap="round"/>
    </svg>`,
    house: `<svg viewBox="0 0 48 48" class="card-icon-svg action-icon">
      <path d="M10 40V22L24 10L38 22V40H10Z" fill="#27ae60"/>
      <rect x="20" y="28" width="8" height="12" fill="#1e8449"/>
      <path d="M24 10L10 22H38L24 10Z" fill="#2ecc71"/>
    </svg>`,
    hotel: `<svg viewBox="0 0 48 48" class="card-icon-svg action-icon">
      <rect x="8" y="12" width="32" height="28" fill="#e74c3c"/>
      <rect x="12" y="16" width="6" height="6" fill="#c0392b"/>
      <rect x="21" y="16" width="6" height="6" fill="#c0392b"/>
      <rect x="30" y="16" width="6" height="6" fill="#c0392b"/>
      <rect x="12" y="26" width="6" height="6" fill="#c0392b"/>
      <rect x="21" y="26" width="6" height="6" fill="#c0392b"/>
      <rect x="30" y="26" width="6" height="6" fill="#c0392b"/>
      <rect x="20" y="34" width="8" height="6" fill="#922b21"/>
    </svg>`,
    doubleRent: `<svg viewBox="0 0 48 48" class="card-icon-svg action-icon">
      <circle cx="24" cy="24" r="18" fill="#f39c12"/>
      <text x="24" y="32" text-anchor="middle" fill="white" font-size="22" font-weight="900">2X</text>
    </svg>`
  };
  return icons[action] || `<svg viewBox="0 0 48 48" class="card-icon-svg"><circle cx="24" cy="24" r="18" fill="#9b59b6"/><text x="24" y="30" text-anchor="middle" fill="white" font-size="20" font-weight="900">!</text></svg>`;
}

function getRentIcon() {
  return `<svg viewBox="0 0 48 48" class="card-icon-svg rent-icon">
    <circle cx="24" cy="24" r="18" fill="rgba(255,255,255,0.95)" stroke="rgba(0,0,0,0.2)" stroke-width="1"/>
    <text x="24" y="22" text-anchor="middle" fill="#e74c3c" font-size="10" font-weight="900">RENT</text>
    <text x="24" y="34" text-anchor="middle" fill="#333" font-size="12" font-weight="900">$$$</text>
  </svg>`;
}

// Card interaction
function handleCardClick(card, index) {
  const isMyTurn = gameState.currentPlayerId === myPlayerId;

  // Handle discarding
  if (gameState.mustDiscard > 0 && isMyTurn) {
    socket.emit('discardCard', { cardIndex: index });
    return;
  }

  if (!isMyTurn || !gameState.hasDrawnThisTurn || gameState.actionsRemaining <= 0) {
    return;
  }

  selectedCard = { card, index };

  // Handle different card types
  switch (card.type) {
    case 'money':
      // Play directly to bank
      socket.emit('playCard', { cardIndex: index });
      selectedCard = null;
      break;

    case 'property':
      // Play directly to properties
      socket.emit('playCard', { cardIndex: index });
      selectedCard = null;
      break;

    case 'property_wild':
      // Show color selection
      showColorSelection(card.colors, (color) => {
        socket.emit('playCard', { cardIndex: index, action: color });
        selectedCard = null;
      });
      break;

    case 'property_wild_all':
      // Show all colors
      showColorSelection(Object.keys(gameState.propertyColors), (color) => {
        socket.emit('playCard', { cardIndex: index, action: color });
        selectedCard = null;
      });
      break;

    case 'action':
      showActionChoiceModal(card, index, () => handleActionCard(card, index));
      break;

    case 'rent':
      showActionChoiceModal(card, index, () => handleRentCard(card, index));
      break;
  }
}

// Action card choice modal - Use or Bank
function showActionChoiceModal(card, index, useCallback) {
  document.getElementById('action-choice-title').textContent = card.name;
  document.getElementById('action-bank-value').textContent = card.value;

  // Set up button handlers
  document.getElementById('action-use-btn').onclick = () => {
    hideModal('actionChoice');
    useCallback();
  };

  document.getElementById('action-bank-btn').onclick = () => {
    hideModal('actionChoice');
    socket.emit('playCard', { cardIndex: index, bankAsAction: true });
    selectedCard = null;
  };

  document.getElementById('action-cancel-btn').onclick = () => {
    hideModal('actionChoice');
    selectedCard = null;
  };

  showModal('actionChoice');
}

function handleActionCard(card, index) {
  switch (card.action) {
    case 'passGo':
      socket.emit('playCard', { cardIndex: index });
      selectedCard = null;
      break;

    case 'birthday':
      socket.emit('playCard', { cardIndex: index });
      selectedCard = null;
      break;

    case 'debtCollector':
      showPlayerSelection('Select a player to collect $5M from', (playerId) => {
        socket.emit('playCard', { cardIndex: index, target: playerId });
        selectedCard = null;
      });
      break;

    case 'slyDeal':
      showPropertySelection('Select a property to steal (not from complete sets)', false, (target) => {
        socket.emit('playCard', { cardIndex: index, target });
        selectedCard = null;
      });
      break;

    case 'dealBreaker':
      showPropertySelection('Select a complete set to steal', true, (target) => {
        socket.emit('playCard', { cardIndex: index, target });
        selectedCard = null;
      });
      break;

    case 'forcedDeal':
      showForcedDealSelection(index);
      break;

    case 'house':
    case 'hotel':
      showMySetSelection(`Select a complete set to add ${card.action}`, (color) => {
        socket.emit('playCard', { cardIndex: index, target: { color } });
        selectedCard = null;
      });
      break;

    case 'sayNo':
      showToast('"Just Say No!" can only be played in response', 'error');
      selectedCard = null;
      break;

    case 'doubleRent':
      showDoubleRentSelection(index);
      break;

    default:
      // Play as money
      socket.emit('playCard', { cardIndex: index });
      selectedCard = null;
  }
}

function handleRentCard(card, index) {
  const myPlayer = gameState.players.find(p => p.id === myPlayerId);
  const availableColors = card.colors === 'ALL' ?
    Object.keys(myPlayer.properties) :
    card.colors.filter(c => myPlayer.properties[c] && myPlayer.properties[c].length > 0);

  if (availableColors.length === 0) {
    showToast('You need properties of this color to charge rent', 'error');
    selectedCard = null;
    return;
  }

  showColorSelection(availableColors, (color) => {
    if (card.colors === 'ALL') {
      // Wild rent - need to select target player
      showPlayerSelection('Select a player to charge rent', (playerId) => {
        socket.emit('playCard', { cardIndex: index, action: color, target: { playerId } });
        selectedCard = null;
      });
    } else {
      socket.emit('playCard', { cardIndex: index, action: color });
      selectedCard = null;
    }
  });
}

// Double Rent card selection - show available rent cards to play with
function showDoubleRentSelection(doubleRentIndex) {
  const myPlayer = gameState.players.find(p => p.id === myPlayerId);

  // Find all rent cards in hand
  const rentCards = myPlayer.hand
    .map((card, index) => ({ card, index }))
    .filter(({ card, index }) => card.type === 'rent' && index !== doubleRentIndex);

  if (rentCards.length === 0) {
    showToast('You need a Rent card to play with Double the Rent', 'error');
    selectedCard = null;
    return;
  }

  // Check if we have enough actions (double rent + rent = 2 actions)
  if (gameState.actionsRemaining < 2) {
    showToast('You need at least 2 actions to play Double the Rent', 'error');
    selectedCard = null;
    return;
  }

  document.getElementById('target-title').textContent = 'Select a Rent Card to Double';
  const container = document.getElementById('target-options');
  container.innerHTML = '';

  const colorInfo = gameState.propertyColors;

  rentCards.forEach(({ card, index }) => {
    // Check if player has properties for this rent card
    let hasValidProperties = false;
    let colorNames = '';

    if (card.colors === 'ALL') {
      hasValidProperties = Object.keys(myPlayer.properties).some(c =>
        myPlayer.properties[c] && myPlayer.properties[c].length > 0
      );
      colorNames = 'Wild (Any Color)';
    } else {
      hasValidProperties = card.colors.some(c =>
        myPlayer.properties[c] && myPlayer.properties[c].length > 0
      );
      colorNames = card.colors.map(c => colorInfo[c]?.name || c).join('/');
    }

    if (!hasValidProperties) return;

    const div = document.createElement('div');
    div.className = 'target-option';

    // Create color display
    let bgStyle = '';
    if (card.colors === 'ALL') {
      bgStyle = 'background: linear-gradient(45deg, #e74c3c, #f39c12, #27ae60, #3498db);';
    } else {
      const colors = card.colors.map(c => colorInfo[c]?.color || '#333');
      bgStyle = `background: linear-gradient(135deg, ${colors[0]} 50%, ${colors[1]} 50%);`;
    }

    div.innerHTML = `
      <div style="width: 30px; height: 40px; ${bgStyle} border-radius: 4px;"></div>
      <div>
        <strong>${card.name}</strong>
        <div style="font-size: 12px; color: #888;">${colorNames}</div>
      </div>
    `;
    div.addEventListener('click', () => {
      container.querySelectorAll('.target-option').forEach(o => o.classList.remove('selected'));
      div.classList.add('selected');
      selectedTarget = { rentCardIndex: index, rentCard: card };
      document.getElementById('target-confirm').disabled = false;
    });
    container.appendChild(div);
  });

  if (container.children.length === 0) {
    container.innerHTML = '<div style="text-align: center; color: #888; padding: 20px;">No valid rent cards (you need properties matching the rent card colors)</div>';
  }

  selectedTarget = null;
  document.getElementById('target-confirm').disabled = true;
  document.getElementById('target-confirm').onclick = () => {
    hideModal('target');
    if (selectedTarget) {
      // Now handle the rent card selection like normal, but with doubleRent flag
      handleDoubleRentWithCard(doubleRentIndex, selectedTarget.rentCardIndex, selectedTarget.rentCard);
    }
  };

  showModal('target');
}

function handleDoubleRentWithCard(doubleRentIndex, rentCardIndex, rentCard) {
  const myPlayer = gameState.players.find(p => p.id === myPlayerId);

  // Determine available colors
  const availableColors = rentCard.colors === 'ALL' ?
    Object.keys(myPlayer.properties).filter(c => myPlayer.properties[c] && myPlayer.properties[c].length > 0) :
    rentCard.colors.filter(c => myPlayer.properties[c] && myPlayer.properties[c].length > 0);

  if (availableColors.length === 0) {
    showToast('You need properties of this color to charge rent', 'error');
    selectedCard = null;
    return;
  }

  showColorSelection(availableColors, (color) => {
    if (rentCard.colors === 'ALL') {
      // Wild rent - need to select target player
      showPlayerSelection('Select a player to charge rent', (playerId) => {
        socket.emit('playCard', {
          cardIndex: rentCardIndex,
          action: color,
          target: { playerId, doubleRent: true, doubleRentIndex }
        });
        selectedCard = null;
      });
    } else {
      socket.emit('playCard', {
        cardIndex: rentCardIndex,
        action: color,
        target: { doubleRent: true, doubleRentIndex }
      });
      selectedCard = null;
    }
  });
}

// Selection modals
function showColorSelection(colors, callback) {
  const container = document.getElementById('color-options');
  container.innerHTML = '';

  const colorInfo = gameState.propertyColors;

  colors.forEach(color => {
    const info = colorInfo[color];
    if (!info) return;

    const div = document.createElement('div');
    div.className = 'color-option';
    div.style.backgroundColor = info.color;
    div.style.color = ['YELLOW', 'UTILITY'].includes(color) ? '#333' : 'white';
    div.textContent = info.name;
    div.addEventListener('click', () => {
      hideModal('color');
      callback(color);
    });
    container.appendChild(div);
  });

  showModal('color');
}

function showPlayerSelection(title, callback) {
  document.getElementById('target-title').textContent = title;
  const container = document.getElementById('target-options');
  container.innerHTML = '';

  const opponents = gameState.players.filter(p => p.id !== myPlayerId);

  opponents.forEach(player => {
    const div = document.createElement('div');
    div.className = 'target-option';
    div.innerHTML = `
      <div class="opponent-avatar" style="background-color: ${player.avatar}">
        ${player.name.charAt(0).toUpperCase()}
      </div>
      <div>
        <strong>${escapeHtml(player.name)}</strong>
        <div style="font-size: 12px; color: #888;">Bank: $${player.bankTotal}M</div>
      </div>
    `;
    div.addEventListener('click', () => {
      container.querySelectorAll('.target-option').forEach(o => o.classList.remove('selected'));
      div.classList.add('selected');
      selectedTarget = player.id;
      document.getElementById('target-confirm').disabled = false;
    });
    container.appendChild(div);
  });

  selectedTarget = null;
  document.getElementById('target-confirm').disabled = true;
  document.getElementById('target-confirm').onclick = () => {
    hideModal('target');
    callback(selectedTarget);
  };

  showModal('target');
}

function showPropertySelection(title, completeOnly, callback) {
  document.getElementById('target-title').textContent = title;
  const container = document.getElementById('target-options');
  container.innerHTML = '';

  const opponents = gameState.players.filter(p => p.id !== myPlayerId);
  const colorInfo = gameState.propertyColors;

  opponents.forEach(player => {
    Object.entries(player.properties).forEach(([color, cards]) => {
      const info = colorInfo[color];
      if (!info) return;

      const propertyCards = cards.filter(c =>
        c.type === 'property' || c.type === 'property_wild' || c.type === 'property_wild_all'
      );
      const isComplete = propertyCards.length >= info.setSize;

      if (completeOnly && !isComplete) return;
      if (!completeOnly && isComplete) return;

      cards.forEach((card, cardIndex) => {
        if (card.type !== 'property' && card.type !== 'property_wild' && card.type !== 'property_wild_all') return;

        const div = document.createElement('div');
        div.className = 'target-option';
        div.innerHTML = `
          <div style="width: 30px; height: 40px; background: ${info.color}; border-radius: 4px;"></div>
          <div>
            <strong>${escapeHtml(player.name)}</strong>
            <div style="font-size: 12px; color: ${info.color};">${card.name}</div>
          </div>
        `;
        div.addEventListener('click', () => {
          container.querySelectorAll('.target-option').forEach(o => o.classList.remove('selected'));
          div.classList.add('selected');
          selectedTarget = { playerId: player.id, color, cardIndex };
          document.getElementById('target-confirm').disabled = false;
        });
        container.appendChild(div);
      });
    });
  });

  if (container.children.length === 0) {
    container.innerHTML = '<div style="text-align: center; color: #888; padding: 20px;">No valid targets</div>';
  }

  selectedTarget = null;
  document.getElementById('target-confirm').disabled = true;
  document.getElementById('target-confirm').onclick = () => {
    hideModal('target');
    callback(selectedTarget);
  };

  showModal('target');
}

function showMySetSelection(title, callback) {
  document.getElementById('target-title').textContent = title;
  const container = document.getElementById('target-options');
  container.innerHTML = '';

  const myPlayer = gameState.players.find(p => p.id === myPlayerId);
  const colorInfo = gameState.propertyColors;

  Object.entries(myPlayer.properties).forEach(([color, cards]) => {
    if (color === 'RAILROAD' || color === 'UTILITY') return;

    const info = colorInfo[color];
    if (!info) return;

    const propertyCards = cards.filter(c =>
      c.type === 'property' || c.type === 'property_wild' || c.type === 'property_wild_all'
    );

    if (propertyCards.length < info.setSize) return;

    const div = document.createElement('div');
    div.className = 'target-option';
    div.innerHTML = `
      <div style="width: 30px; height: 40px; background: ${info.color}; border-radius: 4px;"></div>
      <div>
        <strong>${info.name}</strong>
        <div style="font-size: 12px; color: #888;">${propertyCards.length} properties</div>
      </div>
    `;
    div.addEventListener('click', () => {
      container.querySelectorAll('.target-option').forEach(o => o.classList.remove('selected'));
      div.classList.add('selected');
      selectedTarget = color;
      document.getElementById('target-confirm').disabled = false;
    });
    container.appendChild(div);
  });

  if (container.children.length === 0) {
    container.innerHTML = '<div style="text-align: center; color: #888; padding: 20px;">No complete sets available</div>';
  }

  selectedTarget = null;
  document.getElementById('target-confirm').disabled = true;
  document.getElementById('target-confirm').onclick = () => {
    hideModal('target');
    callback(selectedTarget);
  };

  showModal('target');
}

function confirmTarget() {
  hideModal('target');
}

// Forced Deal - two-step selection
let forcedDealState = {
  cardIndex: null,
  theirProperty: null,
  yourProperty: null
};

function showForcedDealSelection(cardIndex) {
  forcedDealState = { cardIndex, theirProperty: null, yourProperty: null };

  // First, check if player has any properties to trade
  const myPlayer = gameState.players.find(p => p.id === myPlayerId);
  const myPropertyCount = Object.values(myPlayer.properties).reduce((sum, cards) => {
    return sum + cards.filter(c =>
      c.type === 'property' || c.type === 'property_wild' || c.type === 'property_wild_all'
    ).length;
  }, 0);

  if (myPropertyCount === 0) {
    showToast('You need properties to trade', 'error');
    selectedCard = null;
    return;
  }

  // Check if opponents have any stealable properties
  const opponents = gameState.players.filter(p => p.id !== myPlayerId);
  const colorInfo = gameState.propertyColors;
  let hasStealableProperties = false;

  opponents.forEach(player => {
    Object.entries(player.properties).forEach(([color, cards]) => {
      const info = colorInfo[color];
      if (!info) return;
      const propertyCards = cards.filter(c =>
        c.type === 'property' || c.type === 'property_wild' || c.type === 'property_wild_all'
      );
      // Can't steal from complete sets
      if (propertyCards.length > 0 && propertyCards.length < info.setSize) {
        hasStealableProperties = true;
      }
    });
  });

  if (!hasStealableProperties) {
    showToast('No properties available to trade for', 'error');
    selectedCard = null;
    return;
  }

  // Step 1: Select opponent's property
  showForcedDealStep1();
}

function showForcedDealStep1() {
  document.getElementById('target-title').textContent = 'Step 1: Select property to take';
  const container = document.getElementById('target-options');
  container.innerHTML = '';

  const opponents = gameState.players.filter(p => p.id !== myPlayerId);
  const colorInfo = gameState.propertyColors;

  opponents.forEach(player => {
    Object.entries(player.properties).forEach(([color, cards]) => {
      const info = colorInfo[color];
      if (!info) return;

      const propertyCards = cards.filter(c =>
        c.type === 'property' || c.type === 'property_wild' || c.type === 'property_wild_all'
      );

      // Can't steal from complete sets
      if (propertyCards.length >= info.setSize) return;

      cards.forEach((card, cardIndex) => {
        if (card.type !== 'property' && card.type !== 'property_wild' && card.type !== 'property_wild_all') return;

        const div = document.createElement('div');
        div.className = 'target-option';
        div.innerHTML = `
          <div style="width: 30px; height: 40px; background: ${info.color}; border-radius: 4px;"></div>
          <div>
            <strong>${escapeHtml(player.name)}</strong>
            <div style="font-size: 12px; color: ${info.color};">${card.name}</div>
          </div>
        `;
        div.addEventListener('click', () => {
          container.querySelectorAll('.target-option').forEach(o => o.classList.remove('selected'));
          div.classList.add('selected');
          forcedDealState.theirProperty = { playerId: player.id, color, cardIndex };
          document.getElementById('target-confirm').disabled = false;
        });
        container.appendChild(div);
      });
    });
  });

  if (container.children.length === 0) {
    container.innerHTML = '<div style="text-align: center; color: #888; padding: 20px;">No properties available to take</div>';
  }

  document.getElementById('target-confirm').disabled = true;
  document.getElementById('target-confirm').onclick = () => {
    hideModal('target');
    if (forcedDealState.theirProperty) {
      showForcedDealStep2();
    }
  };

  showModal('target');
}

function showForcedDealStep2() {
  document.getElementById('target-title').textContent = 'Step 2: Select your property to give';
  const container = document.getElementById('target-options');
  container.innerHTML = '';

  const myPlayer = gameState.players.find(p => p.id === myPlayerId);
  const colorInfo = gameState.propertyColors;

  Object.entries(myPlayer.properties).forEach(([color, cards]) => {
    const info = colorInfo[color];
    if (!info) return;

    cards.forEach((card, cardIndex) => {
      if (card.type !== 'property' && card.type !== 'property_wild' && card.type !== 'property_wild_all') return;

      const div = document.createElement('div');
      div.className = 'target-option';
      div.innerHTML = `
        <div style="width: 30px; height: 40px; background: ${info.color}; border-radius: 4px;"></div>
        <div>
          <strong>${info.name}</strong>
          <div style="font-size: 12px; color: ${info.color};">${card.name}</div>
        </div>
      `;
      div.addEventListener('click', () => {
        container.querySelectorAll('.target-option').forEach(o => o.classList.remove('selected'));
        div.classList.add('selected');
        forcedDealState.yourProperty = { color, cardIndex };
        document.getElementById('target-confirm').disabled = false;
      });
      container.appendChild(div);
    });
  });

  if (container.children.length === 0) {
    container.innerHTML = '<div style="text-align: center; color: #888; padding: 20px;">No properties to give</div>';
  }

  document.getElementById('target-confirm').disabled = true;
  document.getElementById('target-confirm').onclick = () => {
    hideModal('target');
    if (forcedDealState.yourProperty) {
      // Execute the forced deal
      socket.emit('playCard', {
        cardIndex: forcedDealState.cardIndex,
        target: {
          playerId: forcedDealState.theirProperty.playerId,
          theirColor: forcedDealState.theirProperty.color,
          theirCardIndex: forcedDealState.theirProperty.cardIndex,
          yourColor: forcedDealState.yourProperty.color,
          yourCardIndex: forcedDealState.yourProperty.cardIndex
        }
      });
      selectedCard = null;
      forcedDealState = { cardIndex: null, theirProperty: null, yourProperty: null };
    }
  };

  showModal('target');
}

// Pending action handling
function handlePendingAction() {
  const action = gameState.pendingAction;

  // Check if there's a Say No chain and I need to counter
  if (action.sayNoChain && action.sayNoChain.awaitingCounter === myPlayerId) {
    showCounterSayNoModal(action);
    return;
  }

  // Check if I need to respond
  if (action.respondingPlayers.includes(myPlayerId)) {
    // Different handling for different action types
    if (action.type === 'slyDeal' || action.type === 'dealBreaker') {
      showStealConfirmModal(action);
    } else if (action.type === 'forcedDeal') {
      showForcedDealConfirmModal(action);
    } else {
      // rent, birthday, debtCollector - show payment modal
      showPaymentModal(action);
    }
  }
}

// Show modal to counter a Say No with another Say No
function showCounterSayNoModal(action) {
  const myPlayer = gameState.players.find(p => p.id === myPlayerId);
  const againstPlayer = gameState.players.find(p => p.id === action.sayNoChain.againstPlayer);

  document.getElementById('target-title').textContent = 'Counter with Say No?';
  const container = document.getElementById('target-options');

  // Determine what the original action was
  let actionDesc = '';
  if (action.type === 'dealBreaker') {
    actionDesc = 'steal a complete property set';
  } else if (action.type === 'slyDeal') {
    actionDesc = 'steal a property';
  } else if (action.type === 'forcedDeal') {
    actionDesc = 'force a property trade';
  } else if (action.type === 'rent') {
    actionDesc = 'charge rent';
  } else if (action.type === 'birthday') {
    actionDesc = 'collect birthday money';
  } else if (action.type === 'debtCollector') {
    actionDesc = 'collect debt';
  }

  const sayNoCount = action.sayNoChain.count;
  const willSucceedIfCounter = sayNoCount % 2 === 1; // If odd Say Nos played, countering makes action succeed

  container.innerHTML = `
    <div style="text-align: center; padding: 20px;">
      <div class="say-no-icon" style="width: 80px; height: 80px; margin: 0 auto 20px;">
        <svg viewBox="0 0 48 48" style="width: 50px; height: 50px;">
          <circle cx="24" cy="24" r="20" fill="white"/>
          <path d="M14 14L34 34M34 14L14 34" stroke="#e74c3c" stroke-width="6" stroke-linecap="round"/>
        </svg>
      </div>
      <p style="color: #e74c3c; font-size: 18px; font-weight: bold; margin-bottom: 16px;">
        ${escapeHtml(againstPlayer.name)} played Just Say No!
      </p>
      <p style="color: #888; margin-bottom: 16px;">
        ${sayNoCount === 1 ? 'Your action to ' + actionDesc + ' was blocked.' : 'The Say No chain continues!'}
      </p>
      <p style="color: #f39c12; font-weight: bold;">
        ${willSucceedIfCounter ? 'Counter to make your action succeed!' : 'Counter to block their action!'}
      </p>
    </div>
  `;

  // Check if I have a Say No card
  const hasSayNo = myPlayer.hand.some(c => c.action === 'sayNo');

  // Update buttons
  document.getElementById('target-confirm').textContent = 'Let it go';
  document.getElementById('target-confirm').disabled = false;
  document.getElementById('target-cancel').textContent = hasSayNo ? 'Just Say No!' : '';
  document.getElementById('target-cancel').style.display = hasSayNo ? 'block' : 'none';

  document.getElementById('target-confirm').onclick = () => {
    hideModal('target');
    socket.emit('respondToAction', { response: 'declineCounter' });
  };

  document.getElementById('target-cancel').onclick = () => {
    if (hasSayNo) {
      hideModal('target');
      socket.emit('respondToAction', { response: 'counterSayNo' });
    }
  };

  showModal('target');
}

// Show confirmation modal for Sly Deal / Deal Breaker (opponent can Say No or Accept)
function showStealConfirmModal(action) {
  const myPlayer = gameState.players.find(p => p.id === myPlayerId);
  const fromPlayer = gameState.players.find(p => p.id === action.fromPlayer);
  const colorInfo = gameState.propertyColors;

  document.getElementById('target-title').textContent = action.type === 'slyDeal' ? 'Sly Deal!' : 'Deal Breaker!';
  const container = document.getElementById('target-options');
  container.innerHTML = '';

  if (action.type === 'slyDeal') {
    const stolenCard = myPlayer.properties[action.color]?.[action.cardIndex];
    const color = colorInfo[action.color];
    container.innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <p style="color: #e74c3c; font-size: 18px; font-weight: bold; margin-bottom: 16px;">
          ${escapeHtml(fromPlayer.name)} wants to steal your property!
        </p>
        <div style="display: flex; justify-content: center; margin: 20px 0;">
          <div style="width: 60px; height: 80px; background: ${color?.color || '#333'}; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px; text-align: center; padding: 4px;">
            ${stolenCard?.name || 'Property'}
          </div>
        </div>
        <p style="color: #888;">This property will go to ${escapeHtml(fromPlayer.name)}</p>
      </div>
    `;
  } else {
    // Deal Breaker - entire set
    const color = colorInfo[action.color];
    const setCards = myPlayer.properties[action.color] || [];
    container.innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <p style="color: #e74c3c; font-size: 18px; font-weight: bold; margin-bottom: 16px;">
          ${escapeHtml(fromPlayer.name)} wants to steal your complete ${color?.name || action.color} set!
        </p>
        <div style="display: flex; justify-content: center; gap: 8px; margin: 20px 0; flex-wrap: wrap;">
          ${setCards.map(card => `
            <div style="width: 50px; height: 70px; background: ${color?.color || '#333'}; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 10px; text-align: center; padding: 4px;">
              ${card.name || 'Card'}
            </div>
          `).join('')}
        </div>
        <p style="color: #888;">This entire set will go to ${escapeHtml(fromPlayer.name)}</p>
      </div>
    `;
  }

  // Check for Say No card
  const hasSayNo = myPlayer.hand.some(c => c.action === 'sayNo');

  // Update buttons
  document.getElementById('target-confirm').textContent = 'Accept';
  document.getElementById('target-confirm').disabled = false;
  document.getElementById('target-cancel').textContent = hasSayNo ? 'Just Say No!' : 'Cancel';
  document.getElementById('target-cancel').style.display = hasSayNo ? 'block' : 'none';

  document.getElementById('target-confirm').onclick = () => {
    hideModal('target');
    socket.emit('respondToAction', { response: 'accept' });
  };

  document.getElementById('target-cancel').onclick = () => {
    if (hasSayNo) {
      hideModal('target');
      socket.emit('respondToAction', { response: 'sayNo' });
    }
  };

  showModal('target');
}

// Show confirmation modal for Forced Deal (opponent can Say No or Accept the swap)
function showForcedDealConfirmModal(action) {
  const myPlayer = gameState.players.find(p => p.id === myPlayerId);
  const fromPlayer = gameState.players.find(p => p.id === action.fromPlayer);
  const colorInfo = gameState.propertyColors;

  document.getElementById('target-title').textContent = 'Forced Deal!';
  const container = document.getElementById('target-options');
  container.innerHTML = '';

  const theirCard = myPlayer.properties[action.theirColor]?.[action.theirCardIndex];
  const yourCard = fromPlayer.properties[action.yourColor]?.[action.yourCardIndex];
  const theirColor = colorInfo[action.theirColor];
  const yourColor = colorInfo[action.yourColor];

  container.innerHTML = `
    <div style="text-align: center; padding: 20px;">
      <p style="color: #f39c12; font-size: 18px; font-weight: bold; margin-bottom: 16px;">
        ${escapeHtml(fromPlayer.name)} wants to trade properties!
      </p>
      <div style="display: flex; justify-content: center; align-items: center; gap: 20px; margin: 20px 0;">
        <div style="text-align: center;">
          <p style="color: #e74c3c; font-size: 12px; margin-bottom: 8px;">You Give</p>
          <div style="width: 60px; height: 80px; background: ${theirColor?.color || '#333'}; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px; text-align: center; padding: 4px;">
            ${theirCard?.name || 'Property'}
          </div>
        </div>
        <div style="font-size: 24px; color: #888;">⇄</div>
        <div style="text-align: center;">
          <p style="color: #27ae60; font-size: 12px; margin-bottom: 8px;">You Get</p>
          <div style="width: 60px; height: 80px; background: ${yourColor?.color || '#333'}; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px; text-align: center; padding: 4px;">
            ${yourCard?.name || 'Property'}
          </div>
        </div>
      </div>
    </div>
  `;

  // Check for Say No card
  const hasSayNo = myPlayer.hand.some(c => c.action === 'sayNo');

  // Update buttons
  document.getElementById('target-confirm').textContent = 'Accept Trade';
  document.getElementById('target-confirm').disabled = false;
  document.getElementById('target-cancel').textContent = hasSayNo ? 'Just Say No!' : 'Cancel';
  document.getElementById('target-cancel').style.display = hasSayNo ? 'block' : 'none';

  document.getElementById('target-confirm').onclick = () => {
    hideModal('target');
    socket.emit('respondToAction', { response: 'accept' });
  };

  document.getElementById('target-cancel').onclick = () => {
    if (hasSayNo) {
      hideModal('target');
      socket.emit('respondToAction', { response: 'sayNo' });
    }
  };

  showModal('target');
}

let paymentSelection = { bank: [], properties: {} };

function showPaymentModal(action) {
  const myPlayer = gameState.players.find(p => p.id === myPlayerId);

  document.getElementById('payment-amount').textContent = `$${action.amount}`;

  // Calculate total assets
  let totalAssets = 0;
  myPlayer.bank.forEach(card => totalAssets += card.value);
  Object.values(myPlayer.properties).forEach(cards => {
    cards.forEach(card => totalAssets += card.value);
  });

  let info = '';
  if (action.type === 'rent') {
    info = `Pay rent for ${gameState.propertyColors[action.color]?.name || action.color}`;
  } else if (action.type === 'birthday') {
    info = "It's someone's birthday! Pay $2M";
  } else if (action.type === 'debtCollector') {
    info = 'Debt collector demands $5M';
  }

  // Add partial payment info if player can't afford full amount
  if (totalAssets < action.amount) {
    if (totalAssets === 0) {
      info += ' (You have nothing to pay)';
    } else {
      info += ` (You only have $${totalAssets}M - must give everything)`;
    }
  }
  document.getElementById('payment-info').textContent = info;

  // Check for Say No card
  const hasSayNo = myPlayer.hand.some(c => c.action === 'sayNo');
  const sayNoBtn = document.getElementById('say-no-btn');
  sayNoBtn.classList.toggle('hidden', !hasSayNo);

  // Render bank cards
  const bankContainer = document.getElementById('payment-bank-cards');
  bankContainer.innerHTML = '';
  myPlayer.bank.forEach((card, index) => {
    const div = document.createElement('div');
    div.className = 'game-card mini';
    div.style.borderTopColor = '#27ae60';
    div.innerHTML = `
      <div class="card-header"><span class="card-value">$${card.value}</span></div>
      <div class="card-body" style="background: #27ae60; color: white; margin: 3px; border-radius: 3px;">$${card.value}</div>
    `;
    div.dataset.index = index;
    div.addEventListener('click', () => togglePaymentCard(div, 'bank', index, card.value));
    bankContainer.appendChild(div);
  });

  // Render property cards - group complete sets together
  const propContainer = document.getElementById('payment-property-cards');
  propContainer.innerHTML = '';
  const colorInfo = gameState.propertyColors;

  Object.entries(myPlayer.properties).forEach(([color, cards]) => {
    const info = colorInfo[color];
    if (!info) return;

    // Check if this is a complete set
    const propertyCards = cards.filter(c =>
      c.type === 'property' || c.type === 'property_wild' || c.type === 'property_wild_all'
    );
    const isCompleteSet = propertyCards.length >= info.setSize;

    if (isCompleteSet) {
      // Render complete set as a single selectable group
      const setDiv = document.createElement('div');
      setDiv.className = 'payment-set-group';
      setDiv.dataset.color = color;
      setDiv.dataset.isSet = 'true';

      const setTotal = cards.reduce((sum, c) => sum + c.value, 0);
      setDiv.innerHTML = `
        <div class="payment-set-label" style="background: ${info.color};">
          <span>${info.name} Set</span>
          <span>$${setTotal}M</span>
        </div>
        <div class="payment-set-cards">
          ${cards.map((card, idx) => `
            <div class="game-card mini" style="border-top-color: ${card.action === 'house' ? '#27ae60' : card.action === 'hotel' ? '#e74c3c' : info.color};">
              <div class="card-header"><span class="card-value">$${card.value}</span></div>
              <div class="card-body" style="background: ${card.action === 'house' ? '#27ae60' : card.action === 'hotel' ? '#e74c3c' : info.color}; color: white; margin: 3px; border-radius: 3px; font-size: 8px;">
                ${card.action === 'house' ? 'H' : card.action === 'hotel' ? 'HT' : info.name}
              </div>
            </div>
          `).join('')}
        </div>
      `;

      setDiv.addEventListener('click', () => togglePaymentSet(setDiv, color, cards));
      propContainer.appendChild(setDiv);
    } else {
      // Render individual cards for incomplete sets
      cards.forEach((card, cardIndex) => {
        const div = document.createElement('div');
        div.className = 'game-card mini';
        div.style.borderTopColor = card.action === 'house' ? '#27ae60' : card.action === 'hotel' ? '#e74c3c' : info.color;
        div.innerHTML = `
          <div class="card-header"><span class="card-value">$${card.value}</span></div>
          <div class="card-body" style="background: ${card.action === 'house' ? '#27ae60' : card.action === 'hotel' ? '#e74c3c' : info.color}; color: white; margin: 3px; border-radius: 3px; font-size: 8px;">
            ${card.action === 'house' ? 'H' : card.action === 'hotel' ? 'HT' : info.name}
          </div>
        `;
        div.dataset.color = color;
        div.dataset.index = cardIndex;
        div.addEventListener('click', () => togglePaymentCard(div, 'property', cardIndex, card.value, color));
        propContainer.appendChild(div);
      });
    }
  });

  paymentSelection = { bank: [], properties: {}, completeSets: [] };

  // Show warning if player can't afford full amount
  const warningEl = document.getElementById('payment-warning');
  if (totalAssets < action.amount && totalAssets > 0) {
    warningEl.textContent = 'You cannot afford the full amount. You must select all your cards.';
    warningEl.classList.remove('hidden');
  } else if (totalAssets === 0) {
    warningEl.textContent = 'You have no assets to pay with.';
    warningEl.classList.remove('hidden');
  } else {
    warningEl.classList.add('hidden');
  }

  // Set up Select All buttons
  document.getElementById('select-all-bank').onclick = () => selectAllBank(myPlayer);
  document.getElementById('select-all-props').onclick = () => selectAllProperties(myPlayer);

  updatePaymentTotal();

  showModal('payment');
}

function selectAllBank(myPlayer) {
  const bankContainer = document.getElementById('payment-bank-cards');
  const cards = bankContainer.querySelectorAll('.game-card');

  paymentSelection.bank = [];
  cards.forEach((card, index) => {
    card.classList.add('selected');
    paymentSelection.bank.push(index);
  });

  updatePaymentTotal();
}

function selectAllProperties(myPlayer) {
  const propContainer = document.getElementById('payment-property-cards');
  const cards = propContainer.querySelectorAll('.game-card');
  const setGroups = propContainer.querySelectorAll('.payment-set-group');

  paymentSelection.properties = {};
  paymentSelection.completeSets = [];

  // Select individual cards
  cards.forEach(card => {
    card.classList.add('selected');
    const color = card.dataset.color;
    const index = card.dataset.index;
    if (color && index !== undefined) {
      if (!paymentSelection.properties[color]) {
        paymentSelection.properties[color] = [];
      }
      paymentSelection.properties[color].push(parseInt(index));
    }
  });

  // Select complete sets
  setGroups.forEach(setGroup => {
    setGroup.classList.add('selected');
    const color = setGroup.dataset.color;
    const setCards = myPlayer.properties[color];
    if (setCards) {
      paymentSelection.completeSets.push({ color, cardCount: setCards.length });
      paymentSelection.properties[color] = setCards.map((_, idx) => idx);
    }
  });

  updatePaymentTotal();
}

function togglePaymentCard(element, type, index, value, color = null) {
  element.classList.toggle('selected');

  if (type === 'bank') {
    if (paymentSelection.bank.includes(index)) {
      paymentSelection.bank = paymentSelection.bank.filter(i => i !== index);
    } else {
      paymentSelection.bank.push(index);
    }
  } else {
    if (!paymentSelection.properties[color]) {
      paymentSelection.properties[color] = [];
    }
    if (paymentSelection.properties[color].includes(index)) {
      paymentSelection.properties[color] = paymentSelection.properties[color].filter(i => i !== index);
    } else {
      paymentSelection.properties[color].push(index);
    }
  }

  updatePaymentTotal();
}

function togglePaymentSet(element, color, cards) {
  element.classList.toggle('selected');

  // Initialize completeSets array if needed
  if (!paymentSelection.completeSets) {
    paymentSelection.completeSets = [];
  }

  const setIndex = paymentSelection.completeSets.findIndex(s => s.color === color);

  if (setIndex !== -1) {
    // Deselect - remove from completeSets
    paymentSelection.completeSets.splice(setIndex, 1);
    // Also remove from properties
    delete paymentSelection.properties[color];
  } else {
    // Select - add all card indices to both completeSets tracking and properties
    paymentSelection.completeSets.push({ color, cardCount: cards.length });
    paymentSelection.properties[color] = cards.map((_, idx) => idx);
  }

  updatePaymentTotal();
}

function updatePaymentTotal() {
  const myPlayer = gameState.players.find(p => p.id === myPlayerId);
  let total = 0;

  paymentSelection.bank.forEach(index => {
    total += myPlayer.bank[index]?.value || 0;
  });

  Object.entries(paymentSelection.properties).forEach(([color, indices]) => {
    indices.forEach(index => {
      total += myPlayer.properties[color]?.[index]?.value || 0;
    });
  });

  document.getElementById('payment-selected').textContent = total;
}

function submitPayment() {
  socket.emit('respondToAction', { response: 'pay', cards: paymentSelection });
  hideModal('payment');
}

function playSayNo() {
  socket.emit('respondToAction', { response: 'sayNo' });
  hideModal('payment');
}

// Game actions
function drawCards() {
  socket.emit('drawCards');
  // Add animation to deck
  const deck = document.querySelector('.deck-stack');
  if (deck) {
    deck.classList.add('drawing');
    setTimeout(() => deck.classList.remove('drawing'), 300);
  }
}

function endTurn() {
  socket.emit('endTurn');
}

// Utility functions
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Just Say No notification popup
let lastSayNoUsedBy = null;

function showSayNoNotification(playerName) {
  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'say-no-overlay';
  overlay.innerHTML = `
    <div class="say-no-popup">
      <div class="say-no-icon">
        <svg viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="20" fill="white"/>
          <path d="M14 14L34 34M34 14L14 34" stroke="#e74c3c" stroke-width="6" stroke-linecap="round"/>
        </svg>
      </div>
      <h2>Just Say No!</h2>
      <p>${escapeHtml(playerName)} blocked the action!</p>
    </div>
  `;

  document.body.appendChild(overlay);

  // Auto-remove after 2.5 seconds
  setTimeout(() => {
    overlay.style.animation = 'fadeIn 0.3s ease reverse';
    setTimeout(() => overlay.remove(), 300);
  }, 2500);

  // Allow clicking to dismiss early
  overlay.addEventListener('click', () => {
    overlay.remove();
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Rent chart display
function showRentChart(color, colorInfo, playerCards) {
  document.getElementById('rent-title').textContent = `${colorInfo.name} Rent Chart`;

  const chartContainer = document.getElementById('rent-chart');
  const currentInfoContainer = document.getElementById('rent-current-info');

  // Build rent chart
  let chartHtml = '<div class="rent-chart-items">';
  colorInfo.rent.forEach((amount, index) => {
    const propertyCount = index + 1;
    chartHtml += `
      <div class="rent-chart-item">
        <span class="rent-property-count">${propertyCount} ${propertyCount === 1 ? 'Property' : 'Properties'}</span>
        <span class="rent-amount">$${amount}M</span>
      </div>
    `;
  });
  chartHtml += '</div>';

  // Add house/hotel info for non-railroad/utility
  if (color !== 'RAILROAD' && color !== 'UTILITY') {
    chartHtml += `
      <div class="rent-bonus-info">
        <div class="rent-bonus-item">
          <span>+ House</span>
          <span>+$3M</span>
        </div>
        <div class="rent-bonus-item">
          <span>+ Hotel</span>
          <span>+$4M</span>
        </div>
      </div>
    `;
  }

  chartContainer.innerHTML = chartHtml;

  // Calculate current rent for this player's set
  if (playerCards && playerCards.length > 0) {
    const propertyCards = playerCards.filter(c =>
      c.type === 'property' || c.type === 'property_wild' || c.type === 'property_wild_all'
    );
    const propertyCount = propertyCards.length;
    let currentRent = colorInfo.rent[Math.min(propertyCount - 1, colorInfo.rent.length - 1)] || 0;

    const hasHouse = playerCards.some(c => c.action === 'house');
    const hasHotel = playerCards.some(c => c.action === 'hotel');
    if (hasHouse) currentRent += 3;
    if (hasHotel) currentRent += 4;

    const isComplete = propertyCount >= colorInfo.setSize;

    currentInfoContainer.innerHTML = `
      <div class="current-rent-display" style="background-color: ${colorInfo.color};">
        <div>Your ${colorInfo.name} Set:</div>
        <div class="current-rent-stats">
          <span>${propertyCount}/${colorInfo.setSize} properties${isComplete ? ' (Complete!)' : ''}</span>
          ${hasHouse ? '<span>+ House</span>' : ''}
          ${hasHotel ? '<span>+ Hotel</span>' : ''}
        </div>
        <div class="current-rent-amount">Current Rent: $${currentRent}M</div>
      </div>
    `;
  } else {
    currentInfoContainer.innerHTML = '';
  }

  showModal('rent');
}

// Initialize
init();
