# Destination Catch

Web app (installs to a phone home screen) that ranks nearby fishing spots for current conditions and shows what to target, the gear, and the rules.

## Run locally
    npm install
    npm run dev      # http://localhost:3000
    npm test         # scoring tests

## Environment variables (set in Vercel, never commit)
- `WILLYWEATHER_API_KEY`: tide tables. Without it the app falls back to modelled tides and says so.
- `NEXT_PUBLIC_MAPBOX_TOKEN`: satellite map of the spots. Optional.

## Where things live
- `data/spots.json`: curated spots. `status` is `imagery` until someone has checked it on site, then `verified`.
- `data/species.json`: species, gear and VFA limits (Victoria). Other states need their own rules before we list spots there.
- `lib/score.mjs`: go / marginal / don't bother logic. Pure functions with tests.
- `lib/conditions.ts`: Open-Meteo weather and swell, WillyWeather tides.
- `app/api/plan`: one call returns nearby spots, ratings and conditions.

## Data sources
Open-Meteo (free for development; a commercial plan is needed before charging), WillyWeather API (first 5,000 requests free), Mapbox Static Images.
