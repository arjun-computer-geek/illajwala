# Illajwala API Documentation

This document describes the REST API endpoints for the Illajwala platform.

**Last Updated**: Sprint 6 - Includes waitlist analytics, bulk operations, and priority management.

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

#### Get Analytics

```http
GET /api/admin/analytics
Authorization: Bearer <admin_token>
Query Parameters:
  - startDate: ISO date string
  - endDate: ISO date string
  - clinicId: string (optional)
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

- **General endpoints:** 100 requests per minute
- **Authentication endpoints:** 10 requests per minute
- **Search endpoints:** 50 requests per minute
- **Real-time endpoints:** 5 connections per user

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
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": {
      "retryAfter": 60
    }
  }
}
```

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

## Health Check

```http
GET /api/health
```

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:00:00Z",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

## Metrics

```http
GET /api/metrics
```

Returns Prometheus-compatible metrics.
