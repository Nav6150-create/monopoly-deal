const GameManager = require('./gameManager');

describe('Starting player randomization', () => {
  function createGameWithPlayers(count) {
    const game = new GameManager('TEST');
    for (let i = 0; i < count; i++) {
      game.addPlayer(`p${i}`, `Player ${i}`, `socket${i}`, i === 0);
    }
    return game;
  }

  test('startGame picks a valid starting player', () => {
    const game = createGameWithPlayers(4);
    game.startGame();

    const playerIds = game.players.map(p => p.id);
    expect(playerIds).toContain(game.startingPlayerId);
    expect(game.currentPlayerIndex).toBeGreaterThanOrEqual(0);
    expect(game.currentPlayerIndex).toBeLessThan(4);
    expect(game.players[game.currentPlayerIndex].id).toBe(game.startingPlayerId);
  });

  test('restartGame picks a valid starting player', () => {
    const game = createGameWithPlayers(4);
    game.startGame();
    game.state = 'finished';

    game.restartGame();

    const playerIds = game.players.map(p => p.id);
    expect(playerIds).toContain(game.startingPlayerId);
    expect(game.currentPlayerIndex).toBeGreaterThanOrEqual(0);
    expect(game.currentPlayerIndex).toBeLessThan(4);
    expect(game.players[game.currentPlayerIndex].id).toBe(game.startingPlayerId);
  });

  test('randomization distributes across all players over many runs', () => {
    const playerCount = 4;
    const iterations = 1000;
    const startCounts = { p0: 0, p1: 0, p2: 0, p3: 0 };

    for (let i = 0; i < iterations; i++) {
      const game = createGameWithPlayers(playerCount);
      game.startGame();
      startCounts[game.startingPlayerId]++;
    }

    // Each player should be picked roughly 25% of the time.
    // With 1000 iterations, we expect ~250 each. Allow a wide margin
    // but ensure no player is never picked (which would indicate a bug).
    for (const id of Object.keys(startCounts)) {
      expect(startCounts[id]).toBeGreaterThan(100);
      expect(startCounts[id]).toBeLessThan(400);
    }
  });

  test('restartGame randomization also distributes across players', () => {
    const playerCount = 4;
    const iterations = 1000;
    const startCounts = { p0: 0, p1: 0, p2: 0, p3: 0 };

    for (let i = 0; i < iterations; i++) {
      const game = createGameWithPlayers(playerCount);
      game.startGame();
      game.state = 'finished';
      game.restartGame();
      startCounts[game.startingPlayerId]++;
    }

    for (const id of Object.keys(startCounts)) {
      expect(startCounts[id]).toBeGreaterThan(100);
      expect(startCounts[id]).toBeLessThan(400);
    }
  });

  test('works correctly with 2 players', () => {
    const iterations = 200;
    const startCounts = { p0: 0, p1: 0 };

    for (let i = 0; i < iterations; i++) {
      const game = createGameWithPlayers(2);
      game.startGame();
      startCounts[game.startingPlayerId]++;
    }

    expect(startCounts.p0).toBeGreaterThan(50);
    expect(startCounts.p1).toBeGreaterThan(50);
  });
});
