# leaderboard-local

Local leaderboard project using Express, MongoDB, Redis, and date-fns.

## Setup

1. Start services:
   ```bash
   docker compose up -d
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the server:
   ```bash
   npm start
   ```
4. Seed sample data:
   ```bash
   npm run seed
   ```

## Endpoints

- POST /events
- GET /leaderboard
- GET /leaderboard/me
- PUT /admin/points-config
- POST /admin/rollover






Hello Piyu
