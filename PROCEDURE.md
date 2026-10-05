# AgriShift AI — Technical Implementation & Operational Procedure

This document provides a comprehensive, step-by-step description of the architecture, design decisions, implementation procedures, and operational workflows for the **AgriShift AI** platform.

---

## Table of Contents

1. [System Architecture & Design Decisions](#1-system-architecture--design-decisions)
2. [Step-by-Step Implementation Procedure](#2-step-by-step-implementation-procedure)
   - [Phase 1: Foundation & Design System Setup](#phase-1-foundation--design-system-setup)
   - [Phase 2: NASA Agroclimatology Service Ingestion](#phase-2-nasa-agroclimatology-service-ingestion)
   - [Phase 3: Multi-Crop Ranking & Recommendation Engine](#phase-3-multi-crop-ranking--recommendation-engine)
   - [Phase 4: Machine Learning Pipeline & Explainability](#phase-4-machine-learning-pipeline--explainability)
   - [Phase 5: Climate Risk Intelligence Architecture](#phase-5-climate-risk-intelligence-architecture)
   - [Phase 6: Actionable Farmer Advisory Engine](#phase-6-actionable-farmer-advisory-engine)
   - [Phase 7: Interactive Bangladesh Farm Location Map](#phase-7-interactive-bangladesh-farm-location-map)
   - [Phase 8: My Farm Portfolio Management & Database Schema](#phase-8-my-farm-portfolio-management--database-schema)
   - [Phase 9: Full Frontend Authentication Context & JWT Handling](#phase-9-full-frontend-authentication-context--jwt-handling)
   - [Phase 10: Unified Production Dashboard Assembly](#phase-10-unified-production-dashboard-assembly)
   - [Phase 11: Automated Testing Suite Implementation](#phase-11-automated-testing-suite-implementation)
3. [Operational Procedures (Run, Build, and Test)](#3-operational-procedures-run-build-and-test)
4. [Security & Git Hygiene Rules](#4-security--git-hygiene-rules)
5. [Code Quality & Accessibility Standards](#5-code-quality--accessibility-standards)
6. [Presentation & Demo Walkthrough](#6-presentation--demo-walkthrough)

---

## 1. System Architecture & Design Decisions

### Full-Stack Architecture
The platform is organized into a decoupled, modern client-server topology:
* **Frontend:** Single Page Application (SPA) built with React 19, bundled via Vite 7, and styled with Tailwind CSS v4 using modern `@theme` design tokens.
* **Backend:** Asynchronous Python API built on FastAPI and Uvicorn, using Pydantic v2 schemas for strict data contract validation and SQLAlchemy for ORM persistence.
* **Geospatial & Ingestion Layer:** Asynchronous HTTPX client querying NASA POWER Daily Point API, parsing agroclimate observations, validating coordinates, and cleaning sensor flags.
* **Agronomic Decision Layer:** Transparent Bangladesh Agro-Ecological Zone (AEZ) rule engine serving as the primary baseline, complemented by a trained scikit-learn Random Forest classifier with model metadata logging.

---

## 2. Step-by-Step Implementation Procedure

### Phase 1: Foundation & Design System Setup
1. **Toolchain Initialization:** Initialized Vite 7 with `@vitejs/plugin-react` and `@tailwindcss/vite`.
2. **Design Tokens (`src/index.css`):** Formatted utility tokens, glassmorphism filters, dark-mode color scales (`#060b17` base, `#22c55e` emerald, `#06b6d4` cyan), and typography (`Inter`).
3. **Accessibility Baseline:** Added semantic landmark tags (`<main>`, `<nav>`, `<footer>`, `<section>`), keyboard listeners (`onKeyDown`), and explicit ARIA attributes on interactive elements.

### Phase 2: NASA Agroclimatology Service Ingestion
1. **API Client (`backend/app/services/nasa_service.py`):** Constructed an asynchronous client querying `https://power.larc.nasa.gov/api/temporal/daily/point` with `community=AG`.
2. **Parameter Ingestion:** Extracted 8 daily agricultural parameters: `T2M`, `T2M_MAX`, `T2M_MIN`, `PRECTOTCORR`, `RH2M`, `ALLSKY_SFC_SW_DWN`, `WS2M`, and `GWETROOT`.
3. **Data Hygiene & Missing Value Cleaning:** NASA missing value sentinels (`-999`, `-999.0`) are automatically detected and cleaned to Python `None` / JSON `null` to avoid skewing statistical calculations.
4. **Summary Aggregations:** Implemented `get_summary_stats()` computing 30-day temperature extrema, cumulative precipitation, and mean soil moisture.

### Phase 3: Multi-Crop Ranking & Recommendation Engine
1. **Candidate Crop Expansion:** Supported all 6 core Bangladesh crops: Rice (ধান), Wheat (গম), Maize (ভুট্টা), Jute (পাট), Potato (আলু), and Mustard (সরিষা).
2. **Endpoint (`POST /api/predictions/rank-crops`):** Designed an endpoint taking current climate variables and returning an ordered array of candidate crops sorted strictly by suitability score.
3. **AEZ Rule Baseline:** Constructed a transparent agronomic scoring engine based on published BRRI/BARI physiological growth boundaries.
4. **Transparency Guard:** API responses explicitly return `engine: "rule_based"` or `"ml_randomforest"` with `is_ai_model: false/true` so rules are never falsely claimed to be an AI model.

### Phase 4: Machine Learning Pipeline & Explainability
1. **Pipeline Script (`ml/train_model.py`):** Built a reproducible scikit-learn pipeline evaluating Random Forest, Gradient Boosting, and Logistic Regression.
2. **Validation & Leakage Prevention:** Applied `train_test_split(test_size=0.2, stratify=y, random_state=42)` ensuring zero data leakage between feature preprocessing and model training.
3. **Model Metadata (`backend/ml_models/model_metadata.json`):** Exported a JSON artifact containing feature lists, training timestamp, accuracy, precision, recall, F1 score, and the confusion matrix.
4. **Factor Suitability Scoring:** Exposed explainable percentages (0–100%) for Temperature, Rainfall, Humidity, Soil Moisture, and Solar Radiation alongside favorable and caution indicators.

### Phase 5: Climate Risk Intelligence Architecture
1. **Hazard Models (`backend/app/services/climate_risk_service.py`):** Evaluated three core agroclimatic hazards:
   - **Drought Risk:** Root-zone wetness depletion, cumulative precipitation deficit, consecutive dry days, and vapor pressure deficit.
   - **Flood Risk:** 24-hour peak rain intensity, 3-day cumulative rainfall, and soil saturation index.
   - **Heat Stress Risk:** Max temperature observed, Steadman/Rothfusz heat index approximation, and relative humidity.
2. **Configurable Thresholds (`backend/app/services/climate_risk_config.py`):** Decoupled all agronomic thresholds into a dedicated configuration file for seamless calibration.
3. **Simulation Overrides:** Supported what-if query parameters (`temp_max`, `precipitation`, `soil_moisture`) allowing farmers to stress-test hypothetical climate conditions.

### Phase 6: Actionable Farmer Advisory Engine
1. **Advisory Service (`backend/app/services/advisory_service.py`):** Synthesized NASA telemetry, crop ranking results, and climate risk assessments into actionable agronomic guidance.
2. **Bilingual Synthesis:** Formatted every advisory directive with both English and authentic Bangla (`title_bn`, `message_bn`).
3. **Category Directives:** Generated advice across 5 categories: Irrigation, Crop Selection, Heat Protection, Flood Preparation, and Sowing Timing.
4. **Priority Grading:** Tagged advisories with `urgent`, `actionable`, or `routine` priority indicators.

### Phase 7: Interactive Bangladesh Farm Location Map
1. **Leaflet + OpenStreetMap (`src/components/FarmMap.jsx`):** Integrated Leaflet and React-Leaflet with custom map markers and district boundaries centered on Bangladesh (`[23.6850, 90.3563]`).
2. **Click-to-Coordinates:** User map clicks capture exact geographic coordinates (`lat`, `lon`), perform coordinate boundary validation, and query NASA POWER telemetry for that exact location.
3. **Reverse Distance Resolution:** Calculates the nearest registered monitoring center and distance in kilometers using the Haversine formula.

### Phase 8: My Farm Portfolio Management & Database Schema
1. **SQLAlchemy ORM (`backend/app/models/farm.py`):** Designed the `Farm` entity with fields: `id`, `user_id`, `farm_name`, `district`, `latitude`, `longitude`, `area`, `area_unit`, `soil_type`, `current_crop`, `planting_date`, `created_at`, `updated_at`.
2. **RESTful CRUD (`backend/app/routers/farms.py`):** Implemented create, list, read, update, and delete endpoints protected with JWT dependency injection (`get_current_user`).
3. **One-Click Execution:** Enabled users to select any saved farm and instantly run localized climate analysis, crop ranking, and risk intelligence.

### Phase 9: Full Frontend Authentication Context & JWT Handling
1. **Centralized AuthContext (`src/context/AuthContext.jsx`):** Provided reactive state for `user`, `token`, `isAuthenticated`, `login`, `register`, and `logout`.
2. **Token Security:** Stored tokens in `localStorage` with security tradeoffs documented (convenience vs. XSS, token expiration mitigation).
3. **401 Interceptor:** API client emits an `agrishift:unauthorized` custom event upon receiving 401 errors, triggering automatic logout and prompt for re-authentication.

### Phase 10: Unified Production Dashboard Assembly
1. **Dashboard Architecture (`src/components/ClimateDashboard.jsx`):** Assembled all modular features into a responsive desktop-grid and mobile-stacked view.
2. **Component Reuse:** Reused previously built components (`CropRecommendation`, `ClimateRisk`, `FarmerAdvisory`, `FarmMap`, `HistoricalClimateTrends`, `MyFarmManager`) without code duplication.
3. **Information Hierarchy:** Structured content logically: Location/Farm Selector → Climate Summary → Historical Trends → Crop Ranking → Climate Risk → Advisories → Interactive Map.

### Phase 11: Automated Testing Suite Implementation
1. **Frontend Testing (Vitest + RTL):**
   - Configured `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, and `jsdom`.
   - Built 14 API service tests (`src/test/api.test.js`) and 9 component tests (`src/test/components.test.jsx`).
   - Validated loading skeletons, error states, risk cards, candidate crops, factor scores, and district selection.
2. **Backend Testing (pytest):**
   - Configured `pytest` and `pytest-asyncio` with in-memory SQLite transactions (`conftest.py`).
   - Mocked all external NASA POWER requests using `unittest.mock.AsyncMock`.
   - Built 39 pytest tests across health, auth, NASA parsing, crop ranking, climate risk, and advisory engines.
   - Result: **62/62 tests passing** across the entire application.

---

## 3. Operational Procedures (Run, Build, and Test)

### 3.1 Development Environment
```bash
# Terminal 1: Launch Backend API
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000

# Terminal 2: Launch Frontend Development Server
npm run dev
```

### 3.2 Production Build Verification
```bash
# Compile and validate production bundle
npm run build

# Preview production build locally
npm run preview
```

### 3.3 Running Automated Tests
```bash
# Run all Frontend tests
npm test

# Run Frontend tests in watch mode
npm run test:watch

# Run all Backend tests with verbose output
pytest backend/tests/ -v

# Run a specific backend test module
pytest backend/tests/test_nasa_service.py -v
```

---

## 4. Security & Git Hygiene Rules

1. **Never Commit Secrets:** `.env` and `backend/.env` are strictly excluded in `.gitignore`. Use `.env.example` templates.
2. **Never Commit Virtual Environments:** `venv/` and `backend/venv/` are strictly ignored.
3. **Never Commit Databases:** `*.db` and `*.sqlite` are strictly ignored.
4. **Never Commit Model Binaries:** `backend/ml_models/*.pkl` and `*.joblib` are ignored; only `model_metadata.json` is tracked.
5. **Always Verify Git Status Before Committing:** Run `git status` to ensure only intended code and configuration files are staged.

---

## 5. Code Quality & Accessibility Standards

* **React 19 & Tailwind CSS v4:** Keep styles unified in `src/index.css` via `@theme`. Avoid inline overrides where tokens exist.
* **Semantic HTML:** Use proper headings (`<h1>` through `<h3>`), `<button>` tags with types, and form input labels.
* **Visual Accessibility:** Maintain high contrast ratios on dark backgrounds. All status badges use semantic colors (Green = Favorable, Amber = Moderate, Rose = High Risk/Alert).
* **Defensive Coding:** API callers must handle network failures gracefully, displaying retry banners rather than blank screens.

---

## 6. Presentation & Demo Walkthrough

When presenting AgriShift AI to judges or evaluators:
1. **Show Hero & Regional Focus:** Point out the North Bengal agro-ecological context and groundwater challenge.
2. **Demonstrate District Switching:** Switch between Bogura, Rangpur, Dinajpur, Rajshahi, and Sylhet.
3. **Inspect Multi-Crop Rankings:** Expand crop cards to show transparent factor scoring for temperature, rainfall, humidity, soil moisture, and solar radiation.
4. **Demonstrate Climate Risk & What-If Sliders:** Adjust temperature or rainfall overrides to show live risk recalculation.
5. **Review Bilingual Advisories:** Toggle between English and Bangla guidance.
6. **Pick Coordinates on Farm Map:** Click a point in Bangladesh and fetch real NASA climate telemetry.
7. **Demonstrate My Farm Management:** Log in, save a field, and run instant crop analysis.
8. **Show Automated Testing Suite:** Run `npm test` and `pytest backend/tests/ -v` to prove code reliability and regression safety.
