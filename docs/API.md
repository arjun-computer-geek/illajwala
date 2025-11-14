# Illajwala API Documentation

This document describes the REST API endpoints for the Illajwala platform.

**Last Updated**: Sprint 7 - Includes SLA analytics, clinic metrics, enhanced security, and rate limiting.

## Base URL

- **Development:** `http://localhost:4000/api`
- **Production:** `https://api.illajwala.com`

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the request:

```
Authorization: Bearer <access_token>
```

### Token Refresh

Access tokens expire after 1 day. Use the refresh token to get a new access token:

```http
POST /api/auth/refresh
Cookie: refreshToken=<refresh_token>
```

## Common Response Formats

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": { ... }
  }
}
```

## Endpoints

### Authentication

#### Register Patient

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+919876543210",
  "password": "securepassword"
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword",
  "role": "patient"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

#### Logout

```http
POST /api/auth/logout
Authorization: Bearer <token>
Cookie: refreshToken=<refresh_token>
```

#### Refresh Token

```http
POST /api/auth/refresh
Cookie: refreshToken=<refresh_token>
```

### Patients

#### Get Patient Profile

```http
GET /api/patients/me
Authorization: Bearer <token>
```

#### Update Patient Profile

```http
PUT /api/patients/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "phone": "+919876543210",
  "medicalHistory": ["Hypertension"]
}
```

### Doctors

#### List Doctors

```http
GET /api/doctors
Authorization: Bearer <token>
Query Parameters:
  - specialization: string (optional)
  - city: string (optional)
  - search: string (optional)
  - page: number (default: 1)
  - limit: number (default: 10)
```

#### Get Doctor Details

```http
GET /api/doctors/:id
Authorization: Bearer <token>
```

#### Get Doctor Availability

```http
GET /api/doctors/:id/availability
Authorization: Bearer <token>
Query Parameters:
  - startDate: ISO date string
  - endDate: ISO date string
```

### Appointments

#### Create Appointment

```http
POST /api/appointments
Authorization: Bearer <token>
Content-Type: application/json

{
  "doctorId": "doctor_id",
  "clinicId": "clinic_id",
  "scheduledAt": "2024-01-15T10:00:00Z",
  "mode": "clinic",
  "reasonForVisit": "Regular checkup"
}
```

#### List Appointments

```http
GET /api/appointments
Authorization: Bearer <token>
Query Parameters:
  - status: string (optional) - pending, confirmed, completed, cancelled
  - startDate: ISO date string (optional)
  - endDate: ISO date string (optional)
```

#### Get Appointment

```http
GET /api/appointments/:id
Authorization: Bearer <token>
```

#### Update Appointment

```http
PUT /api/appointments/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "completed",
  "notes": "Patient follow-up required"
}
```

#### Cancel Appointment

```http
DELETE /api/appointments/:id
Authorization: Bearer <token>
```

### Waitlists

#### Join Waitlist

```http
POST /api/waitlists
Authorization: Bearer <token>
Content-Type: application/json

{
  "doctorId": "doctor_id",
  "clinicId": "clinic_id",
  "preferredTimeWindow": {
    "start": "2024-01-15T09:00:00Z",
    "end": "2024-01-15T17:00:00Z"
  },
  "reason": "Urgent consultation needed"
}
```

#### List Waitlist Entries

```http
GET /api/waitlists
Authorization: Bearer <token>
Query Parameters:
  - status: string (optional) - pending, promoted, expired
  - clinicId: string (optional)
```

#### Promote Waitlist Entry

```http
POST /api/waitlists/:id/promote
Authorization: Bearer <token>
Content-Type: application/json

{
  "appointmentId": "appointment_id",
  "scheduledAt": "2024-01-15T10:00:00Z"
}
```

#### Update Waitlist Status

```http
PATCH /api/waitlists/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "invited",
  "notes": "Patient notified via SMS"
}
```

#### Update Waitlist Priority

```http
PATCH /api/waitlists/:id/priority
Authorization: Bearer <token>
Content-Type: application/json

{
  "priorityScore": 85,
  "notes": "Manual priority override due to urgency"
}
```

#### Bulk Update Waitlist Status

```http
POST /api/waitlists/bulk/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "entryIds": ["entry_id_1", "entry_id_2"],
  "status": "invited",
  "notes": "Bulk invitation sent"
}
```

#### Get Waitlist Analytics

```http
GET /api/waitlists/analytics
Authorization: Bearer <token>
Query Parameters:
  - startDate: ISO date string (optional)
  - endDate: ISO date string (optional)
  - clinicId: string (optional)
  - doctorId: string (optional)
```

**Response:**

```json
{
  "success": true,
  "data": {
    "totalEntries": 150,
    "byStatus": {
      "active": 45,
      "invited": 12,
      "promoted": 80,
      "expired": 10,
      "cancelled": 3
    },
    "averageWaitTime": 2.5,
    "averageTimeToPromotion": 18.3,
    "promotionRate": 53.3,
    "expiryRate": 6.7,
    "cancellationRate": 2.0,
    "currentQueueSize": 57,
    "peakQueueSize": 89,
    "entriesByDay": [{ "date": "2024-01-15", "count": 12 }],
    "statusTransitions": [{ "from": "active", "to": "promoted", "count": 45 }]
  }
}
```

#### Get Waitlist Policy

```http
GET /api/waitlists/policy?clinicId=clinic_id
Authorization: Bearer <token>
```

#### Update Waitlist Policy

```http
PUT /api/waitlists/policy
Authorization: Bearer <token>
Content-Type: application/json

{
  "clinicId": "clinic_id",
  "maxQueueSize": 250,
  "autoExpiryHours": 72,
  "autoPromoteBufferMinutes": 30,
  "priorityWeights": {
    "waitTime": 0.4,
    "membershipLevel": 0.3,
    "chronicCondition": 0.3
  }
}
```

### Clinics

#### List Clinics

```http
GET /api/clinics
Authorization: Bearer <token>
```

#### Get Clinic

```http
GET /api/clinics/:id
Authorization: Bearer <token>
```

#### Create Clinic (Admin only)

```http
POST /api/clinics
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Main Clinic",
  "slug": "main-clinic",
  "timezone": "Asia/Kolkata",
  "address": "123 Main St",
  "city": "Bengaluru"
}
```

### Payments

#### Create Payment

```http
POST /api/payments
Authorization: Bearer <token>
Content-Type: application/json

{
  "appointmentId": "appointment_id",
  "amount": 1500,
  "currency": "INR"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "orderId": "order_xxx",
    "amount": 1500,
    "currency": "INR",
    "keyId": "rzp_test_xxx"
  }
}
```

#### Verify Payment

```http
POST /api/payments/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "order_xxx",
  "paymentId": "pay_xxx",
  "signature": "signature_xxx"
}
```

### Admin

#### List Doctors (Admin)

```http
GET /api/admin/doctors
Authorization: Bearer <admin_token>
Query Parameters:
  - reviewStatus: string (optional) - pending, approved, active, needs-info
  - page: number (default: 1)
  - limit: number (default: 10)
```

#### Review Doctor

```http
PUT /api/admin/doctors/:id/review
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "reviewStatus": "approved",
  "notes": "Credentials verified"
}
```

### Analytics

#### Get Operations Pulse

```http
GET /api/analytics/ops/pulse
Authorization: Bearer <admin_token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "activeConsultations": 12,
    "waitingPatients": 5,
    "averageWaitTime": 15,
    "noShowRate": 8,
    "revenueToday": 45000,
    "clinicsActive": 3,
    "clinicsPending": 1,
    "alertsOpen": 2
  }
}
```

#### Get Operations Series

```http
GET /api/analytics/ops/series
Authorization: Bearer <admin_token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "consultations": [
      {
        "label": "Consultations",
        "color": "#2563eb",
        "points": [
          { "date": "2025-01-01", "value": 25 },
          { "date": "2025-01-02", "value": 30 }
        ]
      }
    ],
    "revenue": [
      {
        "label": "Revenue",
        "color": "#22c55e",
        "points": [
          { "date": "2025-01-01", "value": 50000 },
          { "date": "2025-01-02", "value": 60000 }
        ]
      }
    ],
    "noShow": [
      {
        "label": "No-show rate",
        "color": "#f97316",
        "points": [
          { "date": "2025-01-01", "value": 5 },
          { "date": "2025-01-02", "value": 8 }
        ]
      }
    ]
  }
}
```

#### Get SLA Metrics

```http
GET /api/analytics/sla
Authorization: Bearer <admin_token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "verificationSLA": {
      "average": 36,
      "target": 48,
      "met": 95.2
    },
    "incidentResolution": {
      "average": 2.5,
      "target": 4,
      "met": 98.1
    },
    "payoutProcessing": {
      "average": 24,
      "target": 48,
      "met": 99.4
    },
    "clinicActivation": {
      "average": 5,
      "target": 7,
      "met": 92.8
    }
  }
}
```

#### Get Clinic Metrics

```http
GET /api/analytics/clinics/metrics?clinicId=clinic_id
Authorization: Bearer <admin_token>
Query Parameters:
  - clinicId: string (optional) - Filter by specific clinic
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "clinicId": "clinic_id",
      "clinicName": "Skin Renewal Clinic",
      "activeDoctors": 8,
      "appointmentsToday": 24,
      "revenueToday": 48000,
      "status": "active"
    }
  ]
}
```

## Real-time Updates

### Server-Sent Events (SSE)

The platform provides real-time updates via Server-Sent Events for authenticated users.

#### Waitlist Updates (Doctor)

```http
GET /api/realtime/waitlists
Authorization: Bearer <token>
```

**Response**: Event stream with the following event types:

- `waitlist.created` - New waitlist entry added
- `waitlist.updated` - Existing entry modified
- `waitlist.status.changed` - Entry status changed
- `waitlist.removed` - Entry removed from waitlist
- `heartbeat` - Connection keep-alive

**Example Event:**

```
event: waitlist.created
data: {"type":"waitlist.created","waitlist":{"_id":"...","status":"active",...}}
```

#### Appointment Updates (Patient)

```http
GET /api/realtime/appointments
Authorization: Bearer <token>
```

**Response**: Event stream with appointment lifecycle events.

## Error Codes

| Code                  | Description                               |
| --------------------- | ----------------------------------------- |
| `UNAUTHORIZED`        | Authentication required                   |
| `FORBIDDEN`           | Insufficient permissions                  |
| `NOT_FOUND`           | Resource not found                        |
| `VALIDATION_ERROR`    | Request validation failed                 |
| `CONFLICT`            | Resource conflict (e.g., duplicate email) |
| `RATE_LIMIT_EXCEEDED` | Too many requests                         |
| `INTERNAL_ERROR`      | Server error                              |

## Error Response Examples

### Validation Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "field": "email",
      "message": "Invalid email format"
    }
  }
}
```

### Not Found Error

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Appointment not found",
    "details": {
      "resource": "appointment",
      "id": "appointment_id"
    }
  }
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse and ensure fair usage:

- **General API endpoints**: 100 requests per minute per IP
- **Login endpoints**: 5 attempts per 15 minutes per IP (only failed attempts counted)
- **Payment endpoints**: 10 requests per minute per IP
- **Registration endpoints**: 60 requests per minute per IP

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

When rate limit is exceeded:

```json
{
  "success": false,
  "error": {
    "message": "Rate limit exceeded. Try again in 60 seconds.",
    "code": "RATE_LIMIT_EXCEEDED"
  }
}
```

The API returns a `429 Too Many Requests` status with a `Retry-After` header indicating when to retry.

## Pagination

List endpoints support pagination:

**Query Parameters:**

- `page`: Page number (default: 1)
- `pageSize`: Items per page (default: 20, max: 100)

**Response Format:**

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

## Filtering & Sorting

Many list endpoints support filtering and sorting:

**Appointments:**

- Filter by: `status`, `doctorId`, `patientId`, `clinicId`, `dateFrom`, `dateTo`
- Sort by: `scheduledAt` (asc/desc), `createdAt` (asc/desc)

**Doctors:**

- Filter by: `specialization`, `city`, `consultationMode`
- Sort by: `name` (asc/desc), `specialization`, `availability`

**Waitlists:**

- Filter by: `status`, `doctorId`, `clinicId`, `patientId`
- Sort by: `priorityScore` (desc), `createdAt` (asc/desc)

## Multi-Tenant Support

All endpoints are tenant-aware. The tenant context is automatically extracted from:

1. JWT token claims (`tenantId`)
2. `X-Tenant-Id` header (for service-to-service calls)

Data is automatically filtered by tenant to ensure isolation.

## Webhooks

### Payment Webhook

Razorpay sends payment webhooks to:

```http
POST /api/payments/webhook
```

The webhook includes Razorpay signature verification.

## Health Checks

### General Health Check

```http
GET /health
```

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:00:00Z",
  "uptime": 3600.5,
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

### Readiness Probe

```http
GET /health/ready
```

Checks if the service is ready to accept traffic. Returns `200` if all dependencies are healthy, `503` otherwise.

**Response (Ready):**

```json
{
  "status": "ready",
  "checks": {
    "database": true,
    "redis": true
  },
  "timestamp": "2024-01-15T10:00:00Z"
}
```

**Response (Not Ready):**

```json
{
  "status": "not ready",
  "checks": {
    "database": false,
    "redis": true
  },
  "timestamp": "2024-01-15T10:00:00Z"
}
```

### Liveness Probe

```http
GET /health/live
```

Checks if the service process is alive. Always returns `200` if the service is running.

**Response:**

```json
{
  "status": "alive",
  "timestamp": "2024-01-15T10:00:00Z",
  "uptime": 3600.5
}
```

## Metrics

```http
GET /api/metrics
```

Returns Prometheus-compatible metrics.

## Security

The API implements multiple security measures to protect against common vulnerabilities:

### Authentication & Authorization

- JWT-based authentication with access and refresh tokens
- Role-based access control (RBAC) for patients, doctors, and admins
- Token expiration and refresh mechanism
- Secure password hashing using bcrypt

### Input Validation & Sanitization

- **Zod Schema Validation**: All request bodies, query parameters, and route parameters are validated using Zod schemas
- **Input Sanitization**: Automatic sanitization of user inputs to prevent XSS and injection attacks
- **MongoDB ObjectId Validation**: Route parameters containing IDs are validated to prevent NoSQL injection
- **Request Size Limits**: JSON and URL-encoded request bodies are limited to 1MB

### Security Headers

The API uses Helmet.js to set security headers:

- **Content Security Policy (CSP)**: Restricts resource loading to prevent XSS
- **HSTS (HTTP Strict Transport Security)**: Enforces HTTPS connections
- **XSS Protection**: Browser-level XSS filtering
- **No Sniff**: Prevents MIME type sniffing
- **Referrer Policy**: Controls referrer information disclosure

### Rate Limiting

Rate limiting is enforced at multiple levels:

- General API endpoints: 100 requests/minute per IP
- Login endpoints: 5 attempts per 15 minutes per IP (only failed attempts counted)
- Payment endpoints: 10 requests/minute per IP
- Registration endpoints: 60 requests/minute per IP

### Error Handling

- Error messages in production don't leak sensitive information
- Structured error logging with context (path, method, IP, user agent)
- Different log levels for client errors (warn) and server errors (error)

### CORS Protection

- CORS is configured to only allow requests from trusted origins
- Credentials are required for cross-origin requests
- Origin validation on all API requests

### Data Protection

- Sensitive fields (passwords, tokens, secrets) are excluded from input sanitization
- Passwords are never logged or returned in responses
- JWT secrets are stored securely and never exposed

### Best Practices

1. **Always use HTTPS** in production
2. **Store secrets securely** using environment variables
3. **Rotate JWT secrets** regularly
4. **Monitor rate limit violations** for potential abuse
5. **Review error logs** regularly for security issues
6. **Keep dependencies updated** to patch security vulnerabilities
