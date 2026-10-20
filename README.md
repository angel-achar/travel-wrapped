# ✈️ Travel Wrapped

Log the countries you've visited and the trips you've taken, and Travel Wrapped turns them into a personal dashboard, a Spotify Wrapped–style yearly recap, and suggestions for where to go next.

**[Live demo](https://travel-wrapped-tau.vercel.app/dashboard?workspace=demo)** · [App](https://travel-wrapped-tau.vercel.app) · [API docs](https://travel-wrapped-api.vercel.app/docs)

## Features

- **Dashboard**: countries, continents, % of the world, trips, days traveled, and a by-continent chart
- **Been Tracker**: add visited countries (all 195), then search and filter by continent
- **Trips**: search, filter, and sort trips, with detail pages to edit or delete them
- **Wrapped**: a yearly recap with your top destination, longest trip, and travel personality
- **Recommendations**: places you haven't been yet, based on where you like to go
- **Polished states**: every page handles loading, empty (with one-click sample data), and error states
- **Private data**: each browser gets its own workspace, with no sign-up needed

## Tech Stack

| | |
| --- | --- |
| Frontend | Next.js (React), TypeScript, Tailwind CSS |
| Backend | FastAPI (Python), REST API |
| Database | PostgreSQL in production, SQLite locally |
| Testing | pytest, Vitest, React Testing Library |
| Hosting | Vercel |

## Run Locally

```bash
# Backend: http://localhost:8000
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend: http://localhost:3000 (in a second terminal)
cd frontend
npm install
npm run dev
```

## Tests

```bash
backend/venv/bin/python -m pytest backend   # backend
cd frontend && npm test                     # frontend
```

## What's Next

- User accounts and login
- An interactive world map
- Trip photos
