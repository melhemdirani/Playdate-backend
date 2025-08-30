# 📋 ADMIN ROUTES COMPLETE DOCUMENTATION

## Overview

This document contains all admin routes with their exact schemas and request formats for the Playdate Backend API.

---

## 🧑‍💼 USER MANAGEMENT ROUTES

### GET `/admin/users/all` - View all users with query filters

**Description**: Retrieve paginated list of all users with filtering and sorting options
**Query Parameters Schema**:

```typescript
{
  page?: string,           // Default: "1"
  limit?: string,          // Default: "10"
  search?: string,         // Search in name/email
  status?: "PENDING" | "ACCEPTED" | "REJECTED" | "BANNED" | "SUSPENDED",
  role?: "ADMIN" | "REGULAR",
  sortBy?: "createdAt" | "name" | "email" | "gamesPlayed",
  sortOrder?: "asc" | "desc"  // Default: "desc"
}
```

**Example**: `GET /admin/users/all?page=1&limit=20&status=ACTIVE&sortBy=createdAt`

### GET `/admin/users/:id` - View user by ID

**Description**: Get detailed information about a specific user
**Path Parameters**:

```typescript
{
  id: string; // User ID
}
```

**Example**: `GET /admin/users/user_123456789`

### PATCH `/admin/users/:id` - Update user by ID

**Description**: Update user information including status and role
**Path Parameters**: `{ id: string }`
**Request Body Schema**:

```typescript
{
  name?: string,
  email?: string,  // Must be valid email
  status?: "PENDING" | "ACCEPTED" | "REJECTED" | "BANNED" | "SUSPENDED",
  role?: "ADMIN" | "REGULAR"
}
```

**Example**:

```json
{
  "name": "John Doe Updated",
  "status": "ACCEPTED"
}
```

### DELETE `/admin/users/:id` - Delete user by ID

**Description**: Permanently remove a user from the system
**Path Parameters**: `{ id: string }`
**Request Body**: None required
**Example**: `DELETE /admin/users/user_123456789`

### PATCH `/admin/users/:id/status` - Update user status (ban/suspend users)

**Description**: Change user status for moderation purposes
**Path Parameters**: `{ id: string }`
**Request Body Schema**:

```typescript
{
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "BANNED" | "SUSPENDED"; // Required
}
```

**Example**:

```json
{
  "status": "BANNED"
}
```

---

## 🎮 MATCH MANAGEMENT ROUTES

### GET `/admin/matches` - View all matches with query filters

**Description**: Retrieve all matches with filtering, pagination, and sorting
**Query Parameters Schema**:

```typescript
{
  page?: string,           // Default: "1"
  limit?: string,          // Default: "10"
  status?: string,         // Match status
  gameId?: string,         // Filter by game
  creatorId?: string,      // Filter by creator
  search?: string,         // Search in creator name, location
  sortBy?: "createdAt" | "scheduledAt" | "pricePerUser",
  sortOrder?: "asc" | "desc"  // Default: "desc"
}
```

**Example**: `GET /admin/matches?status=UPCOMING&gameId=game_123&page=1`

### GET `/admin/matches/:id` - View match by ID

**Description**: Get detailed information about a specific match
**Path Parameters**:

```typescript
{
  id: string; // Match ID
}
```

**Example**: `GET /admin/matches/match_123456789`

### PATCH `/admin/matches/:id` - Update match by ID

**Description**: Update match details and status
**Path Parameters**: `{ id: string }`
**Request Body Schema**:

```typescript
{
  status?: string,              // Match status
  cancellationReason?: string   // Reason for cancellation
}
```

**Example**:

```json
{
  "status": "CANCELLED",
  "cancellationReason": "Venue unavailable"
}
```

### DELETE `/admin/matches/:id` - Delete match by ID

**Description**: Remove a match from the system
**Path Parameters**: `{ id: string }`
**Request Body**: None required
**Example**: `DELETE /admin/matches/match_123456789`

---

## 🎯 GAME MANAGEMENT ROUTES (CRUD)

### GET `/admin/games` - View all games

**Description**: List all available games with usage statistics
**Parameters**: None required
**Example**: `GET /admin/games`

### GET `/admin/games/:id` - View game by ID

**Description**: Get detailed information about a specific game
**Path Parameters**:

```typescript
{
  id: string; // Game ID
}
```

**Example**: `GET /admin/games/game_123456789`

### POST `/admin/games` - Create new game

**Description**: Add a new game to the platform
**Request Body Schema**:

```typescript
{
  name: string,      // Required - Game name
  imageId?: string   // Optional - Image ID
}
```

**Example**:

```json
{
  "name": "padel",
  "imageId": "img_123456"
}
```

### PATCH `/admin/games/:id` - Update game by ID

**Description**: Edit game details and images
**Path Parameters**: `{ id: string }`
**Request Body Schema**:

```typescript
{
  name?: string,     // Game name
  imageId?: string   // Image ID
}
```

**Example**:

```json
{
  "name": "tennis",
  "imageId": "img_654321"
}
```

### DELETE `/admin/games/:id` - Delete game by ID

**Description**: Remove a game from the platform
**Path Parameters**: `{ id: string }`
**Request Body**: None required
**Example**: `DELETE /admin/games/game_123456789`

---

## 📊 REPORTS MANAGEMENT ROUTES (CRUD)

### GET `/admin/reports` - View all user reports with filters

**Description**: Retrieve all user behavior reports with filtering options
**Query Parameters Schema**:

```typescript
{
  page?: string,           // Default: "1"
  limit?: string,          // Default: "10"
  status?: "PENDING" | "UNDER_REVIEW" | "RESOLVED" | "DISMISSED",
  reason?: "INAPPROPRIATE_BEHAVIOR" | "HARASSMENT" | "CHEATING" | "NO_SHOW" | "FAKE_PROFILE" | "SPAM" | "OTHER",
  reporterId?: string,     // Filter by reporter user ID
  reportedId?: string,     // Filter by reported user ID
  sortBy?: "createdAt" | "status",
  sortOrder?: "asc" | "desc"  // Default: "desc"
}
```

**Example**: `GET /admin/reports?status=PENDING&reason=HARASSMENT&page=1`

### GET `/admin/reports/:id` - View report by ID

**Description**: Get detailed information about a specific report
**Path Parameters**:

```typescript
{
  id: string; // Report ID
}
```

**Example**: `GET /admin/reports/report_123456789`

### POST `/admin/reports` - Create user report

**Description**: Submit a new user behavior report
**Request Body Schema**:

```typescript
{
  reportedId: string,  // Required - ID of user being reported
  reason: "INAPPROPRIATE_BEHAVIOR" | "HARASSMENT" | "CHEATING" | "NO_SHOW" | "FAKE_PROFILE" | "SPAM" | "OTHER",  // Required
  description?: string  // Optional - Additional details
}
```

**Example**:

```json
{
  "reportedId": "user_987654321",
  "reason": "INAPPROPRIATE_BEHAVIOR",
  "description": "User was using offensive language during the match"
}
```

### PATCH `/admin/reports/:id` - Update report status

**Description**: Update report status and add admin notes
**Path Parameters**: `{ id: string }`
**Request Body Schema**:

```typescript
{
  status: "PENDING" | "UNDER_REVIEW" | "RESOLVED" | "DISMISSED",  // Required
  adminNotes?: string  // Optional - Admin notes/comments
}
```

**Example**:

```json
{
  "status": "RESOLVED",
  "adminNotes": "User has been warned and agreed to follow community guidelines"
}
```

### DELETE `/admin/reports/:id` - Delete report

**Description**: Remove a report from the system
**Path Parameters**: `{ id: string }`
**Request Body**: None required
**Example**: `DELETE /admin/reports/report_123456789`

---

## 💰 PAYMENT & REFUND MANAGEMENT ROUTES

### GET `/admin/payments/analytics` - View payment analytics

**Description**: Get comprehensive payment analytics and revenue metrics
**Query Parameters Schema**:

```typescript
{
  startDate?: string,  // ISO date string (e.g., "2025-01-01")
  endDate?: string,    // ISO date string (e.g., "2025-01-31")
  period?: "day" | "week" | "month" | "year"  // Default: "month"
}
```

**Example**: `GET /admin/payments/analytics?startDate=2025-01-01&endDate=2025-01-31&period=month`

### GET `/admin/payments` - View all payments with filters

**Description**: Retrieve all payments with filtering and pagination
**Query Parameters Schema**:

```typescript
{
  page?: string,           // Default: "1"
  limit?: string,          // Default: "10"
  status?: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED" | "REFUNDED" | "PARTIALLY_REFUNDED",
  userId?: string,         // Filter by user ID
  matchId?: string,        // Filter by match ID
  startDate?: string,      // ISO date string
  endDate?: string,        // ISO date string
  sortBy?: "createdAt" | "amount",
  sortOrder?: "asc" | "desc"  // Default: "desc"
}
```

**Example**: `GET /admin/payments?status=COMPLETED&startDate=2025-01-01&page=1&limit=50`

### GET `/admin/payments/:id` - View individual payment details

**Description**: Get detailed information about a specific payment including refund eligibility
**Path Parameters**:

```typescript
{
  id: string; // Payment ID
}
```

**Example**: `GET /admin/payments/pay_123456789`

### POST `/admin/payments/:id/refund` - Process refund for a payment

**Description**: Process a full or partial refund for a payment through Stripe
**Path Parameters**: `{ id: string }` // Payment ID
**Request Body Schema**:

```typescript
{
  amount: number,  // Required - Refund amount (must be positive)
  reason: string   // Required - Reason for refund (minimum 1 character)
}
```

**Example**:

```json
{
  "amount": 25.5,
  "reason": "Customer requested refund due to match cancellation"
}
```

### GET `/admin/refunds` - View all refunds with filters

**Description**: Retrieve all refunded payments with filtering options
**Query Parameters Schema**:

```typescript
{
  page?: string,           // Default: "1"
  limit?: string,          // Default: "10"
  userId?: string,         // Filter by user ID
  matchId?: string,        // Filter by match ID
  startDate?: string,      // ISO date string
  endDate?: string,        // ISO date string
  sortBy?: "createdAt" | "amount",  // Default: "createdAt"
  sortOrder?: "asc" | "desc"  // Default: "desc"
}
```

**Example**: `GET /admin/refunds?userId=user_123&startDate=2025-01-01&page=1`

---

## 🔧 LEGACY USER ROUTES (Kept for Compatibility)

### GET `/admin/users` - Legacy filtered users endpoint

**Description**: Legacy endpoint for filtered user retrieval
**Query Parameters Schema**:

```typescript
{
  page?: string,
  limit?: string,
  search?: string,
  isVerified?: string,  // "true" or "false"
  role?: "ADMIN" | "REGULAR"
}
```

### POST `/admin/users/accept/:id` - Accept user signup

**Description**: Accept a pending user signup
**Path Parameters**: `{ id: string }`
**Request Body**: None required

### POST `/admin/users/reject/:id` - Reject user signup

**Description**: Reject a pending user signup
**Path Parameters**: `{ id: string }`
**Request Body**: None required

### GET `/admin/approve-users/:id` - Approve user

**Description**: Approve a user account
**Path Parameters**: `{ id: string }`
**Request Body**: None required

### DELETE `/admin/approve-users/:id` - Disapprove user

**Description**: Disapprove a user account
**Path Parameters**: `{ id: string }`
**Request Body**: None required

### POST `/admin/admins` - Create admin user

**Description**: Create a new admin user account
**Request Body Schema**:

```typescript
{
  name: string,        // Required
  email: string,       // Required - Valid email
  password: string,    // Required
  phoneNumber?: string
}
```

### GET `/admin/admins` - Get filtered admins

**Description**: Get filtered list of admin users
**Query Parameters Schema**:

```typescript
{
  page?: string,
  limit?: string,
  search?: string,
  isVerified?: string,  // "true" or "false"
  role?: "ADMIN" | "REGULAR"
}
```

---

## 🔐 AUTHENTICATION REQUIREMENTS

All admin routes require:

- **Authorization Header**: `Bearer <jwt_token>`
- **Admin Role**: User must have `role: "ADMIN"`
- **Content-Type**: `application/json` (for POST/PATCH requests)

---

## 📝 EXAMPLE API CALLS

### Create Refund Example

```bash
POST /admin/payments/pay_123456/refund
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "amount": 25.50,
  "reason": "Customer requested refund due to match cancellation"
}
```

### Update User Status Example

```bash
PATCH /admin/users/user_123456/status
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "status": "BANNED"
}
```

### Filter Payments Example

```bash
GET /admin/payments?status=COMPLETED&startDate=2025-01-01&endDate=2025-01-31&page=1&limit=20
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Create Game Example

```bash
POST /admin/games
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "padel",
  "imageId": "img_123456"
}
```

### Update Report Example

```bash
PATCH /admin/reports/report_789
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "status": "RESOLVED",
  "adminNotes": "Issue has been resolved after user warning"
}
```

---

## 🚀 KEY FEATURES SUMMARY

### User Management

- ✅ View, update, delete users
- ✅ Ban/suspend users with status updates
- ✅ Advanced filtering and search
- ✅ Role management (Admin/Regular)

### Match Management

- ✅ Complete match oversight
- ✅ Status updates and cancellations
- ✅ Creator and participant tracking
- ✅ Advanced filtering by game, status, creator

### Game Management

- ✅ Full CRUD operations for games
- ✅ Image management integration
- ✅ Usage statistics tracking

### Report Management

- ✅ User behavior reporting system
- ✅ Status tracking (Pending → Under Review → Resolved)
- ✅ Admin notes and resolution tracking
- ✅ Multiple report categories

### Payment & Refund System

- ✅ Complete payment oversight
- ✅ Stripe-integrated refund processing
- ✅ Partial and full refund support
- ✅ Revenue analytics and reporting
- ✅ Refund eligibility validation
- ✅ Audit trail for all transactions

### Security & Compliance

- ✅ JWT-based authentication
- ✅ Role-based access control
- ✅ Request validation with Zod schemas
- ✅ Comprehensive error handling
- ✅ Activity logging and audit trails

---

## 📊 RESPONSE FORMATS

All successful responses follow this general format:

```typescript
{
  // For list endpoints
  data: Array<T>,
  totalCount: number,
  totalPages: number,
  currentPage: number,

  // For single item endpoints
  // Direct object response

  // For action endpoints
  message: string,
  result?: any
}
```

Error responses:

```typescript
{
  error: string | object,
  statusCode: number
}
```

---

**Generated**: August 9, 2025  
**Backend**: Playdate Backend API  
**Version**: Admin Panel v1.0  
**Contact**: Development Team
