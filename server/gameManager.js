// Card definitions based on Monopoly Deal
const CARD_TYPES = {
  MONEY: 'money',
  PROPERTY: 'property',
  PROPERTY_WILD: 'property_wild',
  PROPERTY_WILD_ALL: 'property_wild_all',
  ACTION: 'action',
  RENT: 'rent'
};

const PROPERTY_COLORS = {
  BROWN: { name: 'Brown', color: '#8B4513', setSize: 2, rent: [1, 2] },
  LIGHT_BLUE: { name: 'Light Blue', color: '#87CEEB', setSize: 3, rent: [1, 2, 3] },
  PINK: { name: 'Pink', color: '#FF69B4', setSize: 3, rent: [1, 2, 4] },
  ORANGE: { name: 'Orange', color: '#FFA500', setSize: 3, rent: [1, 3, 5] },
  RED: { name: 'Red', color: '#FF0000', setSize: 3, rent: [2, 3, 6] },
  YELLOW: { name: 'Yellow', color: '#FFD700', setSize: 3, rent: [2, 4, 6] },
  GREEN: { name: 'Green', color: '#228B22', setSize: 3, rent: [2, 4, 7] },
  BLUE: { name: 'Blue', color: '#0000FF', setSize: 2, rent: [3, 8] },
  RAILROAD: { name: 'Railroad', color: '#333333', setSize: 4, rent: [1, 2, 3, 4] },
  UTILITY: { name: 'Utility', color: '#90EE90', setSize: 2, rent: [1, 2] }
};

// Full deck definition
function createDeck() {
  const deck = [];
  let cardId = 0;

  // Money cards
  const moneyCards = [
    { value: 1, count: 6 },
    { value: 2, count: 5 },
    { value: 3, count: 3 },
    { value: 4, count: 3 },
    { value: 5, count: 2 },
    { value: 10, count: 1 }
  ];

  moneyCards.forEach(({ value, count }) => {
    for (let i = 0; i < count; i++) {
      deck.push({
        id: cardId++,
        type: CARD_TYPES.MONEY,
        value,
        name: `$${value}M`
      });
    }
  });

  // Property cards
  const properties = [
    { color: 'BROWN', names: ['Baltic Avenue', 'Mediterranean Avenue'] },
    { color: 'LIGHT_BLUE', names: ['Connecticut Avenue', 'Oriental Avenue', 'Vermont Avenue'] },
    { color: 'PINK', names: ['St. Charles Place', 'Virginia Avenue', 'States Avenue'] },
    { color: 'ORANGE', names: ['St. James Place', 'Tennessee Avenue', 'New York Avenue'] },
    { color: 'RED', names: ['Kentucky Avenue', 'Indiana Avenue', 'Illinois Avenue'] },
    { color: 'YELLOW', names: ['Atlantic Avenue', 'Ventnor Avenue', 'Marvin Gardens'] },
    { color: 'GREEN', names: ['Pacific Avenue', 'North Carolina Avenue', 'Pennsylvania Avenue'] },
    { color: 'BLUE', names: ['Park Place', 'Boardwalk'] },
    { color: 'RAILROAD', names: ['Reading Railroad', 'Pennsylvania Railroad', 'B&O Railroad', 'Short Line'] },
    { color: 'UTILITY', names: ['Electric Company', 'Water Works'] }
  ];

  properties.forEach(({ color, names }) => {
    names.forEach(name => {
      deck.push({
        id: cardId++,
        type: CARD_TYPES.PROPERTY,
        color,
        name,
        value: color === 'BLUE' ? 4 : color === 'GREEN' ? 4 : color === 'RAILROAD' ? 2 : color === 'BROWN' ? 1 : 2
      });
    });
  });

  // Property wildcards (dual color)
  const wildcards = [
    { colors: ['BROWN', 'LIGHT_BLUE'], count: 1, value: 1 },
    { colors: ['LIGHT_BLUE', 'RAILROAD'], count: 1, value: 4 },
    { colors: ['PINK', 'ORANGE'], count: 2, value: 2 },
    { colors: ['RED', 'YELLOW'], count: 2, value: 3 },
    { colors: ['GREEN', 'RAILROAD'], count: 1, value: 4 },
    { colors: ['GREEN', 'BLUE'], count: 1, value: 4 },
    { colors: ['UTILITY', 'RAILROAD'], count: 1, value: 2 }
  ];

  wildcards.forEach(({ colors, count, value }) => {
    for (let i = 0; i < count; i++) {
      deck.push({
        id: cardId++,
        type: CARD_TYPES.PROPERTY_WILD,
        colors,
        currentColor: colors[0],
        name: `${PROPERTY_COLORS[colors[0]].name}/${PROPERTY_COLORS[colors[1]].name} Wild`,
        value
      });
    }
  });

  // Rainbow wildcards
  for (let i = 0; i < 2; i++) {
    deck.push({
      id: cardId++,
      type: CARD_TYPES.PROPERTY_WILD_ALL,
      currentColor: null,
      name: 'Property Wild Card',
      value: 0
    });
  }

  // Action cards
  const actions = [
    { name: 'Deal Breaker', count: 2, value: 5, action: 'dealBreaker' },
    { name: 'Just Say No!', count: 3, value: 4, action: 'sayNo' },
    { name: 'Sly Deal', count: 3, value: 3, action: 'slyDeal' },
    { name: 'Forced Deal', count: 4, value: 3, action: 'forcedDeal' },
    { name: 'Debt Collector', count: 3, value: 3, action: 'debtCollector' },
    { name: "It's My Birthday", count: 3, value: 2, action: 'birthday' },
    { name: 'Pass Go', count: 10, value: 1, action: 'passGo' },
    { name: 'House', count: 3, value: 3, action: 'house' },
    { name: 'Hotel', count: 2, value: 4, action: 'hotel' },
    { name: 'Double The Rent', count: 2, value: 1, action: 'doubleRent' }
  ];

  actions.forEach(({ name, count, value, action }) => {
    for (let i = 0; i < count; i++) {
      deck.push({
        id: cardId++,
        type: CARD_TYPES.ACTION,
        name,
        value,
        action
      });
    }
  });

  // Rent cards
  const rentCards = [
    { colors: ['BROWN', 'LIGHT_BLUE'], count: 2, value: 1 },
    { colors: ['PINK', 'ORANGE'], count: 2, value: 1 },
    { colors: ['RED', 'YELLOW'], count: 2, value: 1 },
    { colors: ['GREEN', 'BLUE'], count: 2, value: 1 },
    { colors: ['RAILROAD', 'UTILITY'], count: 2, value: 1 },
    { colors: 'ALL', count: 3, value: 3 }
  ];

  rentCards.forEach(({ colors, count, value }) => {
    for (let i = 0; i < count; i++) {
      deck.push({
        id: cardId++,
        type: CARD_TYPES.RENT,
        colors,
        name: colors === 'ALL' ? 'Wild Rent' : `${PROPERTY_COLORS[colors[0]].name}/${PROPERTY_COLORS[colors[1]].name} Rent`,
        value
      });
    }
  });

  return deck;
}

// Shuffle array
function shuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

class GameManager {
  constructor(gameCode) {
    this.gameCode = gameCode;
    this.players = [];
    this.state = 'lobby'; // lobby, playing, finished
    this.currentPlayerIndex = 0;
    this.deck = [];
    this.discardPile = [];
    this.actionsThisTurn = 0;
    this.maxActionsPerTurn = 3;
    this.hasDrawnThisTurn = false;
    this.pendingAction = null;
    this.winner = null;
  }

  addPlayer(id, name, socketId, isHost) {
    const avatarColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
    const avatarIndex = this.players.length;

    this.players.push({
      id,
      name,
      socketId,
      isHost,
      hand: [],
      properties: {},
      bank: [],
      avatar: avatarColors[avatarIndex % avatarColors.length]
    });
  }

  removePlayer(playerId) {
    const index = this.players.findIndex(p => p.id === playerId);
    if (index !== -1) {
      const wasHost = this.players[index].isHost;
      this.players.splice(index, 1);

      // Transfer host to next player if needed
      if (wasHost && this.players.length > 0) {
        this.players[0].isHost = true;
      }

      // Adjust current player index
      if (this.state === 'playing' && this.currentPlayerIndex >= this.players.length) {
        this.currentPlayerIndex = 0;
      }
    }
  }

  getPlayersInfo() {
    return this.players.map(p => ({
      id: p.id,
      name: p.name,
      isHost: p.isHost,
      avatar: p.avatar
    }));
  }

  startGame() {
    this.state = 'playing';
    this.deck = shuffle(createDeck());
    this.discardPile = [];
    this.currentPlayerIndex = 0;
    this.actionsThisTurn = 0;
    this.hasDrawnThisTurn = false;

    // Deal 5 cards to each player
    this.players.forEach(player => {
      player.hand = [];
      player.properties = {};
      player.bank = [];
      for (let i = 0; i < 5; i++) {
        if (this.deck.length > 0) {
          player.hand.push(this.deck.pop());
        }
      }
    });

    // Auto-draw 2 cards for the first player
    this.autoDrawForCurrentPlayer();
  }

  autoDrawForCurrentPlayer() {
    const player = this.getCurrentPlayer();
    if (!player || this.hasDrawnThisTurn) return;

    // Draw 2 cards (or remaining deck)
    const cardsToDraw = Math.min(2, this.deck.length);
    for (let i = 0; i < cardsToDraw; i++) {
      if (this.deck.length > 0) {
        player.hand.push(this.deck.pop());
      }
    }

    // If deck is empty, shuffle discard pile
    if (this.deck.length === 0 && this.discardPile.length > 0) {
      this.deck = shuffle(this.discardPile);
      this.discardPile = [];
    }

    this.hasDrawnThisTurn = true;
  }

  getCurrentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  drawCards(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return { error: 'Player not found' };

    if (this.getCurrentPlayer().id !== playerId) {
      return { error: 'Not your turn' };
    }

    if (this.hasDrawnThisTurn) {
      return { error: 'Already drew cards this turn' };
    }

    // Draw 2 cards (or remaining deck)
    const cardsToDraw = Math.min(2, this.deck.length);
    for (let i = 0; i < cardsToDraw; i++) {
      if (this.deck.length > 0) {
        player.hand.push(this.deck.pop());
      }
    }

    // If deck is empty, shuffle discard pile
    if (this.deck.length === 0 && this.discardPile.length > 0) {
      this.deck = shuffle(this.discardPile);
      this.discardPile = [];
    }

    this.hasDrawnThisTurn = true;
    return { success: true };
  }

  playCard(playerId, cardIndex, action, target, bankAsAction = false) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return { error: 'Player not found' };

    if (this.getCurrentPlayer().id !== playerId) {
      return { error: 'Not your turn' };
    }

    if (!this.hasDrawnThisTurn) {
      return { error: 'Must draw cards first' };
    }

    if (this.actionsThisTurn >= this.maxActionsPerTurn) {
      return { error: 'No more actions this turn' };
    }

    if (cardIndex < 0 || cardIndex >= player.hand.length) {
      return { error: 'Invalid card index' };
    }

    const card = player.hand[cardIndex];

    // If player chose to bank an action/rent card instead of using it
    if (bankAsAction && (card.type === CARD_TYPES.ACTION || card.type === CARD_TYPES.RENT)) {
      player.hand.splice(cardIndex, 1);
      player.bank.push(card);
      this.actionsThisTurn++;
      return { success: true };
    }

    // Handle different card types
    switch (card.type) {
      case CARD_TYPES.MONEY:
        return this.playMoneyCard(player, cardIndex);

      case CARD_TYPES.PROPERTY:
        return this.playPropertyCard(player, cardIndex);

      case CARD_TYPES.PROPERTY_WILD:
        return this.playPropertyWildCard(player, cardIndex, action);

      case CARD_TYPES.PROPERTY_WILD_ALL:
        return this.playPropertyWildAllCard(player, cardIndex, action);

      case CARD_TYPES.ACTION:
        return this.playActionCard(player, cardIndex, action, target);

      case CARD_TYPES.RENT:
        return this.playRentCard(player, cardIndex, action, target);

      default:
        return { error: 'Unknown card type' };
    }
  }

  playMoneyCard(player, cardIndex) {
    const card = player.hand.splice(cardIndex, 1)[0];
    player.bank.push(card);
    this.actionsThisTurn++;
    return { success: true };
  }

  playPropertyCard(player, cardIndex) {
    const card = player.hand.splice(cardIndex, 1)[0];
    if (!player.properties[card.color]) {
      player.properties[card.color] = [];
    }
    player.properties[card.color].push(card);
    this.actionsThisTurn++;
    this.checkWinCondition(player);
    return { success: true };
  }

  playPropertyWildCard(player, cardIndex, targetColor) {
    const card = player.hand[cardIndex];
    if (!card.colors.includes(targetColor)) {
      return { error: 'Invalid color for this wild card' };
    }
    card.currentColor = targetColor;
    player.hand.splice(cardIndex, 1);
    if (!player.properties[targetColor]) {
      player.properties[targetColor] = [];
    }
    player.properties[targetColor].push(card);
    this.actionsThisTurn++;
    this.checkWinCondition(player);
    return { success: true };
  }

  playPropertyWildAllCard(player, cardIndex, targetColor) {
    if (!targetColor || !PROPERTY_COLORS[targetColor]) {
      return { error: 'Must specify a valid color' };
    }
    const card = player.hand.splice(cardIndex, 1)[0];
    card.currentColor = targetColor;
    if (!player.properties[targetColor]) {
      player.properties[targetColor] = [];
    }
    player.properties[targetColor].push(card);
    this.actionsThisTurn++;
    this.checkWinCondition(player);
    return { success: true };
  }

  playActionCard(player, cardIndex, action, target) {
    const card = player.hand[cardIndex];

    switch (card.action) {
      case 'passGo':
        // Draw 2 cards
        player.hand.splice(cardIndex, 1);
        this.discardPile.push(card);
        for (let i = 0; i < 2; i++) {
          if (this.deck.length > 0) {
            player.hand.push(this.deck.pop());
          }
        }
        this.actionsThisTurn++;
        return { success: true };

      case 'birthday':
        // All players must pay $2
        player.hand.splice(cardIndex, 1);
        this.discardPile.push(card);
        this.pendingAction = {
          type: 'birthday',
          fromPlayer: player.id,
          amount: 2,
          respondingPlayers: this.players.filter(p => p.id !== player.id).map(p => p.id),
          responses: {}
        };
        this.actionsThisTurn++;
        return { success: true, pendingAction: true };

      case 'debtCollector':
        // Target player must pay $5
        if (!target || !this.players.find(p => p.id === target)) {
          return { error: 'Must select a target player' };
        }
        player.hand.splice(cardIndex, 1);
        this.discardPile.push(card);
        this.pendingAction = {
          type: 'debtCollector',
          fromPlayer: player.id,
          targetPlayer: target,
          amount: 5,
          respondingPlayers: [target],
          responses: {}
        };
        this.actionsThisTurn++;
        return { success: true, pendingAction: true };

      case 'slyDeal':
        // Steal a property from another player (not from a complete set)
        if (!target || !target.playerId || !target.color || target.cardIndex === undefined) {
          return { error: 'Must select a property to steal' };
        }
        const slyTarget = this.players.find(p => p.id === target.playerId);
        if (!slyTarget || !slyTarget.properties[target.color]) {
          return { error: 'Invalid target' };
        }
        const setInfo = PROPERTY_COLORS[target.color];
        if (slyTarget.properties[target.color].length >= setInfo.setSize) {
          return { error: 'Cannot steal from a complete set' };
        }
        player.hand.splice(cardIndex, 1);
        this.discardPile.push(card);
        this.pendingAction = {
          type: 'slyDeal',
          fromPlayer: player.id,
          targetPlayer: target.playerId,
          color: target.color,
          cardIndex: target.cardIndex,
          respondingPlayers: [target.playerId],
          responses: {}
        };
        this.actionsThisTurn++;
        return { success: true, pendingAction: true };

      case 'forcedDeal':
        // Trade a property with another player
        if (!target || !target.playerId || !target.theirColor || !target.yourColor ||
            target.theirCardIndex === undefined || target.yourCardIndex === undefined) {
          return { error: 'Must select properties to trade' };
        }
        // Validate the target player exists and has the property
        const fdTarget = this.players.find(p => p.id === target.playerId);
        if (!fdTarget || !fdTarget.properties[target.theirColor] ||
            !fdTarget.properties[target.theirColor][target.theirCardIndex]) {
          return { error: 'Invalid target property' };
        }
        // Validate the player has the property to give
        if (!player.properties[target.yourColor] ||
            !player.properties[target.yourColor][target.yourCardIndex]) {
          return { error: 'You do not have that property' };
        }
        // Check target property is not from a complete set
        const fdSetInfo = PROPERTY_COLORS[target.theirColor];
        const fdPropCount = fdTarget.properties[target.theirColor].filter(c =>
          c.type === CARD_TYPES.PROPERTY || c.type === CARD_TYPES.PROPERTY_WILD || c.type === CARD_TYPES.PROPERTY_WILD_ALL
        ).length;
        if (fdPropCount >= fdSetInfo.setSize) {
          return { error: 'Cannot take from a complete set' };
        }
        player.hand.splice(cardIndex, 1);
        this.discardPile.push(card);
        this.pendingAction = {
          type: 'forcedDeal',
          fromPlayer: player.id,
          targetPlayer: target.playerId,
          theirColor: target.theirColor,
          theirCardIndex: target.theirCardIndex,
          yourColor: target.yourColor,
          yourCardIndex: target.yourCardIndex,
          respondingPlayers: [target.playerId],
          responses: {}
        };
        this.actionsThisTurn++;
        return { success: true, pendingAction: true };

      case 'dealBreaker':
        // Steal a complete property set
        if (!target || !target.playerId || !target.color) {
          return { error: 'Must select a complete set to steal' };
        }
        const dbTarget = this.players.find(p => p.id === target.playerId);
        if (!dbTarget || !dbTarget.properties[target.color]) {
          return { error: 'Invalid target' };
        }
        const dbSetInfo = PROPERTY_COLORS[target.color];
        if (dbTarget.properties[target.color].length < dbSetInfo.setSize) {
          return { error: 'Can only steal complete sets' };
        }
        player.hand.splice(cardIndex, 1);
        this.discardPile.push(card);
        this.pendingAction = {
          type: 'dealBreaker',
          fromPlayer: player.id,
          targetPlayer: target.playerId,
          color: target.color,
          respondingPlayers: [target.playerId],
          responses: {}
        };
        this.actionsThisTurn++;
        return { success: true, pendingAction: true };

      case 'house':
      case 'hotel':
        // Add to a complete property set (not railroad/utility)
        if (!target || !target.color) {
          return { error: 'Must select a property set' };
        }
        if (target.color === 'RAILROAD' || target.color === 'UTILITY') {
          return { error: 'Cannot add buildings to railroads or utilities' };
        }
        if (!player.properties[target.color]) {
          return { error: 'You do not have properties of that color' };
        }
        const buildSetInfo = PROPERTY_COLORS[target.color];
        if (player.properties[target.color].length < buildSetInfo.setSize) {
          return { error: 'Must have a complete set to add buildings' };
        }
        if (card.action === 'hotel') {
          const hasHouse = player.properties[target.color].some(c => c.action === 'house');
          if (!hasHouse) {
            return { error: 'Must have a house before adding a hotel' };
          }
        }
        player.hand.splice(cardIndex, 1);
        player.properties[target.color].push(card);
        this.actionsThisTurn++;
        return { success: true };

      case 'sayNo':
        // Can only be played in response to an action
        return { error: '"Just Say No!" can only be played in response to an action' };

      case 'doubleRent':
        // Must be played with a rent card
        return { error: 'Double The Rent must be played with a rent card' };

      default:
        // Play as money
        player.hand.splice(cardIndex, 1);
        player.bank.push(card);
        this.actionsThisTurn++;
        return { success: true };
    }
  }

  playRentCard(player, cardIndex, action, target) {
    const card = player.hand[cardIndex];
    let targetColor = action;

    // Validate color
    if (card.colors === 'ALL') {
      if (!targetColor || !PROPERTY_COLORS[targetColor]) {
        return { error: 'Must select a color for wild rent' };
      }
    } else {
      if (!targetColor || !card.colors.includes(targetColor)) {
        return { error: 'Invalid color for this rent card' };
      }
    }

    // Check if player has properties of that color
    if (!player.properties[targetColor] || player.properties[targetColor].length === 0) {
      return { error: 'You have no properties of that color' };
    }

    // Calculate rent
    const setInfo = PROPERTY_COLORS[targetColor];
    const propertyCount = player.properties[targetColor].filter(
      c => c.type === CARD_TYPES.PROPERTY || c.type === CARD_TYPES.PROPERTY_WILD || c.type === CARD_TYPES.PROPERTY_WILD_ALL
    ).length;
    let rentAmount = setInfo.rent[Math.min(propertyCount - 1, setInfo.rent.length - 1)];

    // Add house/hotel bonuses
    const hasHouse = player.properties[targetColor].some(c => c.action === 'house');
    const hasHotel = player.properties[targetColor].some(c => c.action === 'hotel');
    if (hasHouse) rentAmount += 3;
    if (hasHotel) rentAmount += 4;

    // Check for double rent - use the provided index if available
    if (target && target.doubleRent && this.actionsThisTurn < this.maxActionsPerTurn - 1) {
      let doubleRentIndex = target.doubleRentIndex;
      // If no specific index provided, find a double rent card
      if (doubleRentIndex === undefined) {
        doubleRentIndex = player.hand.findIndex(c => c.action === 'doubleRent');
      }
      if (doubleRentIndex !== -1 && player.hand[doubleRentIndex] && player.hand[doubleRentIndex].action === 'doubleRent') {
        const doubleRentCard = player.hand.splice(doubleRentIndex, 1)[0];
        this.discardPile.push(doubleRentCard);
        rentAmount *= 2;
        this.actionsThisTurn++;
        // Adjust cardIndex if the doubleRent card was before it
        if (doubleRentIndex < cardIndex) {
          cardIndex--;
        }
      }
    }

    player.hand.splice(cardIndex, 1);
    this.discardPile.push(card);

    // Determine targets based on card type
    let targetPlayers;
    if (card.colors === 'ALL') {
      // Wild rent only targets one player
      if (!target || !target.playerId) {
        return { error: 'Wild rent requires selecting a target player' };
      }
      targetPlayers = [target.playerId];
    } else {
      // Standard rent targets all players
      targetPlayers = this.players.filter(p => p.id !== player.id).map(p => p.id);
    }

    this.pendingAction = {
      type: 'rent',
      fromPlayer: player.id,
      amount: rentAmount,
      color: targetColor,
      respondingPlayers: targetPlayers,
      responses: {}
    };

    this.actionsThisTurn++;
    return { success: true, pendingAction: true };
  }

  respondToAction(playerId, response, cards) {
    if (!this.pendingAction) {
      return { error: 'No pending action' };
    }

    const player = this.players.find(p => p.id === playerId);
    if (!player) return { error: 'Player not found' };

    // Handle counter Say No (action player responding to someone's Say No)
    if (response === 'counterSayNo') {
      // Verify this player has a counter opportunity
      if (!this.pendingAction.sayNoChain ||
          this.pendingAction.sayNoChain.awaitingCounter !== playerId) {
        return { error: 'You cannot counter Say No right now' };
      }

      // Check if player has a Say No card
      const sayNoIndex = player.hand.findIndex(c => c.action === 'sayNo');
      if (sayNoIndex === -1) {
        return { error: 'You do not have a "Just Say No!" card' };
      }

      // Play the counter Say No card
      const sayNoCard = player.hand.splice(sayNoIndex, 1)[0];
      this.discardPile.push(sayNoCard);

      // Track for notification
      this.pendingAction.sayNoUsedBy = {
        playerId: playerId,
        playerName: player.name
      };

      // Increment the Say No chain count
      this.pendingAction.sayNoChain.count++;

      // Now the other player can counter if they have a Say No
      const otherPlayerId = this.pendingAction.sayNoChain.againstPlayer;
      const otherPlayer = this.players.find(p => p.id === otherPlayerId);
      const otherHasSayNo = otherPlayer.hand.some(c => c.action === 'sayNo');

      if (otherHasSayNo) {
        // Other player can counter
        this.pendingAction.sayNoChain.awaitingCounter = otherPlayerId;
        this.pendingAction.sayNoChain.againstPlayer = playerId;
        return { success: true, sayNoUsedBy: this.pendingAction.sayNoUsedBy };
      } else {
        // Chain ends - odd count means original Say No was countered (action succeeds)
        // even count means action is blocked
        const actionSucceeds = this.pendingAction.sayNoChain.count % 2 === 1;

        if (actionSucceeds) {
          // Remove the target from responding (action will proceed)
          const targetId = this.pendingAction.sayNoChain.originalSayNoPlayer;
          this.pendingAction.respondingPlayers = this.pendingAction.respondingPlayers.filter(id => id !== targetId);
          this.pendingAction.responses[targetId] = 'countered';
        } else {
          // Action is blocked
          const targetId = this.pendingAction.sayNoChain.originalSayNoPlayer;
          this.pendingAction.respondingPlayers = this.pendingAction.respondingPlayers.filter(id => id !== targetId);
          this.pendingAction.responses[targetId] = 'sayNo';
        }

        // Clear the chain
        delete this.pendingAction.sayNoChain;

        // Check if action is resolved
        if (this.pendingAction.respondingPlayers.length === 0) {
          this.resolvePendingAction();
        }

        return { success: true, sayNoUsedBy: this.pendingAction.sayNoUsedBy };
      }
    }

    // Handle declining to counter
    if (response === 'declineCounter') {
      if (!this.pendingAction.sayNoChain ||
          this.pendingAction.sayNoChain.awaitingCounter !== playerId) {
        return { error: 'No counter to decline' };
      }

      // Chain ends - count determines outcome
      // odd count = action blocked, even count = action succeeds
      const actionBlocked = this.pendingAction.sayNoChain.count % 2 === 1;
      const targetId = this.pendingAction.sayNoChain.originalSayNoPlayer;

      this.pendingAction.respondingPlayers = this.pendingAction.respondingPlayers.filter(id => id !== targetId);
      this.pendingAction.responses[targetId] = actionBlocked ? 'sayNo' : 'countered';

      // Clear the chain
      delete this.pendingAction.sayNoChain;

      // Check if action is resolved
      if (this.pendingAction.respondingPlayers.length === 0) {
        this.resolvePendingAction();
      }

      return { success: true };
    }

    // For regular responses, check if player needs to respond
    if (!this.pendingAction.respondingPlayers.includes(playerId)) {
      return { error: 'You are not required to respond' };
    }

    if (response === 'sayNo') {
      // Check if player has a "Just Say No" card
      const sayNoIndex = player.hand.findIndex(c => c.action === 'sayNo');
      if (sayNoIndex === -1) {
        return { error: 'You do not have a "Just Say No!" card' };
      }

      // Play the Say No card
      const sayNoCard = player.hand.splice(sayNoIndex, 1)[0];
      this.discardPile.push(sayNoCard);

      // Track who just used Say No for client notification
      this.pendingAction.sayNoUsedBy = {
        playerId: playerId,
        playerName: player.name
      };

      // Check if the action player can counter with their own Say No
      const fromPlayer = this.players.find(p => p.id === this.pendingAction.fromPlayer);
      const fromPlayerHasSayNo = fromPlayer.hand.some(c => c.action === 'sayNo');

      if (fromPlayerHasSayNo) {
        // Start a Say No chain - action player can counter
        this.pendingAction.sayNoChain = {
          count: 1, // First Say No played
          awaitingCounter: this.pendingAction.fromPlayer,
          againstPlayer: playerId,
          originalSayNoPlayer: playerId
        };
        return { success: true, sayNoUsedBy: this.pendingAction.sayNoUsedBy };
      }

      // No counter possible - Say No succeeds, action is blocked
      this.pendingAction.respondingPlayers = this.pendingAction.respondingPlayers.filter(id => id !== playerId);
      this.pendingAction.responses[playerId] = 'sayNo';

    } else if (response === 'accept') {
      // Accept the action (for slyDeal, forcedDeal, dealBreaker)
      this.pendingAction.respondingPlayers = this.pendingAction.respondingPlayers.filter(id => id !== playerId);
      this.pendingAction.responses[playerId] = 'accepted';

    } else if (response === 'pay') {
      // Pay with selected cards (money and/or properties)
      const totalValue = this.calculatePaymentValue(player, cards);
      const requiredAmount = this.pendingAction.amount;
      const totalAssets = this.getTotalAssets(player);

      // If player has nothing, they don't need to pay anything
      if (totalAssets === 0) {
        this.pendingAction.respondingPlayers = this.pendingAction.respondingPlayers.filter(id => id !== playerId);
        this.pendingAction.responses[playerId] = 'paid';
        if (this.pendingAction.respondingPlayers.length === 0) {
          this.resolvePendingAction();
        }
        return { success: true };
      }

      // Validate that complete sets are not being broken up
      const setValidation = this.validatePaymentSets(player, cards);
      if (!setValidation.valid) {
        return { error: setValidation.error };
      }

      // If player can't afford full amount, they must give everything they have
      // Accept any payment if player's total assets are less than required
      if (totalAssets < requiredAmount) {
        // Player must pay everything - check if they selected all their assets
        if (totalValue < totalAssets) {
          return { error: `You must give all your assets ($${totalAssets}M) since you cannot pay the full amount` };
        }
      } else {
        // Player can afford full amount - validate they paid enough
        if (totalValue < requiredAmount) {
          return { error: 'Insufficient payment' };
        }
      }

      // Process payment - no change is given (overpayment goes to receiver)
      const paidCards = this.processPayment(player, cards);
      const fromPlayer = this.players.find(p => p.id === this.pendingAction.fromPlayer);

      // Add paid cards to requesting player
      // Money goes to bank, properties go to property section
      paidCards.forEach(card => {
        if (card.type === CARD_TYPES.PROPERTY || card.type === CARD_TYPES.PROPERTY_WILD || card.type === CARD_TYPES.PROPERTY_WILD_ALL) {
          // Property cards go to the receiver's property section
          const propertyColor = card.currentColor || card.color;
          if (!fromPlayer.properties[propertyColor]) {
            fromPlayer.properties[propertyColor] = [];
          }
          fromPlayer.properties[propertyColor].push(card);
        } else {
          // Money and action cards go to bank
          fromPlayer.bank.push(card);
        }
      });

      this.pendingAction.respondingPlayers = this.pendingAction.respondingPlayers.filter(id => id !== playerId);
      this.pendingAction.responses[playerId] = 'paid';
    }

    // Check if all responses received
    if (this.pendingAction.respondingPlayers.length === 0) {
      this.resolvePendingAction();
    }

    return { success: true };
  }

  calculatePaymentValue(player, cards) {
    let total = 0;

    if (cards.bank) {
      cards.bank.forEach(index => {
        if (player.bank[index]) {
          total += player.bank[index].value;
        }
      });
    }

    if (cards.properties) {
      Object.entries(cards.properties).forEach(([color, indices]) => {
        if (player.properties[color]) {
          indices.forEach(index => {
            if (player.properties[color][index]) {
              total += player.properties[color][index].value;
            }
          });
        }
      });
    }

    return total;
  }

  // Validate that complete sets are not being broken up
  validatePaymentSets(player, cards) {
    if (!cards.properties) return { valid: true };

    for (const [color, indices] of Object.entries(cards.properties)) {
      const playerSet = player.properties[color];
      if (!playerSet) continue;

      // Count property cards in this set (exclude house/hotel)
      const propertyCards = playerSet.filter(c =>
        c.type === CARD_TYPES.PROPERTY ||
        c.type === CARD_TYPES.PROPERTY_WILD ||
        c.type === CARD_TYPES.PROPERTY_WILD_ALL
      );

      const setInfo = PROPERTY_COLORS[color];
      const isCompleteSet = propertyCards.length >= setInfo.setSize;

      if (isCompleteSet) {
        // If paying from a complete set, must pay all cards in the set
        const totalCardsInSet = playerSet.length;
        if (indices.length > 0 && indices.length < totalCardsInSet) {
          return {
            valid: false,
            error: `Cannot break up the complete ${setInfo.name} set. You must pay the entire set or none of it.`
          };
        }
      }
    }

    return { valid: true };
  }

  getTotalAssets(player) {
    let total = 0;

    player.bank.forEach(card => {
      total += card.value;
    });

    Object.values(player.properties).forEach(propertySet => {
      propertySet.forEach(card => {
        total += card.value;
      });
    });

    return total;
  }

  processPayment(player, cards) {
    const paidCards = [];

    // Remove from bank (in reverse order to maintain indices)
    if (cards.bank) {
      const sortedBankIndices = [...cards.bank].sort((a, b) => b - a);
      sortedBankIndices.forEach(index => {
        if (player.bank[index]) {
          paidCards.push(player.bank.splice(index, 1)[0]);
        }
      });
    }

    // Remove from properties (in reverse order)
    if (cards.properties) {
      Object.entries(cards.properties).forEach(([color, indices]) => {
        if (player.properties[color]) {
          const sortedIndices = [...indices].sort((a, b) => b - a);
          sortedIndices.forEach(index => {
            if (player.properties[color][index]) {
              paidCards.push(player.properties[color].splice(index, 1)[0]);
            }
          });
          // Clean up empty property sets
          if (player.properties[color].length === 0) {
            delete player.properties[color];
          }
        }
      });
    }

    return paidCards;
  }

  resolvePendingAction() {
    const action = this.pendingAction;

    switch (action.type) {
      case 'slyDeal':
        // If not blocked, steal the property
        if (!action.responses[action.targetPlayer] || action.responses[action.targetPlayer] !== 'sayNo') {
          const target = this.players.find(p => p.id === action.targetPlayer);
          const stealer = this.players.find(p => p.id === action.fromPlayer);

          if (target.properties[action.color] && target.properties[action.color][action.cardIndex]) {
            const stolenCard = target.properties[action.color].splice(action.cardIndex, 1)[0];
            if (!stealer.properties[action.color]) {
              stealer.properties[action.color] = [];
            }
            stealer.properties[action.color].push(stolenCard);

            // Clean up empty sets
            if (target.properties[action.color].length === 0) {
              delete target.properties[action.color];
            }
          }
        }
        break;

      case 'dealBreaker':
        // If not blocked, steal the complete set
        if (!action.responses[action.targetPlayer] || action.responses[action.targetPlayer] !== 'sayNo') {
          const target = this.players.find(p => p.id === action.targetPlayer);
          const stealer = this.players.find(p => p.id === action.fromPlayer);

          if (target.properties[action.color]) {
            stealer.properties[action.color] = target.properties[action.color];
            delete target.properties[action.color];
          }
        }
        break;

      case 'forcedDeal':
        // If not blocked, swap properties
        if (!action.responses[action.targetPlayer] || action.responses[action.targetPlayer] !== 'sayNo') {
          const target = this.players.find(p => p.id === action.targetPlayer);
          const initiator = this.players.find(p => p.id === action.fromPlayer);

          // Swap cards
          const theirCard = target.properties[action.theirColor].splice(action.theirCardIndex, 1)[0];
          const yourCard = initiator.properties[action.yourColor].splice(action.yourCardIndex, 1)[0];

          if (!initiator.properties[action.theirColor]) {
            initiator.properties[action.theirColor] = [];
          }
          initiator.properties[action.theirColor].push(theirCard);

          if (!target.properties[action.yourColor]) {
            target.properties[action.yourColor] = [];
          }
          target.properties[action.yourColor].push(yourCard);

          // Clean up empty sets
          if (target.properties[action.theirColor].length === 0) {
            delete target.properties[action.theirColor];
          }
          if (initiator.properties[action.yourColor].length === 0) {
            delete initiator.properties[action.yourColor];
          }
        }
        break;
    }

    // Check win condition for action player
    const fromPlayer = this.players.find(p => p.id === action.fromPlayer);
    this.checkWinCondition(fromPlayer);

    this.pendingAction = null;
  }

  discardCard(playerId, cardIndex) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return { error: 'Player not found' };

    if (player.hand.length <= 7) {
      return { error: 'No need to discard' };
    }

    if (cardIndex < 0 || cardIndex >= player.hand.length) {
      return { error: 'Invalid card index' };
    }

    const card = player.hand.splice(cardIndex, 1)[0];
    this.discardPile.push(card);

    return { success: true };
  }

  endTurn(playerId) {
    if (this.getCurrentPlayer().id !== playerId) {
      return { error: 'Not your turn' };
    }

    const player = this.getCurrentPlayer();

    // Check if player needs to discard
    if (player.hand.length > 7) {
      return { error: 'Must discard down to 7 cards', mustDiscard: player.hand.length - 7 };
    }

    // Check if there's a pending action
    if (this.pendingAction) {
      return { error: 'Must resolve pending action first' };
    }

    // Move to next player
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    this.actionsThisTurn = 0;
    this.hasDrawnThisTurn = false;

    // Auto-draw for the next player
    this.autoDrawForCurrentPlayer();

    return { success: true };
  }

  // Check if turn should auto-end (no actions left and no discards needed)
  shouldAutoEndTurn() {
    const player = this.getCurrentPlayer();
    if (!player) return false;

    return this.hasDrawnThisTurn &&
           this.actionsThisTurn >= this.maxActionsPerTurn &&
           player.hand.length <= 7 &&
           !this.pendingAction;
  }

  // Auto-end turn and return true if it happened
  tryAutoEndTurn() {
    if (!this.shouldAutoEndTurn()) return false;

    const player = this.getCurrentPlayer();
    const playerId = player.id;

    // Move to next player
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    this.actionsThisTurn = 0;
    this.hasDrawnThisTurn = false;

    // Auto-draw for the next player
    this.autoDrawForCurrentPlayer();

    return true;
  }

  checkWinCondition(player) {
    // Win condition: 3 complete property sets
    let completeSets = 0;

    Object.entries(player.properties).forEach(([color, cards]) => {
      const setInfo = PROPERTY_COLORS[color];
      const propertyCount = cards.filter(
        c => c.type === CARD_TYPES.PROPERTY || c.type === CARD_TYPES.PROPERTY_WILD || c.type === CARD_TYPES.PROPERTY_WILD_ALL
      ).length;

      if (propertyCount >= setInfo.setSize) {
        completeSets++;
      }
    });

    if (completeSets >= 3) {
      this.winner = player.id;
      this.state = 'finished';
    }
  }

  getStateForPlayer(playerId) {
    const player = this.players.find(p => p.id === playerId);
    const currentPlayer = this.getCurrentPlayer();

    return {
      gameCode: this.gameCode,
      state: this.state,
      currentPlayerId: currentPlayer ? currentPlayer.id : null,
      actionsRemaining: this.maxActionsPerTurn - this.actionsThisTurn,
      hasDrawnThisTurn: this.hasDrawnThisTurn,
      deckCount: this.deck.length,
      discardTop: this.discardPile.length > 0 ? this.discardPile[this.discardPile.length - 1] : null,
      pendingAction: this.pendingAction,
      mustDiscard: player && player.hand.length > 7 ? player.hand.length - 7 : 0,
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost,
        avatar: p.avatar,
        handCount: p.hand.length,
        hand: p.id === playerId ? p.hand : [],
        properties: p.properties,
        bank: p.bank,
        bankTotal: p.bank.reduce((sum, card) => sum + card.value, 0)
      })),
      myId: playerId,
      propertyColors: PROPERTY_COLORS
    };
  }

  // Play Again functionality
  initPlayAgain(playerId) {
    if (!this.playAgainVotes) {
      this.playAgainVotes = {};
    }
    this.playAgainVotes[playerId] = true;
    return this.getPlayAgainStatus();
  }

  getPlayAgainStatus() {
    const votes = this.players.map(p => ({
      id: p.id,
      name: p.name,
      accepted: this.playAgainVotes ? this.playAgainVotes[p.id] : undefined
    }));
    return { votes };
  }

  checkAllPlayersAccepted() {
    if (!this.playAgainVotes) return false;
    return this.players.every(p => this.playAgainVotes[p.id] === true);
  }

  restartGame() {
    // Reset game state but keep players
    this.state = 'playing';
    this.currentPlayerIndex = 0;
    this.deck = createDeck();
    this.shuffleDeck();
    this.discardPile = [];
    this.actionsThisTurn = 0;
    this.hasDrawnThisTurn = false;
    this.pendingAction = null;
    this.winner = null;
    this.playAgainVotes = null;

    // Reset player hands, properties, and banks
    this.players.forEach(p => {
      p.hand = [];
      p.properties = {};
      p.bank = [];
    });

    // Deal initial hands
    this.players.forEach(player => {
      for (let i = 0; i < 5; i++) {
        if (this.deck.length > 0) {
          player.hand.push(this.deck.pop());
        }
      }
    });
  }
}

module.exports = GameManager;
