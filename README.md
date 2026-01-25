# Property Deal - Online Multiplayer Card Game

A web-based, real-time multiplayer card game inspired by Monopoly Deal. Play with 2-5 friends directly in your browser!

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
1. **Draw 2 cards** from the deck
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
- **Sly Deal:** Steal a property (not from complete sets)
- **Deal Breaker:** Steal a complete property set!
- **Just Say No:** Block any action against you
- **Pass Go:** Draw 2 extra cards
- **Birthday:** Everyone pays you $2M
- **Debt Collector:** One player pays you $5M

## Tech Stack
- **Frontend:** Vanilla HTML/CSS/JavaScript
- **Backend:** Node.js + Express
- **Real-time:** Socket.io
- **Styling:** Custom CSS with animations

## Project Structure
```
├── server/
│   ├── index.js        # Express server + Socket.io
│   └── gameManager.js  # Game logic and card system
├── public/
│   ├── index.html      # Main HTML file
│   ├── css/
│   │   └── styles.css  # All styles + animations
│   └── js/
│       └── game.js     # Client-side game logic
└── package.json
```

## Features
- Real-time multiplayer (2-5 players)
- Shareable game codes and links
- Mobile-responsive design
- Smooth card animations
- Complete Monopoly Deal card set
- Turn-based gameplay with action counters
- Payment system for rent and fees
- "Just Say No" blocking mechanism

## Development

The server runs on port 3000 by default. You can change this by setting the `PORT` environment variable:

```bash
PORT=8080 npm start
```

Enjoy the game!
