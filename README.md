# BugBounty — Enterprise Vulnerability Reporting & Bug Bounty Management Platform

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-brightgreen.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-74%20Passing-success.svg)](server/tests/)

BugBounty is a full-stack MERN vulnerability disclosure and bug bounty management platform. It provides a secure, auditable, and automated bridge between independent security researchers and organizations defending mission-critical digital infrastructure.

---

## 1. Problem Statement

Organizations struggle to handle unsolicited vulnerability disclosures safely, quickly, and compliantly. Ad-hoc emails and tickets lead to lost reports, slow remediation cycles, lack of verification, and exposed customer data. Simultaneously, security researchers lack clear safe-harbor scopes, transparent triage workflows, and reliable compensation mechanisms.

BugBounty resolves these challenges by delivering:
- Strict **Responsible Disclosure Boundaries** and scope enforcement.
- Automated **Deterministic CVSS Risk Scoring** and **Multi-Vector Duplicate Detection**.
- Enforced **State-Machine Triage Pipelines** with tamper-evident audit trails.
- Real-time **WebSocket Notifications** and **Interactive Analytics Dashboards**.

---

## 2. Platform Features

| Capability | Description |
| :--- | :--- |
| **RBAC Authentication** | Strict separation between `researcher` and `admin` roles, secured by stateless JWT and 12-round bcrypt password hashing. |
| **Program Management** | Define active bounty programs with detailed in-scope targets, out-of-scope exemptions, and reward ranges. |
| **Vulnerability Submission** | Structured reports with category classification, reproduction steps, impact assessment, and multi-file proof-of-concept uploads. |
| **Deterministic Risk Engine** | Multi-factor CVSS-inspired scoring algorithm calculating base score, risk band, and recommended severity. |
| **Duplicate Detection** | Multi-vector text similarity (Jaccard token overlap + asset matching) to flag redundant submissions for admin review. |
| **Triage State Machine** | Formal lifecycle transitions: `submitted` $\rightarrow$ `under_review` $\rightarrow$ `triaged` $\rightarrow$ `accepted`/`rejected` $\rightarrow$ `reward_assigned` $\rightarrow$ `resolved`. |
| **Bounties & Reputation** | Automated reputation ledger credits researchers upon acceptance; administrators award monetary bounties with automated audit logging. |
| **Real-Time Collaboration** | Socket.IO WebSocket events notify researchers and administrators instantly on triage milestones, rewards, and comments. |
| **Analytics & Metrics** | MongoDB aggregation pipelines calculate submission velocity, severity distribution, Mean Time to Resolution (MTTR), and acceptance curves. |
| **Hardened Security** | OWASP Top 10 defenses including Helmet headers, strict NoSQL injection sanitization, rate limiting, and IDOR isolation. |

---

## 3. Technology Stack

- **Frontend**: React 18, Vite 6, React Router 6, Tailwind CSS, Recharts, Socket.IO Client, Lucide Icons, Axios.
- **Backend**: Node.js 20, Express.js (ES Modules), Socket.IO Server.
- **Database**: MongoDB & Mongoose 8 (with automatic in-memory fallback for zero-config local testing).
- **Security**: Helmet, Express-Rate-Limit, Express-Mongo-Sanitize, Multer, Bcrypt.js, JSONWebToken.
- **DevOps**: Docker, Docker Compose, Nginx.

---

## 4. Architecture & Design

```
+-------------------------------------------------------------+
|                      React SPA (Vite)                       |
|  Tailwind CSS • Recharts • Lucide Icons • Socket.IO Client  |
+------------------------------+------------------------------+
                               |
                        HTTPS / WSS
                               |
+------------------------------v------------------------------+
|                     Express.js REST API                     |
|  Helmet • RateLimit • MongoSanitize • JWT RBAC Auth Guards   |
+--------+---------------------+---------------------+--------+
         |                     |                     |
+--------v--------+   +--------v--------+   +--------v--------+
|  Risk Engine    |   | Duplicate Check |   | Real-Time Events|
|  Deterministic  |   | Jaccard / Text  |   | Socket.IO Hub   |
+--------+--------+   +--------+--------+   +--------+--------+
         |                     |                     |
+--------v---------------------v---------------------v--------+
|                       MongoDB Atlas / Local                 |
|  Users • Programs • Reports • Rewards • Notifications • Logs|
+-------------------------------------------------------------+
```

---

## 5. Directory Structure

```text
├── docker-compose.yml           # Multi-container orchestration (Mongo, API, Nginx)
├── README.md                    # System documentation
├── API_DOCUMENTATION.md         # Comprehensive REST API reference
├── .env.example                 # Root environment template
├── package.json                 # Monorepo task orchestration
│
├── server/                      # Express.js REST API
│   ├── config/                  # Database configuration & in-memory fallback
│   ├── controllers/             # HTTP route controllers
│   ├── middleware/              # Auth, error, rate-limit, and upload middleware
│   ├── models/                  # Mongoose data schemas and indexes
│   ├── routes/                  # Express route declarations
│   ├── services/                # Business logic, risk engine, duplicate detection
│   ├── utils/                   # JWT helpers, response envelopes
│   ├── validators/              # Input validation and sanitization
│   ├── tests/                   # 74 automated unit, E2E, and security tests
│   ├── uploads/evidence/        # Secure local fallback for file evidence
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
    ├── nginx.conf               # Production Nginx reverse proxy configuration
    └── Dockerfile               # Multi-stage production container
```

---

## 6. Database Models & Schema Relationships

1. **User (`users`)**: Credentials, bcrypt hash, role (`researcher` or `admin`), validated reputation points, timestamps.
2. **BountyProgram (`bountyprograms`)**: Organization name, title, description, scope (in-scope / out-of-scope targets), rules, reward ranges, status (`active`, `paused`, `closed`).
3. **VulnerabilityReport (`vulnerabilityreports`)**: Program ref, researcher ref, vulnerability category, affected asset, steps to reproduce, impact, severity (`low`, `medium`, `high`, `critical`), risk assessment subdocument, duplicate check subdocument, evidence attachments, status machine, status history, and timeline events.
4. **Reward (`rewards`)**: Report ref, researcher ref, program ref, amount, currency, assignment notes, audit timestamps.
5. **Notification (`notifications`)**: User ref, type, message, read flag, and event metadata. Indexed on `{ userId: 1, isRead: 1, createdAt: -1 }`.
6. **ReputationLog (`reputationlogs`)**: Immutable audit ledger recording every point adjustment, reason, and previous/new balances.
7. **Comment (`comments`)**: Report discussion messages with `isInternal` flag separating public researcher communications from confidential security notes.

---

## 7. Security Architecture & Controls

- **IDOR Protection**: All access to vulnerability reports, private comments, and notifications is validated against the authenticated user ID. Researchers can never access other researchers' reports.
- **Privilege Escalation Defense**: Public registration defaults to `researcher`. Creating an `admin` account requires an explicit `ADMIN_REGISTRATION_SECRET` in production.
- **Sensitive Data Exposure**: Password hashes are marked `{ select: false }` on the Mongoose model; public endpoints (such as Leaderboards) project only safe public attributes (`name`, `reputation`, `profileImage`).
- **NoSQL Injection**: `express-mongo-sanitize` strips `$` and `.` characters from incoming request bodies and query parameters.
- **Rate Limiting**: `apiLimiter` enforces 300 requests / 15 minutes globally; `authLimiter` enforces 30 attempts / 15 minutes on login and registration to mitigate brute-force attacks.
- **File Upload Hardening**: Multer validates file extensions and MIME types against an explicit whitelist (PNG, JPEG, WebP, GIF, PDF, TXT, JSON). Executable scripts (`.php`, `.sh`, `.exe`, `.js`) and files exceeding 5MB are rejected.

---

## 8. Deterministic Risk-Scoring Engine

The risk engine (`server/services/riskScoringService.js`) calculates a reproducible CVSS-inspired score based on 5 parameters:

$$\text{Base Score} = \min\left(10, \left(\text{Impact} \times \text{Exploitability} \times \text{AttackVector} \times \text{AuthRequirements}\right) + \text{DataExposure}\right)$$

- **Outputs**:
  - `score`: 0.0 to 10.0
  - `riskBand`: `None` (0.0), `Low` (0.1 - 3.9), `Medium` (4.0 - 6.9), `High` (7.0 - 8.9), `Critical` (9.0 - 10.0)
  - `severityRecommendation`: `low`, `medium`, `high`, `critical`
  - `breakdown`: Explainable weights and mathematical formula for human triage review.

---

## 9. Duplicate Report Detection

When a researcher submits a finding, `server/services/duplicateDetectionService.js` compares it against existing reports in the same program using:
- **Title Similarity (25%)**: Tokenized Jaccard similarity index.
- **Asset Normalization (25%)**: URL path and domain matching.
- **Category Match (15%)**: Exact vulnerability classification match.
- **Description & Reproduction (35%)**: Term frequency token overlap.

> [!NOTE]
> Duplicate detection never automatically hides or rejects submissions; it equips administrators with similarity badges and comparison tools for human triage.

---

## 10. Environment Configuration

### Server Configuration (`server/.env`)
```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/bugbounty
JWT_SECRET=super_secure_jwt_secret_minimum_32_characters!
JWT_EXPIRES_IN=7d
ADMIN_REGISTRATION_SECRET=secure_admin_registration_passphrase
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

## 11. Quick Start & Local Development

### Prerequisites
- Node.js 18+ or 20+
- npm 9+
- (Optional) Docker & Docker Compose

### Step 1: Install Dependencies
```bash
# Install all dependencies across root, server, and client
npm run install:all
```

### Step 2: Start Development Servers
```bash
# Start backend API (Port 5000) and frontend Vite server (Port 5173) simultaneously
npm run dev
```

The server will automatically start with an in-memory MongoDB database if no external database URI is configured.

- Client: `http://localhost:5173`
- Backend API: `http://localhost:5000`
- API Health Check: `http://localhost:5000/api/health`

---

## 12. Automated Testing Suite

The repository includes 74 automated tests covering unit logic, security vulnerabilities, and full business workflows.

```bash
# Run all automated tests in server
npm test
```

### Test Coverage Highlights:
- **Authentication & RBAC**: Safe defaults, token validation, password encryption, role authorization.
- **Programs & Reports**: Scope definitions, report creation, evidence upload, IDOR defense.
- **Triage Workflow**: Valid and invalid state transitions, severity overrides, reward authorization, reputation calculation.
- **Intelligence**: Deterministic risk formula verification, duplicate detection sensitivity, analytics aggregation pipelines.
- **Security Audit**: Unauthorized access (401), cross-user data access (IDOR 403), cross-role escalation (403), expired/tampered JWT (401), malformed inputs (400), malicious file upload abuse (400), NoSQL injection defense.
- **End-to-End Workflows**: Full lifecycle of accepted finding and full lifecycle of rejected finding.

---

## 13. Docker Deployment

Deploy the complete stack with Docker Compose:

```bash
# Build and start MongoDB, Express API, and Nginx SPA containers
docker compose up --build -d

# Check running container health
docker compose ps

# View backend logs
docker compose logs -f server
```

The application will be accessible at:
- Web Application: `http://localhost:80`
- Backend API: `http://localhost:5000/api`

---

## 14. Responsible Disclosure & Safe Harbor

The platform is designed exclusively for authorized vulnerability reporting.
- Testing is strictly permitted **ONLY** on targets explicitly designated within an organization's active bounty scope.
- Automated denial-of-service (DoS), rate-limit abuse, social engineering, and unauthorized data exfiltration are strictly prohibited.
- Good-faith security research conducted in compliance with program rules is protected under platform safe harbor guidelines.
