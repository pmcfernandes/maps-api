# Map API

Simple GIS API for districts, municipalities and parishes (Portugal-style codes). See working version [here](https://mapas-api.impedro.com/docs)

## Project layout

- `src/` - application source
  - `src/index.js` - server bootstrap and route registration
  - `src/api/` - API controllers
    - `DocsController.js` - Open API documentation endpoint
    - `GisController.js` - GIS endpoints (districts, municipalities, parishes, limits, gps)
    - `WeatherController.js` - weather endpoint (uses OpenWeatherMap)
    - `FarmacyController.js`- pharmacies endpoint (get all pharmacies for a municipality)
    - `ZipCodeController.js` - postal code lookup
  - `src/helpers/db.js` - database helpers
  - `utils/` - utilities to optimize data
    - `codigos-postais.js` - update latitude and longitude of a road in codigos_postais table
- `swagger/` - OpenAPI specs
  - `swagger.yaml` - main OpenAPI spec

## Prerequisites

- Node.js (v16+ recommended)
- A running PostgreSQL instance with PostGIS (optional for local testing of GIS endpoints)

## Install

Open a terminal in the project root and run:

```powershell
npm install
```

## Environment

Create a `.env` file (or set environment variables) with:

``` .env
GEOCODING_API_KEY="your google geocode api key"
WEATHER_API_KEY="your openweather api key"
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=dbgis
DB_USER=dbgis_usr
DB_PASSWORD=password
```

## Run (development)

```powershell
npm run dev
```

This runs the server (default configured in `src/index.js`). If the server fails to start, check the console for the error and ensure required env vars and DB are available.

## Swagger / API docs

A minimal Swagger UI is served from `/docs` and points at `swagger/swagger.yaml` by default. You can also open the raw YAML at `/swagger.yaml`.

To validate the OpenAPI spec locally, run:

```powershell
npx @apidevtools/swagger-cli validate .\swagger\gis-swagger.yaml
```

(If you prefer a single combined spec, `swagger/swagger.yaml` has been trimmed to contain only the GIS endpoints.)

## Endpoints (high level)

- `GET /api/gis/distritos` — list districts
- `GET /api/gis/distrito/{dtmnfr}` — get district by 2-digit code
- `GET /api/gis/distrito/{dtmnfr}/municipios` — municipalities in district
- `GET /api/gis/distrito/{dtmnfr}/limites` — GeoJSON limits for district
- `GET /api/gis/municipio/{dtmnfr}` — get municipality by 4-digit code
- `GET /api/gis/municipio/{dtmnfr}/freguesia` — parishes in municipality
- `GET /api/gis/municipio/{dtmnfr}/limites` — GeoJSON limits for municipality
- `GET /api/gis/freguesia/{dtmnfr}` — get parish by 6-digit code
- `GET /api/gis/freguesia/{dtmnfr}/limites` — GeoJSON limits for parish
- `GET /api/gis/gps?lat={lat}&lng={lng}` — find parish containing coordinates

## Notes

- The GIS endpoints depend on PostGIS queries — if your DB is not populated or PostGIS is not available, responses may be empty or errors will be returned.
- `WeatherController` and `ZipCodeController` exist in `src/api/` but the main `swagger/swagger.yaml` has been trimmed to reflect only the GIS routes per your request. If you'd like them re-added to the spec or to the `/docs` UI, tell me and I will reintroduce them.

## Contributing

1. Create a branch
2. Make changes
3. Run tests (if added)
4. Open a PR
