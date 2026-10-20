# Travel Wrapped

Travel Wrapped is a full-stack travel tracking application that lets users record where they have been, visualize their travel history, receive destination recommendations, and generate an annual Spotify Wrapped-style recap.

## MVP Goal

A user can:

- Create an account
- Add a country they have visited
- Add optional cities
- Add optional travel dates
- Add optional hotels, activities, restaurants, notes, and photos
- View visited countries on a world map
- See the percentage of the world they have visited
- Receive destination recommendations
- Generate an annual Travel Wrapped recap

## Core Pages

- `/` — Landing page
- `/login` — Sign in and sign up
- `/dashboard` — Travel overview
- `/been` — Countries and cities visited
- `/trips` — List of trips
- `/trips/new` — Create a trip
- `/trips/[id]` — Trip details
- `/recommendations` — Suggested destinations
- `/wrapped` — Annual recap

## Core Features

### Been Tracker

- Add visited countries
- Add optional cities
- Add optional dates
- Display countries visited
- Display cities visited
- Display continents visited
- Calculate percentage of countries visited

Percentage formula:

countries visited / total countries × 100

For the MVP, use 195 as the total number of countries.

### Trips

Each trip can contain:

- Title
- Start date
- End date
- Countries
- Cities
- Hotels
- Restaurants
- Activities
- Notes
- Photos

Only the trip title and at least one country are required.

### Recommendations

Recommendations will initially be based on:

- Countries visited
- Cities visited
- Preferred activities
- Travel categories
- Similar destinations

The MVP can use rule-based recommendations.

AI-generated explanations can be added later.

### Travel Wrapped

The annual recap should display:

- Countries visited
- Cities visited
- Trips taken
- Percentage of the world visited
- Miles traveled
- Longest trip
- Most visited country
- Most visited city
- Favorite travel category
- Photo count
- AI-generated summary

## Tech Stack

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion
- Mapbox or React Map GL
- Recharts

### Backend

- FastAPI
- Python

### Database and Authentication

- Supabase PostgreSQL
- Supabase Authentication
- Supabase Storage

### Deployment

- Vercel for frontend
- Render for backend
- Supabase for database, authentication, and storage

## MVP Build Order

1. Landing page
2. App navigation
3. Supabase setup
4. Authentication
5. Database tables
6. Add visited country and city
7. Been dashboard
8. Trip creation
9. Trip details
10. Recommendations
11. Wrapped analytics
12. AI summary
13. Deployment
14. README and demo account

## Features Not Included in the First Version

- Google Maps Timeline import
- Flight email import
- Automatic photo location extraction
- Friend comparisons
- Social sharing
- Detailed spending analytics
- 3D globe
- Automatic weather history