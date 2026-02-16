# Property Deal - Online Multiplayer Card Game

A web-based, real-time multiplayer card game inspired by Monopoly Deal. Play with 2-5 friends directly in your browser!

**Play now:** [https://monopoly-deal-production.up.railway.app/](https://monopoly-deal-production.up.railway.app/)

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Open in browser:**
   Navigate to `http://localhost:3000`

4. **Play with friends:**
   - Click "Play with Friends" to create a new game
   - Share the game code or link with your friends
   - Once everyone has joined, the host starts the game

## How to Play

### Objective
Be the first player to collect **3 complete property sets** of different colors!

### Your Turn
1. **Draw 2 cards** from the deck (5 cards on your first turn)
2. **Play up to 3 cards** from your hand:
   - Add money to your bank
   - Place properties on the table
   - Play action cards against opponents
   - Charge rent on your properties
3. **End your turn** (discard down to 7 cards if needed)

### Card Types

| Card Type | Description |
|-----------|-------------|
| Money | Add to your bank for paying rent |
| Property | Collect sets to win the game |
| Wild Property | Can be used for multiple colors |
| Action | Special abilities (steal, charge, etc.) |
| Rent | Charge other players based on your properties |

### Key Actions
- **Rent:** Charge players who must pay from their bank/properties
- **Sly Deal:** Steal a single property (not from complete sets)
- **Forced Deal:** Swap one of your properties for an opponent's property (not from complete sets)
- **Deal Breaker:** Steal a complete property set!
- **Just Say No:** Block any action against you (can be countered with another Just Say No)
- **Pass Go:** Draw 2 extra cards
- **Birthday:** Everyone pays you $2M
- **Debt Collector:** One player pays you $5M
- **Double the Rent:** When playing a rent card, you'll be prompted to double the amount if you have this card in hand
- **House/Hotel:** Add to complete sets to increase rent value

### Just Say No Chains
You can counter a "Just Say No" with your own "Just Say No" card! For example:
- Player A plays Deal Breaker to steal Player B's set
- Player B plays Just Say No to block it
- Player A plays Just Say No to counter Player B's block
- Result: Player A gets the set (the No was No'd!)

Note: Playing Just Say No does NOT count as one of your 3 card plays per turn.

## Features

### Core Gameplay
- Real-time multiplayer (2-5 players)
- Complete Monopoly Deal card set (108 cards) with official values
- Turn-based gameplay with 3 cards per turn limit
- Automatic turn progression and card drawing
- Play again after a game ends with the same players

### Property System
- 10 property colors with different set requirements
- Wild cards that can be assigned to any color
- Houses and Hotels to boost rent on complete sets
- Protection for complete sets (can't be broken up for payments)

### Action Cards
- Full Just Say No chain support with counter mechanics
- Sly Deal and Forced Deal with informational popups for the target player
- Deal Breaker for complete set theft
- Double the Rent prompts automatically when playing rent cards
- Various rent cards (single color, multi-color, wild)
- Birthday and Debt Collector money actions

### Payment System
- Pay from bank first, then properties
- Complete sets are protected and shown separately
- Partial payments supported when you can't pay full amount
- Action cards can be banked as $0 value for payments

### User Interface
- Shareable game codes and direct invite links
- In-game chat with draggable chat panel
- Visual notifications for Just Say No plays
- Stacked property display for opponents
- House/Hotel badges on property sets
- Action confirmation dialogs
- Mobile-responsive design
- Smooth card animations

## Tech Stack
- **Frontend:** Vanilla HTML/CSS/JavaScript
- **Backend:** Node.js + Express
- **Real-time:** Socket.io
- **Testing:** Jest
- **Styling:** Custom CSS with animations

## Project Structure
```
├── server/
│   ├── index.js             # Express server + Socket.io
│   ├── gameManager.js       # Game logic and card system
│   └── gameManager.test.js  # Tests for game logic
├── public/
│   ├── index.html           # Main HTML file
│   ├── css/
│   │   └── styles.css       # All styles + animations
│   └── js/
│       └── game.js          # Client-side game logic
└── package.json
```

## Development

Run the test suite:
```bash
npm test
```

## Deployment

The game is deployed on [Railway](https://railway.app). The server automatically uses the `PORT` environment variable:

```bash
PORT=8080 npm start
```

## Property Sets Reference

| Color | Cards Needed | Property Value | Rent Values |
|-------|--------------|----------------|-------------|
| Brown | 2 | $1M | $1M, $2M |
| Light Blue | 3 | $1M | $1M, $2M, $3M |
| Pink | 3 | $2M | $1M, $2M, $4M |
| Orange | 3 | $2M | $1M, $3M, $5M |
| Red | 3 | $3M | $2M, $3M, $6M |
| Yellow | 3 | $3M | $2M, $4M, $6M |
| Green | 3 | $4M | $2M, $4M, $7M |
| Dark Blue | 2 | $4M | $3M, $8M |
| Railroad | 4 | $2M | $1M, $2M, $3M, $4M |
| Utility | 2 | $2M | $1M, $2M |

Houses add +$3M rent, Hotels add +$4M rent on top of that.
