const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const GameManager = require('./gameManager');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Game state management
const games = new Map();
const playerSockets = new Map();

// Generate 6-character game code
function generateGameCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  // Create a new game
  socket.on('createGame', (playerName) => {
    const gameCode = generateGameCode();
    const playerId = uuidv4();

    const game = new GameManager(gameCode);
    game.addPlayer(playerId, playerName, socket.id, true);
    games.set(gameCode, game);
    playerSockets.set(socket.id, { gameCode, playerId });

    socket.join(gameCode);
    socket.emit('gameCreated', {
      gameCode,
      playerId,
      players: game.getPlayersInfo()
    });

    console.log(`Game ${gameCode} created by ${playerName}`);
  });

  // Join an existing game
  socket.on('joinGame', ({ gameCode, playerName }) => {
    const game = games.get(gameCode.toUpperCase());

    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    if (game.state !== 'lobby') {
      socket.emit('error', { message: 'Game already in progress' });
      return;
    }

    if (game.players.length >= 5) {
      socket.emit('error', { message: 'Game is full' });
      return;
    }

    const playerId = uuidv4();
    game.addPlayer(playerId, playerName, socket.id, false);
    playerSockets.set(socket.id, { gameCode: gameCode.toUpperCase(), playerId });

    socket.join(gameCode.toUpperCase());
    socket.emit('gameJoined', {
      gameCode: gameCode.toUpperCase(),
      playerId,
      players: game.getPlayersInfo()
    });

    // Notify all players in the lobby
    io.to(gameCode.toUpperCase()).emit('playerJoined', {
      players: game.getPlayersInfo()
    });

    console.log(`${playerName} joined game ${gameCode}`);
  });

  // Start the game (host only)
  socket.on('startGame', () => {
    const playerInfo = playerSockets.get(socket.id);
    if (!playerInfo) return;

    const game = games.get(playerInfo.gameCode);
    if (!game) return;

    const player = game.players.find(p => p.id === playerInfo.playerId);
    if (!player || !player.isHost) {
      socket.emit('error', { message: 'Only the host can start the game' });
      return;
    }

    if (game.players.length < 2) {
      socket.emit('error', { message: 'Need at least 2 players to start' });
      return;
    }

    game.startGame();

    // Send initial game state to each player
    game.players.forEach(p => {
      const playerSocket = io.sockets.sockets.get(p.socketId);
      if (playerSocket) {
        playerSocket.emit('gameStarted', game.getStateForPlayer(p.id));
      }
    });

    console.log(`Game ${playerInfo.gameCode} started`);
  });

  // Draw cards
  socket.on('drawCards', () => {
    const playerInfo = playerSockets.get(socket.id);
    if (!playerInfo) return;

    const game = games.get(playerInfo.gameCode);
    if (!game) return;

    const result = game.drawCards(playerInfo.playerId);
    if (result.error) {
      socket.emit('error', { message: result.error });
      return;
    }

    broadcastGameState(game);
  });

  // Play a card
  socket.on('playCard', ({ cardIndex, action, target, bankAsAction }) => {
    const playerInfo = playerSockets.get(socket.id);
    if (!playerInfo) return;

    const game = games.get(playerInfo.gameCode);
    if (!game) return;

    const result = game.playCard(playerInfo.playerId, cardIndex, action, target, bankAsAction);
    if (result.error) {
      socket.emit('error', { message: result.error });
      return;
    }

    // Try to auto-end turn if no actions left
    game.tryAutoEndTurn();

    broadcastGameState(game);

    // Check for winner
    if (game.winner) {
      io.to(playerInfo.gameCode).emit('gameOver', {
        winnerId: game.winner,
        winnerName: game.players.find(p => p.id === game.winner).name
      });
    }
  });

  // End turn
  socket.on('endTurn', () => {
    const playerInfo = playerSockets.get(socket.id);
    if (!playerInfo) return;

    const game = games.get(playerInfo.gameCode);
    if (!game) return;

    const result = game.endTurn(playerInfo.playerId);
    if (result.error) {
      socket.emit('error', { message: result.error });
      return;
    }

    broadcastGameState(game);
  });

  // Discard cards (when hand exceeds 7)
  socket.on('discardCard', ({ cardIndex }) => {
    const playerInfo = playerSockets.get(socket.id);
    if (!playerInfo) return;

    const game = games.get(playerInfo.gameCode);
    if (!game) return;

    const result = game.discardCard(playerInfo.playerId, cardIndex);
    if (result.error) {
      socket.emit('error', { message: result.error });
      return;
    }

    // Try to auto-end turn after discarding
    game.tryAutoEndTurn();

    broadcastGameState(game);
  });

  // Respond to action (Say No, pay rent, etc.)
  socket.on('respondToAction', ({ response, cards }) => {
    const playerInfo = playerSockets.get(socket.id);
    if (!playerInfo) return;

    const game = games.get(playerInfo.gameCode);
    if (!game) return;

    const result = game.respondToAction(playerInfo.playerId, response, cards);
    if (result.error) {
      socket.emit('error', { message: result.error });
      return;
    }

    // If Say No was used, broadcast notification to all players
    if (result.sayNoUsedBy) {
      io.to(playerInfo.gameCode).emit('sayNoUsed', {
        playerId: result.sayNoUsedBy.playerId,
        playerName: result.sayNoUsedBy.playerName
      });
    }

    // Try to auto-end turn after action resolves
    game.tryAutoEndTurn();

    broadcastGameState(game);
  });

  // Request play again
  socket.on('requestPlayAgain', () => {
    const playerInfo = playerSockets.get(socket.id);
    if (!playerInfo) {
      console.log('requestPlayAgain: No player info found');
      return;
    }

    const game = games.get(playerInfo.gameCode);
    if (!game) {
      console.log('requestPlayAgain: No game found');
      return;
    }
    if (game.state !== 'finished') {
      console.log('requestPlayAgain: Game state is not finished, state =', game.state);
      return;
    }

    console.log(`requestPlayAgain: Player ${playerInfo.playerId} requested play again`);
    const status = game.initPlayAgain(playerInfo.playerId);
    console.log('requestPlayAgain: Current votes:', JSON.stringify(status.votes));

    // Notify all players about the play again request
    io.to(playerInfo.gameCode).emit('playAgainRequested', status);

    // Check if all players accepted
    const allAccepted = game.checkAllPlayersAccepted();
    console.log('requestPlayAgain: All players accepted?', allAccepted);

    if (allAccepted) {
      console.log('requestPlayAgain: All players accepted! Restarting game...');
      game.restartGame();

      // Notify all players that game is restarting
      io.to(playerInfo.gameCode).emit('gameRestarted');

      // Send initial game state to each player
      game.players.forEach(p => {
        const playerSocket = io.sockets.sockets.get(p.socketId);
        if (playerSocket) {
          console.log(`requestPlayAgain: Sending gameStarted to player ${p.name}`);
          playerSocket.emit('gameStarted', game.getStateForPlayer(p.id));
        } else {
          console.log(`requestPlayAgain: No socket found for player ${p.name}`);
        }
      });

      console.log(`Game ${playerInfo.gameCode} restarted`);
    }
  });

  // Chat message
  socket.on('chatMessage', (message) => {
    const playerInfo = playerSockets.get(socket.id);
    if (!playerInfo) return;

    const game = games.get(playerInfo.gameCode);
    if (!game) return;

    const player = game.players.find(p => p.id === playerInfo.playerId);
    if (!player) return;

    // Sanitize message (basic XSS prevention)
    const sanitizedMessage = message
      .substring(0, 200)
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    if (sanitizedMessage.trim().length === 0) return;

    // Broadcast to all players in the game
    io.to(playerInfo.gameCode).emit('chatMessage', {
      playerId: playerInfo.playerId,
      playerName: player.name,
      message: sanitizedMessage,
      timestamp: Date.now()
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const playerInfo = playerSockets.get(socket.id);
    if (playerInfo) {
      const game = games.get(playerInfo.gameCode);
      if (game) {
        game.removePlayer(playerInfo.playerId);

        if (game.players.length === 0) {
          games.delete(playerInfo.gameCode);
          console.log(`Game ${playerInfo.gameCode} deleted (empty)`);
        } else {
          io.to(playerInfo.gameCode).emit('playerLeft', {
            players: game.getPlayersInfo()
          });
        }
      }
      playerSockets.delete(socket.id);
    }
    console.log('Player disconnected:', socket.id);
  });
});

function broadcastGameState(game) {
  game.players.forEach(p => {
    const playerSocket = io.sockets.sockets.get(p.socketId);
    if (playerSocket) {
      playerSocket.emit('gameState', game.getStateForPlayer(p.id));
    }
  });
}

const PORT = process.env.PORT || 8080;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
