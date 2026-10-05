# AgriShift AI — NASA-Powered Agricultural Decision Support System

> **A climate-smart agricultural intelligence and decision support platform translating NASA Earth observation data into localized, actionable crop advisory for Bangladesh.**

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Bundler-Vite_7-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS v4](https://img.shields.io/badge/Styling-Tailwind_CSS_v4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![NASA POWER](https://img.shields.io/badge/Data-NASA_POWER_API-0B3D91?style=flat-square&logo=nasa&logoColor=white)](https://power.larc.nasa.gov/)
[![scikit-learn](https://img.shields.io/badge/ML-scikit--learn-F7931E?style=flat-square&logo=scikit-learn&logoColor=white)](https://scikit-learn.org)
[![Leaflet](https://img.shields.io/badge/Maps-Leaflet_&_OSM-199900?style=flat-square&logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![Tests Passing](https://img.shields.io/badge/Tests-62_Passed-success?style=flat-square&logo=pytest&logoColor=white)](https://docs.pytest.org)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Proposed Solution](#3-proposed-solution)
4. [Key System Features](#4-key-system-features)
5. [System Architecture](#5-system-architecture)
6. [Technology Stack](#6-technology-stack)
7. [NASA Data Sources & Parameters](#7-nasa-data-sources--parameters)
8. [Crop Recommendation & Ranking Engine](#8-crop-recommendation--ranking-engine)
9. [Machine Learning Pipeline & Comparison](#9-machine-learning-pipeline--comparison)
10. [Climate Risk Intelligence Module](#10-climate-risk-intelligence-module)
11. [Actionable Farmer Advisory Engine](#11-actionable-farmer-advisory-engine)
12. [Interactive Farm Location Map](#12-interactive-farm-location-map)
13. [My Farm Management (CRUD)](#13-my-farm-management-crud)
14. [Frontend Authentication System](#14-frontend-authentication-system)
15. [Unified Production Dashboard](#15-unified-production-dashboard)
16. [Automated Testing Suite](#16-automated-testing-suite)
17. [Project Directory Structure](#17-project-directory-structure)
18. [Environment Configuration](#18-environment-configuration)
19. [Installation & Setup](#19-installation--setup)
20. [Running the Application](#20-running-the-application)
21. [API Endpoint Reference](#21-api-endpoint-reference)
22. [Production Deployment Guidelines](#22-production-deployment-guidelines)
23. [Demonstration / Judging Flow](#23-demonstration--judging-flow)
24. [Remaining Limitations & Future Roadmap](#24-remaining-limitations--future-roadmap)
25. [Data Attribution & References](#25-data-attribution--references)
26. [License](#26-license)

---

## 1. Project Overview

**AgriShift AI** is an end-to-end agroclimatological intelligence and decision support platform engineered specifically for the agricultural landscape of **Bangladesh** (with concentrated focus on **Bogura**, **Rangpur**, **Dinajpur**, **Rajshahi**, and **Sylhet**).

The system translates daily satellite-derived meteorological telemetry from the **NASA POWER** (Prediction Of Worldwide Energy Resources) Agroclimatology dataset into clear, transparent, and actionable agricultural directives. It assesses environmental stressors against physiological crop requirements to deliver candidate crop suitability rankings, climate risk indices (Drought, Flood, Heat Stress), bilingual farmer advisories, and farm-level monitoring.

---

## 2. Problem Statement

Agriculture in Bangladesh employs over 40% of the labor force and sustains national food security, but faces compounding climate vulnerabilities:

* **Hydrological Stress in Northwest Bangladesh:** The High Barind Tract (Rajshahi, Dinajpur, Bogura) faces severe aquifer depletion driven by dry-season Boro rice monoculture. Crop diversification towards lower water-demand crops (Wheat, Maize, Mustard, Potato) is an existential priority.
* **Precipitation Volatility:** Shifting monsoon patterns and high-intensity rainfall spikes generate abrupt waterlogging and root hypoxia in floodplains.
* **Extreme Heat Events:** Heat spikes above 35°C during the critical flowering and grain-filling windows of Rabi crops induce sterility and premature senescence.
* **Actionability Gap:** Smallholders and field extension agents lack access to localized, satellite-grounded advice formatted in their native language (Bangla) with transparent reasoning.

---

## 3. Proposed Solution

AgriShift AI bridges the gap between Earth observation data and smallholder decision-making:

1. **Automated NASA POWER Ingestion:** Pulls near-real-time observations of temperature, precipitation, humidity, solar radiation, wind speed, and root-zone soil wetness.
2. **Defensible Hybrid Decision Engine:** Features both a Bangladesh Agro-Ecological Zone (AEZ) agronomic rule baseline and a trained Random Forest classifier with transparent factor suitability scoring (0–100%).
3. **Agroclimatic Hazard Quantification:** Calculates quantitative risk scores for Drought, Flood, and Heat Stress with interactive what-if simulation overrides.
4. **Bilingual Actionable Directives:** Generates deterministic, explainable advisory statements in both English and Bangla (বাংলা).
5. **Interactive Farm Mapping:** Enables point-and-click coordinate selection anywhere across Bangladesh with instant NASA telemetry retrieval.
6. **Farm Portfolio Management:** Allows authenticated growers to manage multiple fields with customized crop and soil tracking.

---

## 4. Key System Features

* **Multi-Crop Suitability Ranking:** Simultaneously evaluates and ranks 6 major Bangladesh candidate crops: **Rice (ধান)**, **Wheat (গম)**, **Maize (ভুট্টা)**, **Jute (পাট)**, **Potato (আলু)**, and **Mustard (সরিষা)**.
* **Explainable Factor Breakdown:** Visualizes individual suitability percentages for Temperature, Rainfall, Humidity, Soil Moisture, and Solar Radiation alongside favorable and caution indicators.
* **Climate Risk Intelligence:** 3 dedicated hazard monitors (**Drought Risk**, **Flood / Excess Rainfall Risk**, **Heat Stress Risk**) with what-if parameter sliders and agronomic mitigation actions.
* **Farmer Advisory Engine:** Generates priority-tagged directives across 5 categories: Irrigation, Crop Selection, Heat Protection, Flood Preparation, and Sowing Timing (Bilingual EN/BN).
* **Interactive Leaflet Map:** Bangladesh-centered interactive map with district jump points, reverse geocoding to the nearest monitoring hub, and coordinate validation.
* **My Farm Management:** Secure CRUD management of farm profiles (area, soil type, crop, planting date) with one-click telemetry and recommendation runs.
* **Dual Presentation Modes:** Supports standard high-contrast dark mode and immersive video background playback.
* **Complete Automated Testing:** 62 automated unit and integration tests across Frontend (Vitest + RTL) and Backend (pytest).

---

## 5. System Architecture

```
                    ┌──────────────────────────────────────────────┐
                    │              Farmer / Extension Agent        │
                    └───────────────────────┬──────────────────────┘
                                            │ HTTPS
                                            ▼
                    ┌──────────────────────────────────────────────┐
                    │               React 19 Frontend              │
                    │   (Vite 7, Tailwind v4, Leaflet, Recharts)   │
                    └───────────────────────┬──────────────────────┘
                                            │ REST API (JSON) + JWT
                                            ▼
                    ┌──────────────────────────────────────────────┐
                    │             FastAPI Backend Engine           │
                    │  (/api/nasa, /api/pred, /api/risk, /advisory)│
                    └───┬─────────────┬─────────────┬────────────┬─┘
                        │             │             │            │
            ┌───────────┴───┐  ┌──────┴──────┐ ┌────┴─────┐ ┌───┴──────────┐
            │ NASA POWER    │  │ AEZ Rules & │ │ Climate  │ │ SQLite /     │
            │ Daily API     │  │ ML Engine   │ │ Risk &   │ │ PostgreSQL   │
            │ (Agroclimate) │  │ (sklearn)   │ │ Advisory │ │ (Users/Farms)│
            └───────────────┘  └─────────────┘ └──────────┘ └──────────────┘
```

---

## 6. Technology Stack

### Frontend
| Component | Technology | Version | Description |
| :--- | :--- | :--- | :--- |
| **Framework** | React | `^19.0.0` | Modern component architecture with Hooks & Context |
| **Bundler** | Vite | `^7.0.0` | Ultra-fast HMR and optimized production bundling |
| **Styling** | Tailwind CSS | `^4.3.3` | Utility-first CSS using `@theme` design tokens |
| **Maps** | Leaflet & React-Leaflet | `^1.9.4 / ^5.0.0` | Interactive mapping with OpenStreetMap tiles |
| **Charts** | Recharts | `^3.10.1` | Responsive historical climate trend visualization |
| **Iconography** | Lucide React | `^0.468.0` | Clean, accessible vector icons |
| **Testing** | Vitest & React Testing Library | `^5.0.3 / ^16.3.3` | Automated unit and component integration testing |

### Backend
| Component | Technology | Version | Description |
| :--- | :--- | :--- | :--- |
| **Framework** | FastAPI | `0.115.0` | Asynchronous, OpenAPI-compliant Python web framework |
| **ASGI Server** | Uvicorn | `0.30.6` | High-concurrency production ASGI server |
| **Database** | SQLAlchemy & SQLite | `2.0.36` | ORM modeling with connection pooling |
| **Validation** | Pydantic v2 | `^2.5.2` | Strict schema validation and settings management |
| **Auth** | python-jose & passlib | `3.3.0 / 1.7.4` | JWT token issuance and bcrypt password hashing |
| **HTTP Client** | HTTPX | `0.27.2` | Asynchronous client for upstream NASA API queries |
| **ML Engine** | scikit-learn & joblib | `1.5.2 / 1.4.2` | Random Forest classifier and model persistence |
| **Testing** | pytest & pytest-asyncio | `^9.1.1 / ^1.4.0` | Test suite with mocked external requests |

---

## 7. NASA Data Sources & Parameters

AgriShift AI queries daily agroclimatological feeds from the **NASA POWER** (Prediction Of Worldwide Energy Resources) Daily Point API (`community=AG`).

| Parameter | NASA Key | Unit | Agronomic Significance |
| :--- | :--- | :--- | :--- |
| **Mean Temperature** | `T2M` | °C | Thermal regime & growing degree-day (GDD) accumulation |
| **Max Temperature** | `T2M_MAX` | °C | Daytime thermal spikes and flowering heat stress |
| **Min Temperature** | `T2M_MIN` | °C | Cold injury risk and chilling hours during Rabi |
| **Precipitation** | `PRECTOTCORR` | mm/day | Water availability, dry spell length, flood hazard |
| **Relative Humidity** | `RH2M` | % | Transpiration rates & fungal blast/blight susceptibility |
| **Solar Radiation** | `ALLSKY_SFC_SW_DWN` | kWh/m²/day | Photosynthetic irradiance & biomass accumulation |
| **Surface Wind Speed** | `WS2M` | m/s | Evapotranspirative loss and lodging hazard |
| **Root-Zone Wetness** | `GWETROOT` | 0.0–1.0 | Subsurface moisture availability (0 = dry, 1 = saturated) |

### Regional Bangladesh Monitoring Hubs
* **Bogura:** `24.8465°N, 89.3773°E` (Central Northern Agricultural Hub)
* **Rangpur:** `25.7439°N, 89.2752°E` (Tista Basin)
* **Dinajpur:** `25.6279°N, 88.6338°E` (Northern Alluvial Plains)
* **Rajshahi:** `24.3636°N, 88.6241°E` (High Barind Tract)
* **Sylhet:** `24.8949°N, 91.8687°E` (Surma River Basin)

---

## 8. Crop Recommendation & Ranking Engine

The multi-crop ranking engine evaluates all 6 candidate crops simultaneously:

1. **Defensible AEZ Rule Baseline:** Grounded in BARC & BRRI agronomic thresholds. Evaluates non-linear suitability curves for temperature, moisture, rainfall, humidity, and solar radiation.
2. **Transparent Scoring:** Each crop receives individual factor scores from 0% to 100%, enabling farmers to understand *why* a crop is recommended.
3. **ML Classifier Support:** Provides seamless toggle to a trained Random Forest model (`use_ml=true`) with automatic fallback to the rule engine if model artifacts are unavailable.
4. **No Fabricated Claims:** Results explicitly state whether they originate from the Agro-Ecological Zone rule engine or the machine learning classifier (`is_ai_model: false` vs `true`).

---

## 9. Machine Learning Pipeline & Comparison

The ML pipeline (`ml/train_model.py`) evaluates multiple model families against agroclimate features:

* **Models Evaluated:** Random Forest, Gradient Boosting, Logistic Regression.
* **Validation Methodology:** Stratified train/test split (80/20) with cross-validation.
* **Leakage Prevention:** Pipeline encapsulating `StandardScaler` and model parameters without data contamination.
* **Artifact Metadata:** Serialized metadata JSON (`backend/ml_models/model_metadata.json`) recording training date, feature names, confusion matrix, precision, recall, and F1 scores.

---

## 10. Climate Risk Intelligence Module

Evaluates 3 primary environmental hazards via `/api/risk/climate`:
1. **Drought Risk:** Combines root-zone wetness depletion (`GWETROOT < 0.30`), cumulative rainfall deficits over 14 days, consecutive dry spell sequences, and vapor pressure deficits.
2. **Flood & Excess Rain Risk:** Assesses 24-hour peak precipitation intensity (`>50 mm`), 3-day cumulative rainfall (`>80 mm`), and soil saturation levels.
3. **Heat Stress Risk:** Evaluates daytime max temperatures (`>35°C`), Steadman/Rothfusz heat index approximations, and humidity levels.

*Supports interactive what-if parameter overrides (`temp_max`, `precipitation`, `soil_moisture`) to simulate climate scenarios.*

---

## 11. Actionable Farmer Advisory Engine

Translates telemetry, crop ranking, and risk intelligence into plain-language directives via `/api/advisory/farmer`:
* **Irrigation Directives:** Water-conservation vs. Alternate Wetting and Drying (AWD) vs. emergency drought watering.
* **Crop Selection Guidance:** Highlights the top-ranked candidate crop with contextual justification.
* **Heat Protection:** Precautionary alerts for canopy cooling, midday spraying restrictions, and potassium foliar sprays.
* **Flood & Drainage Preparation:** Actionable channel clearance and furrow outlet opening directives.
* **Sowing Timing:** Optimal planting windows aligned with Bangladesh seasonal cycles (Rabi, Kharif-1, Kharif-2).
* **Bilingual Support:** Every advisory provides both English and authentic Bangla (`title_bn`, `message_bn`).

---

## 12. Interactive Farm Location Map

* **Leaflet + React-Leaflet + OpenStreetMap:** Fully interactive map centered on Bangladesh with smooth panning, zooming, and responsive controls.
* **Coordinate Telemetry Lookup:** Clicking any point on the map retrieves precise latitude/longitude coordinates, validates them, and queries real NASA POWER climate telemetry.
* **District Synchronization:** Seamless bidirectional synchronization between the district selector and map coordinates.

---

## 13. My Farm Management (CRUD)

Secured by JWT authentication, users can manage their personal farms via `/api/farms`:
* **Create Farm:** Name, district, coordinates, acreage, soil type, current crop, planting date.
* **List Farms:** Retrieves all farms belonging to the authenticated user.
* **Update / Delete Farm:** Full lifecycle editing and removal.
* **One-Click Farm Analysis:** Select any saved farm to automatically execute localized NASA climate telemetry, crop ranking, and risk assessment.

---

## 14. Frontend Authentication System

* **Functional AuthContext:** Centralized state management for user profile, JWT token lifecycle, login, registration, and logout.
* **Automatic Expiration Handling:** Listens for 401 Unauthorized API responses, clears expired credentials, and prompts the user to re-authenticate.
* **Interactive Modal:** Unified login and registration modal with real-time field validation and error messaging.

---

## 15. Unified Production Dashboard

The main dashboard (`ClimateDashboard.jsx`) coordinates the full platform features:
1. **Top Control Bar:** Location selector (pre-configured districts + custom coordinates) and saved farm selector for logged-in users.
2. **NASA Climate Telemetry Summary:** 7 vital climate metrics with regional averages, extrema, and last updated indicators.
3. **Historical Climate Trends Chart:** Visualizes 30-day temperature ranges, precipitation bars, and soil moisture trajectories.
4. **Multi-Crop Recommendation Grid:** Interactive cards displaying ranks, suitability scores, and factor breakdowns with ML toggle.
5. **Climate Risk Intelligence:** 3 hazard cards (Drought, Flood, Heat Stress) with score gauges and mitigation actions.
6. **Farmer Actionable Advisories:** Categorized guidance cards with priority badges and bilingual toggle.
7. **Interactive Farm Map:** Leaflet map with coordinate picking and live weather retrieval.

---

## 16. Automated Testing Suite

The codebase features comprehensive unit, integration, and component tests:

### Test Results
* **Frontend Tests (Vitest + RTL):** **23 passed** (14 API service tests, 9 component & interaction tests).
* **Backend Tests (pytest):** **39 passed** (health, auth, NASA parsing, crop ranking, climate risk, advisories).
* **External Mocking:** All external NASA POWER API calls are mocked using `unittest.mock` and `AsyncMock`. Automated tests run offline with zero external network dependencies.

```bash
# Run Frontend Tests
npm test

# Run Backend Tests
pytest backend/tests/ -v
```

---

## 17. Project Directory Structure

```
blackbox/
├── .env.example                 # Frontend environment template
├── .gitignore                   # Ignore rules (venv, node_modules, db, pkl)
├── index.html                   # Vite HTML entry point
├── package.json                 # Frontend dependencies & npm test scripts
├── pytest.ini                   # Root pytest configuration
├── README.md                    # Primary project documentation (this file)
├── PROCEDURE.md                 # Full architectural procedure manual
├── vite.config.js               # Vite bundler & Vitest configuration
│
├── backend/                     # FastAPI Backend Application
│   ├── .env.example             # Backend environment template
│   ├── main.py                  # API entry point & CORS configuration
│   ├── pytest.ini               # Backend-specific pytest configuration
│   ├── requirements.txt         # Python dependencies including pytest
│   ├── app/
│   │   ├── config.py            # Pydantic Settings with security validations
│   │   ├── database.py          # SQLAlchemy database engine & get_db dependency
│   │   ├── models/              # User and Farm ORM entities
│   │   ├── routers/             # API routes: auth, nasa, predictions, risk, advisory, farms
│   │   ├── schemas/             # Pydantic validation schemas
│   │   └── services/            # NASA client, crop ranking, risk models, advisory engine
│   ├── ml_models/
│   │   └── model_metadata.json  # Serialized model metadata & evaluation metrics
│   └── tests/                   # 39 pytest test cases covering all backend subsystems
│
├── ml/                          # Machine Learning Pipeline
│   └── train_model.py           # Training, evaluation & model persistence script
│
└── src/                         # React Frontend Application
    ├── main.jsx                 # React root mount
    ├── App.jsx                  # Main application layout shell
    ├── index.css                # Global CSS with Tailwind v4 design tokens
    ├── context/
    │   └── AuthContext.jsx      # Centralized authentication state & JWT management
    ├── components/              # Modular UI components
    │   ├── Navbar.jsx           # Responsive header navigation & auth controls
    │   ├── Hero.jsx             # Hero section with quick action CTAs
    │   ├── ClimateDashboard.jsx # Unified main application dashboard
    │   ├── CropRecommendation.jsx # Multi-crop ranking & factor scoring
    │   ├── ClimateRisk.jsx      # 3-hazard climate risk intelligence cards
    │   ├── FarmerAdvisory.jsx   # Bilingual actionable advisory cards
    │   ├── FarmMap.jsx          # Interactive Leaflet map with coordinate picking
    │   ├── MyFarmManager.jsx    # Authenticated farm CRUD management
    │   ├── HistoricalClimateTrends.jsx # 30-day Recharts climate visualization
    │   └── AuthModal.jsx        # Login & registration dialog
    ├── services/
    │   └── api.js               # Unified frontend API client with interceptors
    └── test/                    # 23 Vitest + React Testing Library test cases
```

---

## 18. Environment Configuration

### Backend Configuration (`backend/.env`)
Copy `backend/.env.example` to `backend/.env`:
```bash
cp backend/.env.example backend/.env
```
Key variables:
* `ENVIRONMENT`: Set to `development` or `production`.
* `SECRET_KEY`: Random 32+ character key for JWT signatures.
* `DATABASE_URL`: `sqlite:///./agrishift.db` (or PostgreSQL connection string).
* `NASA_POWER_BASE_URL`: `https://power.larc.nasa.gov/api/temporal/daily/point`.

### Frontend Configuration (`.env`)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
* `VITE_API_URL`: `http://localhost:8000` (points to the FastAPI backend).

---

## 19. Installation & Setup

### Prerequisites
* **Node.js**: `v20.19+` or `v22.12+`
* **Python**: `3.10+` (3.10, 3.11, or 3.12)
* **Git**: Installed and configured

### Step 1: Clone Repository
```bash
git clone https://github.com/naimNB/blackbox.git
cd blackbox
```

### Step 2: Install Backend Dependencies
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
```

### Step 3: Install Frontend Dependencies
```bash
npm install
```

---

## 20. Running the Application

### 1. Launch Backend API Server
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```
* Swagger UI Docs: `http://localhost:8000/docs`

### 2. Launch Frontend Dev Server
```bash
npm run dev
```
* Web Application: `http://localhost:5173`

### 3. Run Automated Tests
```bash
# Frontend Tests (Vitest)
npm test

# Backend Tests (pytest)
pytest backend/tests/ -v
```

---

## 21. API Endpoint Reference

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Service health status (`{"status": "ok"}`) | Public |
| `POST` | `/api/auth/register` | Register new user account | Public |
| `POST` | `/api/auth/login` | Authenticate and obtain JWT access token | Public |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Bearer JWT |
| `GET` | `/api/nasa/districts` | List Bangladesh monitoring districts & coordinates | Public |
| `GET` | `/api/nasa/climate` | Query daily NASA POWER observations by district | Public |
| `GET` | `/api/nasa/climate/coords` | Query daily NASA observations by lat/lon | Public |
| `POST` | `/api/predictions/rank-crops` | Rank candidate crops with factor suitability | Public |
| `GET` | `/api/risk/climate` | Evaluate Drought, Flood, and Heat Stress risks | Public |
| `GET` | `/api/advisory/farmer` | Generate bilingual actionable farmer advisories | Public |
| `GET` | `/api/farms` | List all saved farms for authenticated user | Bearer JWT |
| `POST` | `/api/farms` | Create a new farm record | Bearer JWT |
| `PUT` | `/api/farms/{id}` | Update existing farm parameters | Bearer JWT |
| `DELETE` | `/api/farms/{id}` | Remove a farm record | Bearer JWT |

---

## 22. Production Deployment Guidelines

1. **Security Settings:** In production, ensure `ENVIRONMENT=production` in `backend/.env` and generate a cryptographically strong `SECRET_KEY` (`openssl rand -hex 32`).
2. **Database:** Migrate SQLite to PostgreSQL for multi-worker concurrency.
3. **ASGI Server:** Run Uvicorn behind Nginx or Gunicorn with multiple worker processes:
   ```bash
   gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
   ```
4. **Frontend Static Hosting:** Build static assets with `npm run build` and serve via Nginx, Vercel, or AWS CloudFront with HTTP/2 and gzip/brotli compression.

---

## 23. Demonstration / Judging Flow

When presenting or demonstrating AgriShift AI:

1. **Hero & Problem Introduction:** Showcase the landing page with the satellite telemetry badge, highlighting the groundwater and climate challenges in Northern Bangladesh.
2. **Unified Dashboard Overview:** Navigate to `#dashboard`. Show how the location selector switches between Bogura, Rangpur, Dinajpur, Rajshahi, and Sylhet.
3. **NASA Climate Telemetry:** Point out real daily agroclimate metrics (temperature, rainfall, soil moisture, solar radiation) with last-updated timestamps.
4. **Multi-Crop Suitability Ranking:** Walk through the ranked candidate crops (**Rice**, **Wheat**, **Maize**, **Jute**, **Potato**, **Mustard**). Toggle factor scores to demonstrate transparent 0–100% suitability breakdowns. Toggle the ML classifier to show rule vs. ML transparency.
5. **Climate Risk Intelligence:** Review the 3 risk cards (**Drought**, **Flood**, **Heat Stress**). Demonstrate what-if simulation sliders (e.g. simulate 42°C heatwave or 90 mm heavy rainfall).
6. **Farmer Actionable Advisories:** Highlight bilingual directives in English and Bangla with actionable priorities for irrigation and heat protection.
7. **Interactive Farm Map:** Click a point anywhere on the Bangladesh map to capture exact coordinates and retrieve localized NASA climate telemetry.
8. **My Farm Management & Auth:** Log in or register an account. Save a farm (e.g., "Barind Maize Field"), run instant climate analysis, and edit farm details.
9. **Automated Testing Validation:** Demonstrate running `npm test` and `pytest backend/tests/ -v` showing 62/62 tests passing.

---

## 24. Remaining Limitations & Future Roadmap

### Current Limitations
1. **Satellite Raster Feeds vs. Point Telemetry:** Point agroclimate observations are queried live from NASA POWER. High-resolution raster imagery overlays in modal dialogues remain prototype demonstrations.
2. **Empirical Dataset Scarcity:** ML training was performed on agronomic growth boundaries calibrated against BARC/BRRI standards rather than multi-decade ground-truth yield records.
3. **Soil Nutrient Testing:** Soil parameters are derived from regional Agro-Ecological Zones rather than real-time NPK/pH laboratory test kits.

### Future Roadmap
- [ ] **Direct GEE / GIBS Tile Ingestion:** Integrate Google Earth Engine for real-time 10m Sentinel-2 NDVI raster overlays.
- [ ] **Empirical BARC Calibration:** Ingest historical multi-season Upazila harvest data for higher-order yield prediction.
- [ ] **Offline PWA & SMS Gateway:** Package the application as an offline-first Progressive Web App with cellular SMS advisory alerts for non-smartphone farmers.
- [ ] **Localized Weather Radar:** Incorporate Bangladesh Meteorological Department (BMD) Doppler radar feeds for 6-hour convective storm warnings.

---

## 25. Data Attribution & References

* **NASA POWER Project:** Daily agroclimatology telemetry provided by the NASA Langley Research Center POWER Project funded through the NASA Earth Science Directorate Applied Science Program ([https://power.larc.nasa.gov](https://power.larc.nasa.gov)).
* **Bangladesh Rice Research Institute (BRRI):** Agroclimatic growth threshold handbooks for Aman and Boro rice cultivars.
* **Bangladesh Agricultural Research Institute (BARI):** Northwestern Bangladesh Rabi crop production and irrigation guidelines.
* **Disclaimer:** *AgriShift AI is an independent software application utilizing publicly available NASA Earth observation data. This initiative is not officially endorsed by or affiliated with NASA.*

---

## 26. License

This project is licensed under the [MIT License](LICENSE).