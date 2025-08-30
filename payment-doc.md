# Payment Management Routes Documentation

## Overview

This document describes the payment management routes that were implemented/enabled for admin users to view all transactions, refunds, and manage payments.

## Routes

### 1. Payment Analytics

**Route:** `GET /admin/payments/analytics`

**Purpose:** Get comprehensive payment statistics and analytics

**Query Parameters:**

- `startDate` (optional): Filter from this date
- `endDate` (optional): Filter to this date
- `period` (optional): Period type (default: "month")

**Response:**

```json
{
  "totalPayments": 1234,
  "totalRevenue": 45678.9,
  "totalRefunds": 1234.56,
  "netRevenue": 44444.34,
  "statusBreakdown": [
    {
      "status": "COMPLETED",
      "_count": { "status": 800 },
      "_sum": { "amount": 35000.0 }
    },
    {
      "status": "REFUNDED",
      "_count": { "status": 50 },
      "_sum": { "amount": 2500.0 }
    }
  ],
  "period": "month",
  "dateRange": {
    "startDate": "2025-01-01",
    "endDate": "2025-01-31"
  }
}
```

### 2. All Transactions

**Route:** `GET /admin/payments`

**Purpose:** View all payments with filtering and pagination

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by payment status
- `userId` (optional): Filter by user ID
- `matchId` (optional): Filter by match ID
- `startDate` (optional): Filter from this date
- `endDate` (optional): Filter to this date
- `sortBy` (optional): Sort field (default: "createdAt")
- `sortOrder` (optional): Sort order "asc" or "desc" (default: "desc")

**Response:**

```json
{
  "payments": [
    {
      "id": "payment_123",
      "stripePaymentId": "pi_1234567890",
      "amount": 25.0,
      "currency": "usd",
      "status": "COMPLETED",
      "refundAmount": null,
      "refundReason": null,
      "refundedAt": null,
      "paymentMethod": "card",
      "description": "Match payment",
      "createdAt": "2025-08-12T10:30:00Z",
      "updatedAt": "2025-08-12T10:30:00Z",
      "user": {
        "id": "user_123",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "match": {
        "id": "match_123",
        "scheduledAt": "2025-08-15T18:00:00Z",
        "game": {
          "name": "tennis"
        }
      }
    }
  ],
  "totalPayments": 1234,
  "totalPages": 124,
  "currentPage": 1
}
```

### 3. Individual Payment Details

**Route:** `GET /admin/payments/:id`

**Purpose:** View detailed payment information including refund eligibility

**Response:**

```json
{
  "id": "payment_123",
  "stripePaymentId": "pi_1234567890",
  "amount": 25.0,
  "currency": "usd",
  "status": "COMPLETED",
  "refundAmount": null,
  "refundReason": null,
  "refundedAt": null,
  "paymentMethod": "card",
  "description": "Match payment",
  "metadata": {},
  "createdAt": "2025-08-12T10:30:00Z",
  "updatedAt": "2025-08-12T10:30:00Z",
  "user": {
    "id": "user_123",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "match": {
    "id": "match_123",
    "scheduledAt": "2025-08-15T18:00:00Z",
    "status": "UPCOMING",
    "game": {
      "name": "tennis"
    },
    "location": {
      "name": "Central Court",
      "city": "New York"
    }
  },
  "refundEligibility": {
    "eligible": true,
    "reason": "Payment is eligible for refund",
    "maxRefundable": 25.0
  }
}
```

### 4. Create Refund

**Route:** `POST /admin/payments/:id/refund`

**Purpose:** Create a refund for a payment

**Request Body:**

```json
{
  "amount": 25.0,
  "reason": "Customer request"
}
```

**Response:**

```json
{
  "id": "refund_123",
  "paymentId": "payment_123",
  "amount": 25.0,
  "reason": "Customer request",
  "status": "REFUNDED",
  "processedAt": "2025-08-12T11:00:00Z",
  "adminId": "admin_123"
}
```

### 5. All Refunds

**Route:** `GET /admin/refunds`

**Purpose:** View all refunded transactions with analytics

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `userId` (optional): Filter by user ID
- `matchId` (optional): Filter by match ID
- `startDate` (optional): Filter from this date
- `endDate` (optional): Filter to this date
- `sortBy` (optional): Sort field (default: "refundedAt")
- `sortOrder` (optional): Sort order "asc" or "desc" (default: "desc")

**Response:**

```json
{
  "refunds": [
    {
      "id": "payment_123",
      "stripePaymentId": "pi_1234567890",
      "amount": 25.0,
      "currency": "usd",
      "status": "REFUNDED",
      "refundAmount": 25.0,
      "refundReason": "Customer request",
      "refundedAt": "2025-08-12T11:00:00Z",
      "description": "Match payment",
      "createdAt": "2025-08-12T10:30:00Z",
      "user": {
        "id": "user_123",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "match": {
        "id": "match_123",
        "scheduledAt": "2025-08-15T18:00:00Z",
        "game": {
          "name": "tennis"
        }
      }
    }
  ],
  "totalRefunds": 50,
  "totalPages": 5,
  "currentPage": 1,
  "analytics": {
    "totalRefundAmount": 1250.0,
    "refundRate": 4.05,
    "averageRefundAmount": 25.0
  }
}
```

## Authentication

All routes require:

- Valid authentication token
- Admin role authorization

## Implementation Files

- **Service:** `src/modules/admin/adminService.ts`
- **Controller:** `src/modules/admin/adminController.ts`
- **Routes:** `src/modules/admin/adminRoutes.ts`
- **Schemas:** `src/modules/admin/adminSchema.ts`

## User Payment Routes

### 1. Get User Payment History

**Route:** `GET /users/payments`

**Purpose:** Allow authenticated users to view their payment history

**Authentication Required:** Yes (User JWT token)

**Query Parameters:**

- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of payments per page (default: 10)

**Response:**

```json
{
  "payments": [
    {
      "id": "payment_123",
      "stripePaymentIntentId": "pi_123",
      "amount": 25.0,
      "currency": "USD",
      "status": "COMPLETED",
      "createdAt": "2025-01-15T10:30:00Z",
      "match": {
        "id": "match_456",
        "gameTitle": "Tennis Match",
        "scheduledTime": "2025-01-16T14:00:00Z"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  },
  "summary": {
    "totalSpent": 625.0,
    "totalRefunded": 50.0,
    "netSpent": 575.0,
    "totalPayments": 25
  }
}
```

### 2. Get Single Payment Details

**Route:** `GET /users/payments/:paymentId`

**Purpose:** Allow authenticated users to view details of a specific payment

**Authentication Required:** Yes (User JWT token)

**Parameters:**

- `paymentId`: ID of the payment to retrieve

**Response:**

```json
{
  "id": "payment_123",
  "stripePaymentIntentId": "pi_123",
  "amount": 25.0,
  "currency": "USD",
  "status": "COMPLETED",
  "createdAt": "2025-01-15T10:30:00Z",
  "match": {
    "id": "match_456",
    "gameTitle": "Tennis Match",
    "scheduledTime": "2025-01-16T14:00:00Z",
    "location": "City Sports Center",
    "participants": [
      {
        "id": "user_456",
        "name": "John Doe"
      }
    ]
  }
}
```

**Error Responses:**

- `404 Not Found`: Payment not found or doesn't belong to user
- `401 Unauthorized`: User not authenticated

### 3. Mark All Notifications as Seen

**Route:** `PATCH /users/notifications/mark-all`

**Purpose:** Allow authenticated users to mark all their notifications as seen

**Authentication Required:** Yes (User JWT token)

**Response:**

```json
{
  "message": "All notifications marked as seen",
  "updatedCount": 5
}
```

## Implementation Files

### Admin Payment Routes

- **Controller:** `src/modules/admin/adminController.ts`
- **Routes:** `src/modules/admin/adminRoutes.ts`
- **Schemas:** `src/modules/admin/adminSchema.ts`

### User Routes

- **Controller:** `src/modules/user/usersController.ts`
- **Routes:** `src/modules/user/usersRouter.ts`
- **Service:** `src/modules/user/usersService.ts`

## Notes

- All payment routes include proper error handling
- Refund eligibility is automatically checked
- Analytics include comprehensive breakdowns
- All responses include pagination where applicable
- User payment routes ensure users can only access their own payment data
- Payment tracking is automatically handled by Stripe webhooks
