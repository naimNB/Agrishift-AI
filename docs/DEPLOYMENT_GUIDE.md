# AgriShift AI — Cloud Deployment & Production Readiness Guide

**Target Branch:** `feat/native-android-farmer-app`  
**Application:** FastAPI Backend (`backend/`)  
**Client:** Native Android Application (`android/`)  
**Date:** November 2026  

---

## 1. Hosting Platform Evaluation for Student & Research Prototypes

| Criteria | **Google Cloud Run (Recommended)** | **Render.com (Zero-Card Alternative)** | **Self-Hosted VPS (DigitalOcean / Hetzner)** |
|---|---|---|---|
| **Monthly Cost** | **$0.00** (Free Tier covers 2M requests/month, 360,000 vCPU-sec, 180,000 GiB-sec) | **$0.00** (Free Web Service tier, 750 free instance hours) | ~$4.00–$6.00 / month |
| **Sleep & Idle Behavior** | Scale-to-zero; cold start is **~2–4 seconds** | Spins down after 15 min idle; cold start is **50–90 seconds** | Always online; **0 seconds** cold start |
| **Outbound NASA POWER Access** | Yes — unrestricted public outbound HTTPS | Yes — unrestricted public outbound HTTPS | Yes — unrestricted |
| **HTTPS & SSL Certificate** | Free automatic managed SSL on `*.run.app` & custom domains | Free automatic Let's Encrypt certificate on `*.onrender.com` | Requires manual Certbot / Let's Encrypt setup |
| **Container / Docker Support** | Native serverless Docker / Cloud Build | Native Dockerfile detection from repository | Native Docker Compose / systemd |
| **Billing / Credit Card** | Requires a Google Cloud account (credit card verification required, but $0 cost) | **No credit card required** to sign up and run free tier | Credit card or PayPal required |
| **Data Persistence (Database)** | Container filesystem is ephemeral; requires managed DB for persistent state | Ephemeral container filesystem; free PostgreSQL expires in 30 days | Persistent NVMe / SSD disk storage |

### Recommendation Rationale
- **Primary Recommendation: Google Cloud Run**  
  Cloud Run is the optimal choice for AgriShift AI because Bangladeshi farmers using the mobile app cannot tolerate a 60–90 second spin-up latency on their mobile network. Cloud Run initializes in 2–4 seconds, supports standard Dockerfiles, provides automatic HTTPS certificates, and falls entirely within Google Cloud's permanent Free Tier (2,000,000 requests/month).
- **Secondary Recommendation: Render.com**  
  For students or researchers who cannot provide a credit card for Google Cloud registration, Render's free tier allows immediate deployment directly from GitHub. The Android app's timeout is set to 20 seconds, so during Render cold starts the user may see the friendly offline guidance prompt before the server wakes up.

---

## 2. Production Environment Variables Reference

| Variable | Type | Default / Example | Description |
|---|---|---|---|
| `ENVIRONMENT` | string | `production` | Set to `production` to activate strict security rules and disable Swagger write access. |
| `SECRET_KEY` | string | *(Required, 32+ chars)* | Random secret key for signing JWT tokens. **Will throw a fatal exception on startup if default/short key is used.** |
| `DATABASE_URL` | string | `sqlite:///./agrishift.db` | PostgreSQL connection string (e.g. Supabase, Neon) or SQLite path. |
| `PORT` | integer | `8000` | Injected automatically by Cloud Run (`$PORT`) or Render. |
| `HOST` | string | `0.0.0.0` | Bind host address. |
| `CORS_ORIGINS` | string | `*` or comma-separated URLs | Allowed CORS origins for web clients (e.g. `https://agrishift.web.app`). Direct mobile clients bypass browser CORS. |
| `LOG_LEVEL` | string | `INFO` | Logging verbosity (`DEBUG`, `INFO`, `WARNING`, `ERROR`). |
| `NASA_POWER_BASE_URL` | string | `https://power.larc.nasa.gov/api/temporal/daily/point` | Public NASA POWER Agroclimatology point API. |
| `NASA_CACHE_TTL_SECONDS` | integer | `3600` | In-memory cache lifetime for identical coordinate queries (reduces NASA API load). |
| `NASA_REQUEST_TIMEOUT` | float | `20.0` | Maximum seconds to wait for NASA POWER API responses before falling back to local AEZ baselines. |

---

## 3. Step-by-Step Deployment Instructions

### Option A: Google Cloud Run (Recommended)

#### Step 1: Install and Initialize Google Cloud SDK
Ensure `gcloud` is installed and authenticated:
```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com
```

#### Step 2: Generate a Secure Secret Key
Generate a 64-character hexadecimal key:
```bash
export PROD_SECRET_KEY=$(openssl rand -hex 32)
```

#### Step 3: (Recommended) Provision a Free PostgreSQL Database
To ensure farm registrations and user accounts persist across container cold starts, provision a free PostgreSQL instance on:
- **Neon.tech** (Free serverless Postgres, 0.5 GB storage, instant wakeup)
- **Supabase.com** (Free 500 MB Postgres instance)

Copy the connection URL with `sslmode=require`:
```bash
export PROD_DB_URL="postgresql://user:password@ep-sample.aws.neon.tech/agrishift?sslmode=require"
```
*(If you choose to use SQLite for stateless prototype testing, omit this step; SQLite will run inside `/app/agrishift.db` with a warning).*

#### Step 4: Deploy Container to Cloud Run
From the root of `Agrishift-AI`:
```bash
gcloud run deploy agrishift-backend \
  --source ./backend \
  --region asia-south1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 5 \
  --set-env-vars "ENVIRONMENT=production,SECRET_KEY=${PROD_SECRET_KEY},DATABASE_URL=${PROD_DB_URL},CORS_ORIGINS=*,LOG_LEVEL=INFO,NASA_CACHE_TTL_SECONDS=3600,NASA_REQUEST_TIMEOUT=20.0"
```

#### Step 5: Verify Deployment
Once deployment finishes, Google Cloud Run displays the assigned URL:
```text
Service [agrishift-backend] revision [agrishift-backend-00001-abc] has been deployed and is serving 100 percent of traffic.
Service URL: https://agrishift-backend-xxxxxx-as.a.run.app
```

Verify endpoints with curl:
```bash
# Liveness probe
curl https://agrishift-backend-xxxxxx-as.a.run.app/health/liveness

# Readiness probe
curl https://agrishift-backend-xxxxxx-as.a.run.app/health/readiness

# Detailed system health
curl "https://agrishift-backend-xxxxxx-as.a.run.app/health?details=true"
```

---

### Option B: Render.com (Zero Credit Card Setup)

1. Push your branch to GitHub (after user approval).
2. Go to [dashboard.render.com](https://dashboard.render.com) and click **New + > Web Service**.
3. Connect your GitHub repository `Agrishift-AI`.
4. Configure service settings:
   - **Name:** `agrishift-backend`
   - **Root Directory:** `backend`
   - **Environment:** `Docker`
   - **Region:** `Singapore` (closest to Bangladesh)
   - **Instance Type:** `Free`
5. Under **Environment Variables**, add:
   - `ENVIRONMENT` = `production`
   - `SECRET_KEY` = *(paste output of `openssl rand -hex 32`)*
   - `DATABASE_URL` = `sqlite:///./agrishift.db` (or external Neon Postgres URL)
   - `CORS_ORIGINS` = `*`
   - `NASA_CACHE_TTL_SECONDS` = `3600`
   - `NASA_REQUEST_TIMEOUT` = `20.0`
6. Click **Create Web Service**.
7. Render will build the Dockerfile and deploy to `https://agrishift-backend.onrender.com`.

---

### Option C: Self-Hosted Docker Compose

To run on any Ubuntu/Debian VPS with Docker installed:
```bash
# 1. Clone repository
git clone https://github.com/YOUR_USER/Agrishift-AI.git
cd Agrishift-AI

# 2. Configure .env in backend/
cp backend/.env.example backend/.env
# Edit backend/.env with your production SECRET_KEY and settings

# 3. Start containers
docker compose up -d --build

# 4. Check status and health
docker compose ps
curl http://localhost:8000/health
```

---

## 4. Connecting the Native Android Application

Once your backend is deployed to HTTPS:
1. Open the **AgriShift AI** app on your Android device (no USB or ADB reverse required).
2. Go to **সেটিংস** (*Settings*).
3. Under **সার্ভার সংযোগ ও ডেভ টুলস** (*Server Connection & Dev Tools*), locate **কাস্টম সার্ভার URL** (*Custom Server URL*).
4. Enter your verified cloud HTTPS endpoint:
   ```text
   https://agrishift-backend-xxxxxx-as.a.run.app
   ```
5. Tap **সংরক্ষণ করুন** (*Save*), then tap **সংযোগ পরীক্ষা করুন** (*Test Connection*).
6. The app verifies connectivity to `/health` over TLS/HTTPS.
7. Return to **শস্য ঘূর্ণন পরিকল্পনাকারী** (*Crop Rotation Planner*); the app will now fetch live agronomic recommendations and NASA POWER climate data directly from your cloud server over WiFi or mobile data.

---

## 5. Security Safeguards Verified

1. **Mandatory Production Secrets**:
   The backend explicitly refuses to boot if `ENVIRONMENT=production` and `SECRET_KEY` is a known default or shorter than 32 characters (`ValueError: CRITICAL SECURITY FAILURE`).
2. **Strict Cleartext Blocking on Release Builds**:
   Android `network_security_config.xml` blocks all unencrypted cleartext HTTP in release builds. Cleartext HTTP is restricted to local addresses (`127.0.0.1`, `10.0.2.2`) in debug builds only.
3. **Non-Root Docker Execution**:
   The Dockerfile executes under `appuser` (UID 10001) rather than root, minimizing privilege escalation risks.
4. **Resilient NASA POWER Caching & Fallback**:
   Repeated farmer queries within 1 hour are served instantly from an in-memory TTL cache, reducing latency and avoiding NASA API rate limits. If NASA times out, the backend gracefully falls back to local BARC AEZ agroclimatology tables without crashing.
