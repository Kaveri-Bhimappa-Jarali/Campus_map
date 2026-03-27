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

## Showing Path Between Source and Destination

To display paths/routes between locations on the campus map:

**Dependencies Used:**
- **@react-google-maps/api** - Provides the `DirectionsService` and `DirectionsRenderer` components for calculating and displaying routes
- **@googlemaps/js-api-loader** - Ensures the Google Maps API is properly loaded before route calculations

**Google Cloud Setup:**
- Enable the **Routes API** in Google Cloud Console (modern option, recommended)
- OR enable **Directions API** (legacy option)

**Usage:**
The routing functionality uses Google Maps' route calculation services to compute optimal paths between two points and render them as polylines on the map. Ensure your API key has access to either the Routes or Directions API depending on which method your implementation uses.

## Dependencies

### Production Dependencies

The following dependencies are used in this project:

- **React** (`react@^19.2.4`) - Core UI library for building the interface
- **React DOM** (`react-dom@^19.2.4`) - React rendering for the browser
- **React Router** (`react-router@^7.13.1`) - For handling application routing and navigation
- **Google Maps API Loader** (`@googlemaps/js-api-loader@^1.16.10`) - For loading the Google Maps API script dynamically
- **React Google Maps API** (`@react-google-maps/api@^2.20.8`) - React wrappers for Google Maps components

### Development Dependencies

Development tools used for building and maintaining this project:

- **Vite** (`vite@^8.0.0`) - Fast build tool and development server
- **Tailwind CSS** (`tailwindcss@^4.2.1`) - Utility-first CSS framework for styling
- **Tailwind CSS PostCSS** (`@tailwindcss/postcss@^4.2.1`) - PostCSS plugin for Tailwind CSS
- **PostCSS** (`postcss@^8.5.8`) - JavaScript tool for transforming CSS
- **Autoprefixer** (`autoprefixer@^10.4.27`) - Adds vendor prefixes to CSS rules
- **Vite React Plugin** (`@vitejs/plugin-react@^6.0.0`) - React Fast Refresh support for Vite
- **ESLint** (`eslint@^9.39.4`) - JavaScript linter for code quality
- **ESLint JS** (`@eslint/js@^9.39.4`) - ESLint configuration for JavaScript
- **ESLint React Plugins** (`eslint-plugin-react-hooks@^7.0.1`, `eslint-plugin-react-refresh@^0.5.2`) - React-specific ESLint rules
- **TypeScript Types** (`@types/react@^19.2.14`, `@types/react-dom@^19.2.3`) - TypeScript type definitions for React

## Available Commands

Run the following commands using `npm run <command>`:

- **`npm run dev`** - Start the local development server with hot module replacement (HMR)
  - Server runs at `http://localhost:5173` by default
  - Changes are instantly reflected in the browser

- **`npm run build`** - Create an optimized production build
  - Outputs compiled files to the `dist/` directory
  - Ready for deployment

- **`npm run lint`** - Run ESLint to check code quality
  - Reports any linting errors or warnings
  - Use this before committing code

- **`npm run preview`** - Preview the production build locally
  - Simulates the production environment
  - Useful for testing before deployment
