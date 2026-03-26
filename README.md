# Campus Map (React + Vite)

This project renders a campus map using Google Maps.

## Local setup

1) Install deps

```bash
npm install
```

2) Create a `.env` from `.env.example`

```bash
copy .env.example .env
```

Fill in:

- `VITE_GOOGLE_MAPS_API_KEY`
- (recommended) `VITE_GOOGLE_MAPS_MAP_ID`
- `VITE_ENABLE_ADVANCED_MARKERS` (optional; default is `false`)

3) Start dev server

```bash
npm run dev
```

## Google Maps requirements

In Google Cloud Console for the project that owns your API key:

- Enable **billing**
- Enable **Maps JavaScript API**
- If you want routing lines, enable **Routes API** (or **Directions API** if you switch to legacy directions)
- If your key is restricted, add an **HTTP referrer** rule for local dev:
  - `http://localhost:5173/*`
