# BugBounty Platform — Complete API Reference

This document provides exhaustive documentation for all REST API endpoints implemented in the BugBounty MERN platform.

---

## Global Headers & Authentication

All protected endpoints require the HTTP `Authorization` header containing a JSON Web Token (JWT):
```http
Authorization: Bearer <jwt_token>
```

### Standard Response Envelopes

#### Success Envelope (`200 OK`, `201 Created`)
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

#### Error Envelope (`400`, `401`, `403`, `404`, `409`, `500`)
```json
{
  "success": false,
  "message": "Human-readable error description",
  "errors": {
    "fieldName": "Specific validation failure"
  }
}
```

---

## 1. System Health Endpoint

### `GET /api/health`
Checks server responsiveness and operational status.
- **Authentication**: None (Public)
- **Authorization**: Anyone
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "BugBounty API is healthy",
  "data": {
    "status": "online",
    "uptime": 142.34,
    "timestamp": "2026-09-12T22:15:00.000Z",
    "environment": "production"
  }
}
```

---

## 2. Authentication & Identity (`/api/auth`)

### `POST /api/auth/register`
Registers a new user account. Defaults safely to `researcher` role. In production, registering as `admin` requires providing the configured `adminSecret`.
- **Authentication**: None (Public, Rate Limited: 30 requests / 15 min)
- **Request Body**:
```json
{
  "name": "Ada Lovelace",
  "email": "ada@security.net",
  "password": "SecurePassword123!",
  "role": "researcher",
  "adminSecret": "optional_admin_registration_passphrase"
}
```
- **Response**: `201 Created`
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "65b...",
      "name": "Ada Lovelace",
      "email": "ada@security.net",
      "role": "researcher",
      "reputation": 0,
      "createdAt": "2026-09-12T22:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUz..."
  }
}
```
- **Errors**:
  - `400 Bad Request`: Validation failure (weak password, invalid email format).
  - `409 Conflict`: Email address is already registered.
  - `403 Forbidden`: Invalid admin registration secret.

---

### `POST /api/auth/login`
Authenticates existing users via email and password, returning a signed JWT.
- **Authentication**: None (Public, Rate Limited: 30 requests / 15 min)
- **Request Body**:
```json
{
  "email": "ada@security.net",
  "password": "SecurePassword123!"
}
```
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "65b...",
      "name": "Ada Lovelace",
      "email": "ada@security.net",
      "role": "researcher",
      "reputation": 100
    },
    "token": "eyJhbGciOiJIUz..."
  }
}
```
- **Errors**:
  - `400 Bad Request`: Missing email or password.
  - `401 Unauthorized`: Invalid credentials.
  - `403 Forbidden`: Account deactivated.

---

### `GET /api/auth/profile`
Retrieves identity, role, and reputation metadata for the authenticated user.
- **Authentication**: Required (`Bearer <token>`)
- **Authorization**: Any authenticated role (`researcher`, `admin`)
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "user": {
      "id": "65b...",
      "name": "Ada Lovelace",
      "email": "ada@security.net",
      "role": "researcher",
      "reputation": 100,
      "createdAt": "2026-09-12T22:00:00.000Z"
    }
  }
}
```
- **Errors**:
  - `401 Unauthorized`: Missing or invalid token.

---

### `POST /api/auth/logout`
Acknowledges client session termination.
- **Authentication**: Required (`Bearer <token>`)
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### `GET /api/auth/admin-check`
Verification probe used to test role-based access control.
- **Authentication**: Required
- **Authorization**: `admin` only
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Admin authorization verified",
  "data": {
    "verified": true,
    "user": { "role": "admin" }
  }
}
```
- **Errors**:
  - `403 Forbidden`: If called by a researcher.

---

## 3. Bounty Programs (`/api/programs`)

### `GET /api/programs`
Lists bounty programs. Public users and researchers only receive `active` programs; administrators see all programs including `paused` and `closed`.
- **Authentication**: Optional
- **Query Parameters**:
  - `search` (string): Text search across title, companyName, and description.
  - `status` (string, admin only): Filter by status (`active`, `paused`, `closed`).
  - `page` (number, default: 1)
  - `limit` (number, default: 20)
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Bounty programs retrieved successfully",
  "data": {
    "programs": [
      {
        "_id": "65b...",
        "companyName": "Apex Cloud Systems",
        "title": "Apex Cloud Public Bounty",
        "description": "Primary cloud APIs and web services.",
        "scope": {
          "inScope": [{ "target": "https://api.apexcorp.com", "type": "api" }],
          "outOfScope": [{ "target": "https://blog.apexcorp.com" }]
        },
        "rewardRange": { "min": 200, "max": 10000, "currency": "USD" },
        "status": "active"
      }
    ],
    "pagination": { "total": 1, "page": 1, "pages": 1, "limit": 20 }
  }
}
```

---

### `POST /api/programs`
Creates a new bounty program with defined scopes and rules.
- **Authentication**: Required
- **Authorization**: `admin` only
- **Request Body**:
```json
{
  "companyName": "Apex Cloud Systems",
  "title": "Apex Cloud Public Bounty",
  "description": "Primary cloud APIs and web services.",
  "scope": {
    "inScope": [{ "target": "https://api.apexcorp.com", "type": "api", "description": "Core REST API" }],
    "outOfScope": [{ "target": "https://blog.apexcorp.com", "description": "Marketing blog" }]
  },
  "rules": "Test only authorized targets in scope. No DoS or social engineering.",
  "rewardRange": { "min": 200, "max": 10000, "currency": "USD" },
  "status": "active"
}
```
- **Response**: `201 Created`
- **Errors**:
  - `400 Bad Request`: Validation failure.
  - `403 Forbidden`: If called by non-admin.

---

### `GET /api/programs/:id`
Retrieves program details, scope, and rules of engagement.
- **Authentication**: Optional
- **Response**: `200 OK`
- **Errors**:
  - `404 Not Found`: Program does not exist.

---

### `PUT /api/programs/:id`
Updates program details, rewards, scope, or status.
- **Authentication**: Required
- **Authorization**: `admin` only
- **Response**: `200 OK`

---

### `DELETE /api/programs/:id`
Deletes a bounty program (blocked if active vulnerability reports are attached).
- **Authentication**: Required
- **Authorization**: `admin` only
- **Response**: `200 OK`

---

## 4. Vulnerability Reports (`/api/reports`)

### `POST /api/reports`
Submits a vulnerability report. Automatically calculates the deterministic risk score and runs the duplicate detection check against existing reports.
- **Authentication**: Required
- **Authorization**: `researcher` or `admin`
- **Request Body**:
```json
{
  "programId": "65b...",
  "title": "Blind SQL Injection in User Search API",
  "description": "Search endpoint fails to sanitize query parameters.",
  "category": "injection",
  "affectedAsset": "https://api.apexcorp.com/v1/users/search",
  "reproductionSteps": "1. Send GET request with UNION SELECT...\n2. Observe database leakage.",
  "impact": "Full database credential extraction.",
  "suggestedRemediation": "Use parameterized queries.",
  "severity": "critical",
  "evidence": [
    {
      "url": "/uploads/evidence/evidence_123.png",
      "fileName": "poc.png",
      "fileType": "image/png"
    }
  ],
  "impactRating": "critical",
  "exploitability": "functional",
  "attackVector": "network",
  "dataExposure": "credentials_financial",
  "authRequirements": "authenticated_user"
}
```
- **Response**: `201 Created`
```json
{
  "success": true,
  "message": "Vulnerability report submitted successfully",
  "data": {
    "report": {
      "_id": "65b...",
      "title": "Blind SQL Injection in User Search API",
      "status": "submitted",
      "riskScore": 9.5,
      "riskAssessment": {
        "score": 9.5,
        "riskBand": "Critical",
        "severityRecommendation": "critical",
        "breakdown": { ... }
      },
      "duplicateCheck": {
        "highestSimilarity": 0,
        "recommendation": "unique",
        "matches": []
      }
    }
  }
}
```

---

### `GET /api/reports`
Lists reports. Researchers receive only their own submissions. Administrators receive all reports across all programs.
- **Authentication**: Required
- **Query Parameters**:
  - `programId` (string)
  - `status` (string): `submitted`, `under_review`, `triaged`, `accepted`, `rejected`, `reward_assigned`, `resolved`
  - `page`, `limit`
- **Response**: `200 OK`

---

### `GET /api/reports/:id`
Retrieves report details including timeline events, risk score breakdown, and duplicate matches.
- **Authentication**: Required
- **Authorization**: Owner researcher or `admin` (**IDOR Protected: other researchers receive 403**)
- **Response**: `200 OK`

---

### `PATCH /api/reports/:id/status`
Transitions report state through the centralized state machine.
- **Authentication**: Required
- **Authorization**: `admin` only
- **Allowed Transitions**:
  - `submitted` $\rightarrow$ `under_review`, `rejected`
  - `under_review` $\rightarrow$ `triaged`, `rejected`
  - `triaged` $\rightarrow$ `accepted`, `rejected`
  - `accepted` $\rightarrow$ `reward_assigned`, `resolved`
  - `reward_assigned` $\rightarrow$ `resolved`
  - `rejected` $\rightarrow$ `under_review` (appeal)
- **Request Body**:
```json
{
  "status": "under_review",
  "note": "Security triage started by analyst."
}
```
- **Response**: `200 OK`

---

### `PATCH /api/reports/:id/severity`
Adjusts assigned severity and recalibrates CVSS risk score.
- **Authentication**: Required
- **Authorization**: `admin` only
- **Request Body**:
```json
{
  "severity": "critical"
}
```
- **Response**: `200 OK`

---

### `GET /api/reports/:id/comments`
Retrieves discussion messages. Internal security notes are stripped if requested by a researcher.
- **Authentication**: Required
- **Authorization**: Report author or `admin` (**IDOR Protected**)
- **Response**: `200 OK`

---

### `POST /api/reports/:id/comments`
Posts a comment or internal note.
- **Authentication**: Required
- **Authorization**: Report author or `admin`
- **Request Body**:
```json
{
  "message": "We have validated the reproduction steps on staging.",
  "isInternal": false
}
```
- **Response**: `201 Created`

---

## 5. File & Evidence Upload (`/api/upload`)

### `POST /api/upload/evidence`
Uploads proof-of-concept screenshots, logs, or documents (max 5 files, max 5MB each).
- **Authentication**: Required
- **Content-Type**: `multipart/form-data`
- **Allowed Types**: PNG, JPEG, WebP, GIF, PDF, TXT, JSON (executable scripts like `.exe`, `.php`, `.sh`, `.js` are strictly rejected)
- **Response**: `201 Created`
```json
{
  "success": true,
  "message": "Evidence files uploaded successfully",
  "data": {
    "files": [
      {
        "url": "/uploads/evidence/evidence_1710000000_abc123_poc.png",
        "publicId": "evidence_1710000000_abc123_poc.png",
        "fileName": "poc.png",
        "fileType": "image/png",
        "fileSize": 14200
      }
    ]
  }
}
```

---

## 6. Rewards Management (`/api/rewards`)

### `POST /api/rewards`
Authorizes a monetary bounty reward for an accepted or triaged finding.
- **Authentication**: Required
- **Authorization**: `admin` only
- **Request Body**:
```json
{
  "reportId": "65b...",
  "amount": 2500,
  "currency": "USD",
  "notes": "Critical remote code execution bounty."
}
```
- **Response**: `201 Created`

---

### `GET /api/rewards`
Lists bounty rewards. Researchers see their own earnings; admins see organization-wide payouts.
- **Authentication**: Required
- **Response**: `200 OK`

---

## 7. Real-Time Notifications (`/api/notifications`)

### `GET /api/notifications`
Retrieves paginated notifications for the authenticated user.
- **Authentication**: Required
- **Query Parameters**:
  - `page`, `limit`
  - `unreadOnly` (`true` | `false`)
- **Response**: `200 OK`

---

### `GET /api/notifications/unread-count`
Retrieves unread counter for notification bell icon.
- **Authentication**: Required
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": { "unreadCount": 3 }
}
```

---

### `PATCH /api/notifications/:id/read`
Marks a specific notification as read.
- **Authentication**: Required (IDOR protected: users can only mark their own notifications)
- **Response**: `200 OK`

---

### `PATCH /api/notifications/mark-all-read`
Marks all notifications belonging to the authenticated user as read.
- **Authentication**: Required
- **Response**: `200 OK`

---

## 8. Platform Analytics (`/api/analytics`)

### `GET /api/analytics/admin`
Deep aggregated metrics for administrative dashboards.
- **Authentication**: Required
- **Authorization**: `admin` only
- **Metrics Included**:
  - Submission velocity over time (`reportsOverTime`)
  - Severity distribution (`severityDist`)
  - Status pipeline breakdown (`statusDist`)
  - Resolution duration / MTTR in hours (`resolution`)
  - Reward payout metrics (`rewards`)
  - Program ranking by volume (`topPrograms`)
- **Response**: `200 OK`

---

### `GET /api/analytics/researcher`
Personalized performance metrics for security researchers.
- **Authentication**: Required
- **Authorization**: Any authenticated researcher
- **Metrics Included**:
  - Personal submissions over time (`reportsOverTime`)
  - Personal acceptance rate percentage (`acceptanceRate`)
  - Severity distribution of findings (`severityDist`)
  - Earnings growth over time (`rewardsOverTime`)
  - Reputation progression timeline (`reputationHistory`)
- **Response**: `200 OK`

---

## 9. Leaderboards & Stats (`/api/leaderboard`, `/api/stats`)

### `GET /api/leaderboard`
Public leaderboard of top security researchers ranked by validated reputation points.
- **Authentication**: Optional (Public)
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "name": "Ada Lovelace",
        "reputation": 100,
        "acceptedReportsCount": 1,
        "totalEarnings": 5000
      }
    ]
  }
}
```

---

### `GET /api/stats/admin`
Real-time summary KPI cards for admin dashboard.
- **Authentication**: Required
- **Authorization**: `admin` only
- **Response**: `200 OK`

---

### `GET /api/stats/researcher`
Summary KPI cards for researcher dashboard (total submissions, accepted findings, earnings, reputation).
- **Authentication**: Required
- **Authorization**: Any authenticated researcher
- **Response**: `200 OK`
