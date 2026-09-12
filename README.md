# BugBounty — Vulnerability Reporting & Bug Bounty Platform

> **Phase 1: Complete Foundation & Secure Authentication/Authorization System**

BugBounty is an enterprise-grade full-stack MERN vulnerability disclosure and bug bounty management platform. It enables security researchers to responsibly report vulnerabilities to organizations and allows organizations to triage findings, assign CVSS severity, authorize bounty rewards, and track researcher reputation.

---

## Tech Stack

- **Frontend**: React 18, Vite, React Router v6, Tailwind CSS, Lucide Icons, Axios
- **Backend**: Node.js, Express.js (ES Modules)
- **Database**: MongoDB & Mongoose (with automated in-memory MongoDB fallback for local development & automated test suites)
- **Authentication**: Stateless JSON Web Tokens (JWT), Bcrypt password hashing (12 salt rounds)
- **Security & Hardening**: Helmet (HTTP headers), Express-Rate-Limit (brute-force protection), Express-Mongo-Sanitize (NoSQL injection defense), Payload size controls

---

## Project Structure

```text
├── package.json              # Root script runner (dev, test, build, install:all)
├── README.md                 # Complete system documentation
├── .gitignore
├── server/                   # Backend Express & MongoDB API
│   ├── config/
│   │   └── db.js             # Mongoose connection & in-memory dev fallback
│   ├── controllers/
│   │   └── authController.js # Register, login, profile, logout, admin-check
│   ├── middleware/
│   │   ├── authMiddleware.js # requireAuth, requireRole('admin', 'researcher')
│   │   ├── errorMiddleware.js# 404 handler & centralized error handler
│   │   └── rateLimiter.js    # API & authentication rate limiters
│   ├── models/
│   │   └── User.js           # User schema with bcrypt, roles & reputation
│   ├── routes/
│   │   ├── authRoutes.js     # /api/auth/* routes
│   │   └── index.js          # API aggregator & /api/health
│   ├── services/
│   │   └── authService.js    # Authentication business logic
│   ├── utils/
│   │   ├── jwt.js            # JWT generator and verifier
│   │   └── response.js       # Standardized response envelopes
│   ├── validators/
│   │   └── authValidator.js  # Input validation & sanitization
│   ├── tests/
│   │   └── auth.test.js      # Automated backend test suite
│   ├── app.js                # Express app setup & security wiring
│   ├── server.js             # HTTP listener & process lifecycle
│   ├── package.json
│   └── .env.example
└── client/                   # Frontend React & Vite Single-Page Application
    ├── src/
    │   ├── components/
    │   │   ├── common/       # Button, Input, Badge, Alert, Spinner
    │   │   └── Navbar.jsx    # Sticky navigation bar with role status
    │   ├── context/
    │   │   └── AuthContext.jsx # Global auth state & methods
    │   ├── hooks/
    │   │   └── useAuth.js    # Custom authentication hook
    │   ├── layouts/
    │   │   ├── MainLayout.jsx# Public layout with header & footer
    │   │   └── DashboardLayout.jsx # Authenticated sidebar shell
    │   ├── pages/
    │   │   ├── LandingPage.jsx         # Hero & security feature showcase
    │   │   ├── LoginPage.jsx           # Login with test credential fill
    │   │   ├── RegisterPage.jsx        # Registration with live strength check
    │   │   ├── ProfilePage.jsx         # User identity & permissions matrix
    │   │   ├── ResearcherDashboard.jsx # Submissions & reputation deck
    │   │   ├── AdminDashboard.jsx      # Admin operations & live RBAC tester
    │   │   └── NotFoundPage.jsx        # 404 security checkpoint
    │   ├── routes/
    │   │   ├── AppRoutes.jsx           # Route declarations
    │   │   └── ProtectedRoute.jsx      # Client-side auth & role guard
    │   ├── services/
    │   │   ├── api.js                  # Axios client with interceptors
    │   │   └── authService.js          # Auth API calls
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css                   # Custom cybersecurity design system
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── package.json
    └── .env.example
```

---

## Environment Variables

### Server (`server/.env`)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/bugbounty
JWT_SECRET=super_secure_jwt_secret_key_change_in_production_min_32_chars!
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```
*Note: If `MONGODB_URI` cannot reach a local or remote MongoDB instance in development, the server automatically starts an in-memory MongoDB instance (`mongodb-memory-server`) to allow seamless local testing.*

### Client (`client/.env`)
```env
VITE_API_URL=/api
```
*(In development, Vite proxies `/api` requests directly to `http://localhost:5000`.)*

---

## Installation & Setup

1. **Install all dependencies** (from project root):
   ```bash
   npm run install:all
   ```

2. **Run backend automated tests**:
   ```bash
   npm test
   ```

3. **Start development servers**:
   ```bash
   # From root:
   npm run dev

   # Or in separate terminal tabs:
   cd server && npm run dev
   cd client && npm run dev
   ```

4. **Access the application**:
   - **Frontend**: [http://localhost:5173](http://localhost:5173)
   - **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)
   - **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## Authentication & RBAC Architecture

### Implemented Endpoints

| Method | Endpoint | Protection | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public (Rate Limited) | Register researcher or admin with validation & password hashing |
| `POST` | `/api/auth/login` | Public (Rate Limited) | Authenticate user, verify bcrypt hash, issue JWT |
| `GET` | `/api/auth/profile` | `requireAuth` | Retrieve authenticated user's safe profile |
| `POST` | `/api/auth/logout` | `requireAuth` | Acknowledge user logout |
| `GET` | `/api/auth/admin-check` | `requireAuth` + `requireRole('admin')` | Real-time endpoint proving backend RBAC enforcement |

### Security Measures
1. **Password Safety**: Passwords hashed with `bcryptjs` using 12 salt rounds; passwords marked `{ select: false }` on the Mongoose model so they are never leaked in queries.
2. **Safe Serialization**: `User.toSafeObject()` returns only sanitized profile fields.
3. **Backend-Enforced Authorization**: `requireAuth` and `requireRole` middlewares verify JWTs and check user roles on the server, guaranteeing that frontend route tampering cannot access restricted endpoints.
4. **Rate Limiting**: Authentication endpoints are capped at 30 requests per 15 minutes to mitigate brute-force password guessing.
5. **NoSQL Injection Prevention**: `express-mongo-sanitize` strips `$` and `.` operators from request bodies, queries, and params.
6. **Centralized Error Handling**: Production environments never expose stack traces or internal database error codes.

---

## Phase 2 Roadmap
- [ ] Vulnerability Submission workflow (Title, Scope/Asset, Vulnerability Type, Steps to Reproduce, Proof of Concept)
- [ ] Severity Matrix & CVSS 3.1 calculation engine
- [ ] Organization Triage Dashboard with status transitions (Triaged, Accepted, Rejected, Resolved)
- [ ] Bounty allocation & researcher reputation calculation
- [ ] Responsible disclosure timeline management
