# AgriShift AI

> Climate-smart agricultural decision support for Bangladesh, powered by NASA POWER climate data.

AgriShift AI converts localized agroclimate observations into understandable crop recommendations, climate-risk signals, and bilingual farmer advisories. It is designed for farmers, agricultural students, extension workers, and anyone exploring climate-aware crop planning.

[![React](https://img.shields.io/badge/Frontend-React_19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Build-Vite_7-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![NASA POWER](https://img.shields.io/badge/Data-NASA_POWER-0B3D91?style=flat-square&logo=nasa&logoColor=white)](https://power.larc.nasa.gov/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)

## Why AgriShift AI?

Bangladesh agriculture is highly sensitive to changing rainfall, heat, soil moisture, and seasonal patterns. AgriShift AI provides a single workflow to:

- compare crop suitability using current climate conditions;
- understand the factors behind a recommendation;
- monitor drought, flood/excess-rainfall, and heat-stress risk;
- receive actionable guidance in English and Bangla;
- inspect a selected district or any valid latitude/longitude;
- save farm parcels for authenticated users.

> **Important:** This is a decision-support prototype, not a replacement for local agronomists, field observations, soil tests, or official weather warnings.

## Core features

- **NASA POWER climate data:** Daily temperature, rainfall, humidity, solar radiation, wind, and root-zone wetness data.
- **Bangladesh monitoring locations:** Bogura, Rangpur, Dinajpur, Rajshahi, and Sylhet, plus custom coordinates.
- **Crop ranking:** Rice (ধান), Wheat (গম), Maize (ভুট্টা), Jute (পাট), Potato (আলু), and Mustard (সরিষা).
- **Explainable recommendations:** Factor scores, favorable conditions, caution factors, reasoning, and sowing periods.
- **Two recommendation engines:** A deterministic rule-based baseline and an optional Random Forest artifact when available.
- **Climate-risk intelligence:** Drought, flood/excess rainfall, and heat-stress scoring with what-if overrides.
- **Bilingual farmer advisories:** Irrigation, crop selection, heat protection, rainfall preparation, and sowing-timing guidance.
- **Interactive map:** Select a location and request climate data for that point.
- **Farm management:** Create, list, view, update, and delete saved farm parcels through JWT-protected API endpoints.
- **Presentation modes:** Normal interface and video-background mode.

## Architecture

```text
┌──────────────────────┐       REST/JSON        ┌────────────────────────┐
│ React + Vite frontend│ ◄────────────────────► │ FastAPI backend         │
│ Map, charts, dashboard│                       │ Auth, analysis, advisory│
└──────────┬───────────┘                       └───────────┬────────────┘
           │                                               │
           │                                       ┌───────┴────────┐
           │                                       │ NASA POWER API  │
           │                                       │ SQLite/Postgres │
           │                                       │ Rule/ML engine  │
           │                                       └────────────────┘
```

The backend defaults to SQLite for local development. PostgreSQL can be used for production deployments.

## Technology stack

| Area | Technologies |
| --- | --- |
| Frontend | React 19, Vite 7, Tailwind CSS 4, React-Leaflet, Recharts, Lucide |
| Backend | FastAPI, Uvicorn, Pydantic Settings, SQLAlchemy |
| Authentication | JWT with `python-jose`; password hashing with Passlib/bcrypt |
| Data and ML | NASA POWER, NumPy, pandas, scikit-learn, joblib |
| Testing | Vitest, React Testing Library, pytest, pytest-asyncio |

## Project structure

```text
Agrishift-AI/
├── backend/
│   ├── main.py                 # FastAPI app and router registration
│   ├── app/
│   │   ├── models/             # User and farm database models
│   │   ├── routers/            # Auth, NASA, prediction, risk, advisory, farm APIs
│   │   ├── schemas/            # Request and response validation
│   │   └── services/           # NASA client, scoring, risk, advisory, auth logic
│   ├── tests/                  # Backend tests
│   └── requirements.txt
├── ml/
│   └── train_model.py          # Synthetic-data model training pipeline
├── src/
│   ├── components/             # Dashboard and UI components
│   ├── context/                # Frontend authentication context
│   ├── services/               # API clients
│   └── test/                   # Frontend tests
├── .env.example                # Frontend environment template
├── backend/.env.example        # Backend environment template
├── package.json
└── README.md
```

## Requirements

- Node.js 20.19+ or 22.12+
- Python 3.10+
- Git

## Local setup

### 1. Clone the repository

```bash
git clone https://github.com/naimNB/Agrishift-AI.git
cd Agrishift-AI
```

### 2. Configure the frontend

```bash
cp .env.example .env
```

The default value is:

```env
VITE_API_URL=http://localhost:8000
```

### 3. Create and configure the backend environment

```bash
cp backend/.env.example backend/.env
```

For production, replace `SECRET_KEY` with a random value of at least 32 characters. For example:

```bash
openssl rand -hex 32
```

### 4. Install backend dependencies

```bash
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r backend/requirements.txt
```

### 5. Install frontend dependencies

```bash
npm install
```

## Run the application

Open two terminals from the repository root.

**Terminal 1 — backend**

```bash
source .venv/bin/activate
cd backend
uvicorn main:app --reload --port 8000
```

Backend API: <http://localhost:8000>
Interactive API docs: <http://localhost:8000/docs>

**Terminal 2 — frontend**

```bash
npm run dev
```

Frontend: <http://localhost:5173>

## Testing

Run the frontend suite:

```bash
npm test
```

Run the backend suite from the repository root:

```bash
pytest backend/tests -v
```

The tests mock external NASA requests, so they do not require live NASA API access.

## API overview

The backend exposes OpenAPI documentation at `/docs`. The main endpoints are:

| Method | Endpoint | Purpose | Authentication |
| --- | --- | --- | --- |
| `GET` | `/health` | Service health check | Public |
| `POST` | `/api/auth/register` | Create an account | Public |
| `POST` | `/api/auth/login` | Obtain a JWT access token | Public |
| `GET` | `/api/auth/me` | Read the current user | JWT |
| `GET` | `/api/nasa/districts` | List supported districts | Public |
| `GET` | `/api/nasa/climate` | Fetch daily climate data | Public |
| `GET` | `/api/nasa/climate/summary` | Fetch climate summary statistics | Public |
| `POST` | `/api/predictions/rank-crops` | Rank all candidate crops | Public |
| `POST` | `/api/predictions/crop-suitability` | Evaluate one crop | Public |
| `GET` | `/api/risk/climate` | Assess three climate risks | Public |
| `GET` | `/api/advisory` or `/api/advisory/farmer` | Generate bilingual advisories | Public |
| `GET` | `/api/farms` | List the current user's farms | JWT |
| `POST` | `/api/farms` | Save a farm parcel | JWT |
| `GET` | `/api/farms/{farm_id}` | Read one saved farm | JWT |
| `PUT` | `/api/farms/{farm_id}` | Update a saved farm | JWT |
| `DELETE` | `/api/farms/{farm_id}` | Delete a saved farm | JWT |

### Example requests

Fetch climate data for Bogura:

```bash
curl "http://localhost:8000/api/nasa/climate?district=bogura"
```

Fetch climate data for custom coordinates:

```bash
curl "http://localhost:8000/api/nasa/climate?latitude=24.8465&longitude=89.3773"
```

Rank crops using the rule-based engine:

```bash
curl -X POST "http://localhost:8000/api/predictions/rank-crops" \
  -H "Content-Type: application/json" \
  -d '{
    "district": "bogura",
    "temp_avg": 27.5,
    "precipitation": 4.0,
    "humidity": 70,
    "soil_moisture": 0.45,
    "solar_rad": 5.2,
    "wind_speed": 2.1,
    "use_ml": false
  }'
```

Simulate heat, rainfall, or soil-moisture scenarios:

```bash
curl "http://localhost:8000/api/risk/climate?district=bogura&temp_max=40&precipitation=5&soil_moisture=0.2"
```

## Data and model notes

- NASA POWER is used as the external climate-data source; it provides gridded/point agroclimatology data rather than direct field-sensor measurements.
- The default crop-ranking and risk logic is transparent threshold/rule-based logic oriented toward Bangladesh conditions.
- The optional ML pipeline uses a synthetic training dataset generated from prototype agronomic rules. It is useful for experimentation, but it is not a substitute for empirical yield data or field validation.
- Recommendations should be checked against local soil tests, irrigation access, crop variety, pest pressure, current field conditions, and official agricultural guidance.

## Production checklist

- Set `ENVIRONMENT=production`.
- Use a strong random `SECRET_KEY`; never commit `.env` files.
- Use PostgreSQL or another managed database for multi-worker deployments.
- Restrict CORS origins to the deployed frontend domain.
- Put the API behind HTTPS and a reverse proxy.
- Run `npm run build` and serve the generated frontend assets through a static host or CDN.
- Add monitoring, backups, rate limiting, and official weather-alert integrations before serving real users.

## Roadmap

- Empirical calibration with multi-season Bangladesh field and yield data.
- Offline-first PWA and SMS/low-bandwidth advisory delivery.
- Higher-resolution satellite vegetation indices and raster overlays.
- Integration with localized official weather and radar-warning sources.
- Soil-test and farm-sensor integrations.

## Attribution and disclaimer

NASA POWER data is provided by the NASA Langley Research Center POWER Project, funded through the NASA Earth Science Directorate Applied Sciences Program: <https://power.larc.nasa.gov/>.

AgriShift AI is an independent project and is not endorsed by or affiliated with NASA. Climate and crop outputs are informational decision support only; users should consult qualified local agricultural professionals for production decisions.

## License

No license file is currently included in this repository. Add a `LICENSE` file before distributing the project or accepting external contributions under a specific license.
