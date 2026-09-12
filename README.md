# BugBounty — Enterprise Vulnerability Reporting & Bug Bounty Management Platform

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Local%20Embedded-brightgreen.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-74%20Passing-success.svg)](server/tests/)

BugBounty is a full-stack MERN vulnerability disclosure and bug bounty management platform. It provides a secure, auditable, and automated bridge between independent security researchers and organizations defending mission-critical digital infrastructure.

---

## ⚡ Quick Start: How to Run the Project

You can run the entire platform locally on your laptop with **a single command**. No external MongoDB installation, cloud setup, or internet connection is required.

### 1. Start the Application
Open your terminal in the project root directory and run:

```bash
npm run dev
```

This single command automatically starts:
- **Backend Express API & WebSocket Server** on `http://localhost:5000`
- **Embedded Local MongoDB Engine** with data stored on disk at `server/data/db/`
- **Frontend React Vite Application** on `http://localhost:5173`

### 2. Open in Your Browser
Navigate to:
👉 **[http://localhost:5173](http://localhost:5173)**

---

## 🔑 Pre-Configured Demo Accounts

The database comes pre-seeded with realistic demonstration data, ready for immediate presentation:

| Role | Email | Password | What You Can Do |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@bugbounty.io` | `AdminPassword123!` | Create bounty programs, review & triage incoming reports, adjust severity, assign bounty rewards, view analytics |
| **Security Researcher** | `researcher@bugbounty.io` | `ResearcherPassword123!` | Browse bounty scopes, submit vulnerability findings, upload proof-of-concept evidence, track status, view reputation |

*(You can also register brand new accounts anytime directly from the UI!)*

---

## 📖 Complete Step-by-Step User Guide

### Persona A: Security Researcher Workflow

1. **Sign In**:
   - Go to `http://localhost:5173/login` and sign in as `researcher@bugbounty.io` / `ResearcherPassword123!`.
2. **Browse Bounty Programs**:
   - Click **Programs** in the navbar to explore active bounty programs.
   - Click into **Apex Cloud Systems** to view authorized **In-Scope Targets**, **Out-of-Scope Restrictions**, and the **Safe Harbor Guarantee**.
3. **Submit a Vulnerability Finding**:
   - Click **Submit Finding** (or click the plus icon in the navbar).
   - Select a vulnerability category (e.g. *Broken Access Control*, *SQL Injection*, *IDOR*, *SSRF*).
   - Fill in the **Vulnerability Title**, **Affected Asset URL**, **Reproduction Steps**, and **Impact**.
   - Attach proof-of-concept evidence files (screenshots, logs, or PDFs).
   - Adjust the risk factor sliders (Impact rating, Exploitability, Attack Vector, Data Exposure, Authentication Requirements).
   - Click **Submit Vulnerability Report**.
4. **Inspect Automated Intelligence**:
   - Immediately view the report details page:
     - **Deterministic CVSS Risk Score Inspector**: View the explainable calculation formula, risk band (*Critical*, *High*, etc.), and recommended severity.
     - **Duplicate Detection Inspector**: View similarity overlap percentages against existing reports.
5. **Receive Real-Time Notifications**:
   - As administrators review, triage, or reward your report, the **Notification Bell** in the navbar receives live real-time push alerts via Socket.IO without page reloads.
6. **Track Reputation & Leaderboard**:
   - As your reports are accepted, reputation points are automatically credited (+100 for Critical, +50 for High).
   - Click **Leaderboard** in the navbar to see top-ranked researchers ranked by validated points.

---

### Persona B: Administrator & Triage Team Workflow

1. **Sign In**:
   - Go to `http://localhost:5173/login` and sign in as `admin@bugbounty.io` / `AdminPassword123!`.
2. **Manage Bounty Programs**:
   - Click **Programs** $\rightarrow$ **Create New Program**.
   - Define organization name, reward ranges ($250 to $10,000), in-scope targets, out-of-scope exemptions, and rules of engagement.
3. **Triage Incoming Vulnerability Reports**:
   - Go to the **Admin Dashboard** or click **Reports**.
   - View reports filtered by status, severity, or program.
   - Click into a newly submitted report to inspect researcher reproduction steps and uploaded evidence.
4. **Execute Formal State Machine Transitions**:
   - In the report details sidebar, transition status:
     - `Submitted` $\rightarrow$ `Under Review` (assign triage analyst note)
     - `Under Review` $\rightarrow$ `Triaged` (confirm reproduction)
     - `Triaged` $\rightarrow$ `Accepted` (researcher automatically receives reputation points!)
5. **Adjust Severity & Recalibrate CVSS**:
   - Click **Adjust Severity** to change severity (e.g. Medium to Critical). The CVSS risk score automatically recalibrates.
6. **Assign Monetary Bounty Rewards**:
   - Click **Assign Reward**: enter the dollar amount (e.g. `$3,500`) and notes.
   - The status automatically advances to `Reward Assigned`.
   - The researcher receives an instant WebSocket push notification of their bounty award.
7. **Resolve Finding**:
   - Once engineering deploys the patch, transition status to `Resolved`.
8. **View Real-Time Analytics & KPIs**:
   - Open **Admin Dashboard** to view interactive Recharts visualizations:
     - **Submission Velocity** (Area Chart over time)
     - **Severity Distribution** (Donut / Pie Chart)
     - **Mean Time to Resolution (MTTR)** in hours
     - **Total Bounty Payout Volume**

---

## 💾 Zero-Config Offline Local Database

This project includes a **100% self-contained embedded MongoDB engine** that runs directly on your laptop disk:

- **Storage Location**: [`server/data/db/`](file:///Volumes/maha/fsd/untitled%20folder/server/data/db/)
- **Zero Cloud Dependence**: Operates completely offline without internet or external cloud accounts.
- **Persistent Data**: All users, programs, reports, comments, and rewards are saved directly into local WiredTiger database files, persisting across reboots.
- **Genuine MERN Stack**: Uses standard Mongoose schemas, indexes, and aggregation pipelines (the "M" in MERN).

---

## 🧪 Running the Automated Test Suite

The project includes **74 comprehensive automated tests** verifying all business workflows and security defenses.

```bash
# Run all automated tests:
cd server && npm test
```

### What the test suite covers:
- **Authentication & Authorization**: Password encryption, safe defaults, JWT handling, role checks.
- **Programs & Reports**: Scope definitions, report submission, evidence upload, IDOR defenses.
- **Triage State Machine**: State transitions, severity overrides, reward authorization, reputation updates.
- **Intelligence Engines**: Deterministic CVSS scoring formula, multi-vector duplicate similarity detection, analytics pipelines.
- **Security Audit**: Unauthorized access (401), cross-user report access IDOR (403), privilege escalation (403), expired/tampered JWT (401), malformed inputs (400), malicious file upload attempts (400), and NoSQL injection defenses.
- **End-to-End Workflows**: Full lifecycle of accepted finding and full lifecycle of rejected finding.

---

## 🛠️ Technology Stack Details

- **Frontend**: React 18, Vite 6, React Router 6, Tailwind CSS, Recharts, Socket.IO Client, Lucide Icons, Axios.
- **Backend**: Node.js 20, Express.js (ES Modules), Socket.IO Server.
- **Database**: MongoDB & Mongoose 8 (Embedded local persistent engine with `server/data/db` storage).
- **Security**: Helmet, Express-Rate-Limit, Express-Mongo-Sanitize, Multer, Bcrypt.js (12 salt rounds), JSONWebToken.
- **DevOps**: Docker, Docker Compose, Nginx (optional).

---

## 📂 Project Directory Structure

```text
├── docker-compose.yml           # Multi-container orchestration (Mongo, API, Nginx)
├── README.md                    # This comprehensive guide
├── API_DOCUMENTATION.md         # Full REST API endpoint reference
├── .env.example                 # Environment variables template
├── package.json                 # Monorepo task orchestration (npm run dev)
│
├── server/                      # Express.js REST API & WebSocket Server
│   ├── config/                  # Database configuration & local embedded engine
│   ├── controllers/             # Route controllers (auth, report, program, etc.)
│   ├── data/db/                 # Local persistent MongoDB database files
│   ├── middleware/              # Auth, error, rate-limit, and upload middleware
│   ├── models/                  # Mongoose data schemas (User, Report, Program, etc.)
│   ├── routes/                  # Express route declarations
│   ├── services/                # Business logic, risk engine, duplicate detection, seeder
│   ├── utils/                   # JWT helpers, response envelopes
│   ├── validators/              # Input validation and sanitization
│   ├── tests/                   # 74 automated unit, E2E, and security tests
│   ├── uploads/evidence/        # Secure local storage for file evidence
│   ├── Dockerfile               # Node 20 Alpine production container
│   ├── app.js                   # Application middleware wiring
│   └── server.js                # Server entry point & Socket.IO listener
│
└── client/                      # React Single Page Application
    ├── src/
    │   ├── components/          # Reusable UI elements, alerts, charts, modals
    │   ├── context/             # AuthContext with persistent session
    │   ├── hooks/               # useAuth, useSocket custom React hooks
    │   ├── layouts/             # MainLayout and DashboardLayout
    │   ├── pages/               # Dashboards, reports, programs, login, register
    │   ├── services/            # Axios API clients (auth, reports, analytics)
    │   └── App.jsx              # Root router & notification subscriber
    ├── vercel.json              # Vercel SPA routing rewrites
    ├── nginx.conf               # Production Nginx reverse proxy configuration
    └── Dockerfile               # Multi-stage production container
```

---

## 🔒 Responsible Disclosure & Safe Harbor Notice

The platform is designed exclusively for authorized vulnerability reporting.
- Testing is strictly permitted **ONLY** on targets explicitly designated within an organization's active bounty scope.
- Automated denial-of-service (DoS/DDoS), rate-limit abuse, social engineering, and unauthorized data exfiltration are strictly prohibited.
- Good-faith security research conducted in compliance with program rules is protected under platform safe harbor guidelines.
