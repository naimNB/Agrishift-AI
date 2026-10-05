# AgriShift AI — Development & Implementation Procedure

This document provides a comprehensive, step-by-step description of the architecture, design decisions, implementation procedure, and operational workflows for the **AgriShift AI** platform.

---

## Table of Contents

1. [Project Overview & Purpose](#1-project-overview--purpose)
2. [Technology Stack & Toolchain](#2-technology-stack--toolchain)
3. [Component Architecture & Structure](#3-component-architecture--structure)
4. [Step-by-Step Implementation Procedure](#4-step-by-step-implementation-procedure)
   - [Step 4.1: Project Setup & Tailwind v4 Initialization](#step-41-project-setup--tailwind-v4-initialization)
   - [Step 4.2: Typography & Document Head Standardization](#step-42-typography--document-head-standardization)
   - [Step 4.3: Hero Section & Button System Architecture](#step-43-hero-section--button-system-architecture)
   - [Step 4.4: Interactive Modal Dialog System](#step-44-interactive-modal-dialog-system)
   - [Step 4.5: Feature Cards & Interactive Micro-Animations](#step-45-feature-cards--interactive-micro-animations)
   - [Step 4.6: Layout Optimization & Overflow Prevention](#step-46-layout-optimization--overflow-prevention)
5. [Operational Procedures (How to Run, Build & Test)](#5-operational-procedures-how-to-run-build--test)
6. [Git Commit & Version Control Workflow](#6-git-commit--version-control-workflow)
7. [Repository Code Conventions](#7-repository-code-conventions)
8. [Future Milestones & Extension Guide](#8-future-milestones--extension-guide)

---

## 1. Project Overview & Purpose

**AgriShift AI** is a climate-smart agricultural intelligence platform designed to translate NASA Earth observation data (Landsat-8/9, Sentinel-2, SMAP, ECOSTRESS, MODIS) into actionable, localized recommendations for farmers, agronomists, and agricultural enterprises.

### Core Objectives
* **Multispectral Telemetry:** Deliver real-time vegetative health indices (NDVI), root-zone soil moisture metrics, and thermal stress alerts.
* **Predictive AI Crop Matching:** Recommend optimal, climate-resilient crop rotations based on soil texture, seasonal forecasts, and historical precipitation models.
* **Modern, Premium Visual Design:** Present complex geospatial and satellite telemetry in a sleek, glassmorphic, accessible interface built for desktop, tablet, and mobile devices.

---

## 2. Technology Stack & Toolchain

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Runtime & Framework** | React 19 (`react`, `react-dom`) | Declarative UI component architecture |
| **Bundler & Dev Server** | Vite 7 (`vite`, `@vitejs/plugin-react`) | Rapid HMR, asset compilation, and production bundling |
| **Styling Engine** | Tailwind CSS v4 (`tailwindcss`, `@tailwindcss/vite`) | Utility-first CSS via `@theme` (no `tailwind.config.js`) |
| **Iconography** | Lucide React (`lucide-react`) | Clean, accessible vector SVG icons |
| **Typography** | Inter (Google Fonts) | Clean, high-legibility geometric sans-serif font stack |

---

## 3. Component Architecture & Structure

```
d:/Agrishift-AI/
├── index.html                   # HTML5 root with font preconnections
├── package.json                 # Project dependencies & scripts
├── readme.md                    # Core project introduction
├── PROCEDURE.md                 # Full implementation procedure manual (this document)
├── vite.config.js               # Vite configuration (React + Tailwind plugins)
└── src/
    ├── main.jsx                 # Entry point mounting <App /> in StrictMode
    ├── App.jsx                  # Top-level shell rendering Navbar + Hero
    ├── index.css                # Global CSS with Tailwind v4 `@theme`
    ├── assets/
    │   └── hero-bg.png          # High-resolution satellite landscape background
        ├── Navbar.jsx           # Sticky navigation bar with mobile drawer & active blur
        ├── Hero.jsx             # Hero section with primary CTAs & orbital metrics (#home)
        ├── Features.jsx         # 6-card core capabilities grid (#features)
        ├── NasaData.jsx         # NASA satellite constellation telemetry engine (#nasa-data)
        ├── HowItWorks.jsx       # 3-step automated satellite-to-tractor workflow (#how-it-works)
        ├── Impact.jsx           # Field-validated ecological & financial results (#impact)
        ├── About.jsx            # Mission, data standards & final CTA banner (#about)
        ├── Footer.jsx           # Comprehensive footer with links & status
        ├── HeroModal.jsx        # Interactive modal manager for telemetry, advisory & ROI
        ├── FeatureCard.jsx      # Glassmorphic feature card with interactive triggers
        └── LoginCard.jsx        # Standalone auth component (reserved for dedicated login route/modal)
```

---

## 4. Step-by-Step Implementation Procedure

### Step 4.1: Project Setup & Tailwind v4 Initialization
1. Configured Vite 7 with `@vitejs/plugin-react` and `@tailwindcss/vite` in `vite.config.js`.
2. Created `src/index.css` using the Tailwind v4 single-entry architecture:
   ```css
   @import "tailwindcss";

   @theme {
     --font-sans: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI",
       Roboto, sans-serif;
   }
   ```
3. Set base dark background (`#0b1220`), high-contrast text (`#ffffff`), and smooth scrolling behavior.

### Step 4.2: Typography & Document Head Standardization
1. Added preconnect links in `index.html` to Google Fonts servers (`fonts.googleapis.com` and `fonts.gstatic.com`).
2. Loaded the `Inter` font family across weights `400`, `500`, `600`, `700`, and `800`.
3. Standardized HTML5 tags without trailing slashes on void elements for strict HTML5 compliance.

### Step 4.3: Hero Section & Button System Architecture
The Hero section was restructured to offer clear action pathways without cluttering the screen:

1. **Top Badge Button:**
   - Pill-shaped interactive button (`Powered by NASA Earth Data • Specs →`).
   - Triggers the NASA Satellite Ingestion Specs modal.
2. **Primary Action Row (3 Balanced CTAs):**
   - **Explore Demo Farm:** Primary bold green accent button (`bg-green-400 text-black`) with arrow icon.
   - **Live Map:** Glassmorphism button with a pulsating cyan live radar dot (`animate-ping`) and satellite icon.
   - **Watch Video:** Subtle border glass button with play icon.
3. **Quick-Action Toolbar (Compact Pill Row):**
   - Single-line horizontal group styled as lightweight, translucent tags (`bg-white/10`):
     - `🌱 Crop Advisory`
     - `📊 ROI Calc`
     - `📑 Case Studies`
     - `📞 Contact Sales`
     - `🌐 Specs`

### Step 4.4: Interactive Modal Dialog System
Implemented `src/components/HeroModal.jsx` to give every button real, working functionality:
* **Satellite Map Modal:** Displays simulated Landsat-9 telemetry (Mean NDVI 0.82, Soil Moisture 34.6%, Canopy Temp 23.8°C), with active layer toggles for NDVI, SMAP soil moisture, and ECOSTRESS thermal stress.
* **Crop Advisory Modal:** Interactive simulator allowing selection of soil texture (Loam, Clay, Sandy) and season (Spring, Summer, Autumn) to calculate AI crop recommendations with match confidence percentages.
* **ROI Calculator Modal:** Interactive range slider allowing the farmer to adjust acreage (50 to 2,500+ acres) and see calculated annual financial gains and water savings.
* **Case Studies Modal:** Summarizes field-validated results from real farm deployments (e.g. -34% water use in California, +19.2% net yield in Iowa).
* **Contact Sales Modal:** Interactive consultation request form with feedback confirmation.
* **NASA Specs Modal:** Detailed orbital specs for Landsat-8/9, Sentinel-2, SMAP, and MODIS.

### Step 4.5: Feature Cards & Interactive Micro-Animations
1. Modified `src/components/FeatureCard.jsx` to support optional `onClick` and `actionText` properties.
2. Added keyboard accessibility (`tabIndex={0}`, `role="button"`, and Enter/Space event handlers).
3. Added hover micro-animations (`hover:scale-105`, `group-hover:translate-x-1`).

### Step 4.6: Layout Optimization & Overflow Prevention
1. **Vertical Balance:** Tightened element spacing (`mt-5`, `mt-4`, `mt-6`) to prevent the left content column from stretching significantly beyond the right `LoginCard`.
2. **Responsive Stacking:** On mobile devices, the buttons wrap into natural, touch-friendly tap targets without horizontal overflow.
3. **Glassmorphism Backdrop:** Backdrop blur (`backdrop-blur-md`) ensures legibility over the high-contrast satellite background image.

---

## 5. Operational Procedures (How to Run, Build & Test)

### 5.1 Installing Dependencies
Ensure Node.js 20.19+ or 22.12+ is installed, then run:
```bash
npm install
```

### 5.2 Starting the Development Server
```bash
npm run dev
```
* Vite will launch on `http://localhost:5173/` by default.
* Fast Refresh (HMR) automatically updates components upon saving file changes.

### 5.3 Building for Production
```bash
npm run build
```
* Compiles JavaScript chunks into `dist/assets/index-*.js`.
* Compiles and minifies Tailwind CSS into `dist/assets/index-*.css`.
* Validates JSX syntax and import resolution.

### 5.4 Previewing the Production Build
```bash
npm run preview
```
* Spins up a local web server serving the optimized `dist/` directory to verify deployment output.

---

## 6. Git Commit & Version Control Workflow

When committing code changes to Git, follow this standard procedure to avoid blocking on empty commit messages:

### Standard Command Line Commit
```bash
# 1. Review changed and untracked files
git status

# 2. Stage modified files
git add index.html src/components/Hero.jsx src/components/HeroModal.jsx src/components/FeatureCard.jsx PROCEDURE.md

# 3. Commit with an inline message (prevents COMMIT_EDITMSG from blocking)
git commit -m "feat(hero): balance hero action buttons and add interactive modals"

# 4. Push changes to remote main branch
git push origin main
```

> [!TIP]
> If `git commit` is run without `-m`, Git opens `.git/COMMIT_EDITMSG`. Write a non-empty commit message on line 1, save the file, and close the editor tab to complete the commit.

---

## 7. Repository Code Conventions

### 7.1 Tailwind CSS Class Formatting
All JSX files in this repository format utility classes with **one class per line** inside template strings:
```jsx
<div className="
relative
z-10
flex
items-center
gap-3
mt-6
">
```
*This convention preserves readable git diffs and should be maintained in future edits.*

### 7.2 Accessibility (a11y) Standards
* All clickable `<div>` elements must include `role="button"`, `tabIndex={0}`, and keyboard listeners (`Enter`/`Space`).
* Decorative icons must include `aria-hidden="true"`.
* Form inputs must include valid associated `<label>` elements or `aria-label`.

---

## 8. Future Milestones & Extension Guide

1. **NASA API Ingestion:** Wire `HeroModal.jsx` to live NASA Earthdata API endpoints (CMR / GIBS / POWER).
2. **Mobile Navigation Drawer:** Implement a hamburger toggle button in `Navbar.jsx` for screens below `md`.
3. **Authentication Backend:** Connect `LoginCard.jsx` to an identity provider (Firebase Auth, Supabase, or Auth0).
4. ~~**Hero Image Optimization:** Convert `src/assets/hero-bg.png` (2.6 MB) to WebP or AVIF format.~~ ✅ **Done** — Converted to `hero-bg.webp` (0.23 MB); **90.6% reduction**. `Hero.jsx` updated to import `.webp`.
