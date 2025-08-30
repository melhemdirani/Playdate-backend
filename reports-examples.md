# Reports API Response Examples

## 1. GET /admin/reports - Get All Reports

### Request

```
GET /admin/reports?page=1&limit=10&status=PENDING&sortBy=createdAt&sortOrder=desc
Authorization: Bearer <admin_token>
```

### Response

```json
{
  "reports": [
    {
      "id": "clp123abc456def789",
      "reporterId": "user_456",
      "reportedId": "user_789",
      "reason": "INAPPROPRIATE_BEHAVIOR",
      "description": "User was using offensive language during the match and made inappropriate comments.",
      "status": "PENDING",
      "adminNotes": null,
      "resolvedBy": null,
      "resolvedAt": null,
      "createdAt": "2025-01-10T14:30:00.000Z",
      "updatedAt": "2025-01-10T14:30:00.000Z",
      "reporter": {
        "id": "user_456",
        "name": "John Smith",
        "email": "john.smith@example.com",
        "profileImage": {
          "id": "img_123",
          "url": "https://example.com/profile1.jpg",
          "filename": "profile1.jpg"
        }
      },
      "reported": {
        "id": "user_789",
        "name": "Jane Doe",
        "email": "jane.doe@example.com",
        "profileImage": {
          "id": "img_456",
          "url": "https://example.com/profile2.jpg",
          "filename": "profile2.jpg"
        }
      }
    },
    {
      "id": "clp987xyz654abc321",
      "reporterId": "user_111",
      "reportedId": "user_222",
      "reason": "NO_SHOW",
      "description": "User didn't show up for the scheduled match and didn't notify in advance.",
      "status": "UNDER_REVIEW",
      "adminNotes": "Investigating user's match history for pattern of no-shows",
      "resolvedBy": null,
      "resolvedAt": null,
      "createdAt": "2025-01-09T16:45:00.000Z",
      "updatedAt": "2025-01-10T09:15:00.000Z",
      "reporter": {
        "id": "user_111",
        "name": "Mike Johnson",
        "email": "mike.johnson@example.com",
        "profileImage": null
      },
      "reported": {
        "id": "user_222",
        "name": "Sarah Wilson",
        "email": "sarah.wilson@example.com",
        "profileImage": {
          "id": "img_789",
          "url": "https://example.com/profile3.jpg",
          "filename": "profile3.jpg"
        }
      }
    },
    {
      "id": "clp555def888ghi999",
      "reporterId": "user_333",
      "reportedId": "user_444",
      "reason": "CHEATING",
      "description": "Suspected of using unfair advantages during tennis match.",
      "status": "RESOLVED",
      "adminNotes": "Reviewed match footage. No evidence of cheating found. Report dismissed.",
      "resolvedBy": "admin_001",
      "resolvedAt": "2025-01-08T13:20:00.000Z",
      "createdAt": "2025-01-07T11:30:00.000Z",
      "updatedAt": "2025-01-08T13:20:00.000Z",
      "reporter": {
        "id": "user_333",
        "name": "David Brown",
        "email": "david.brown@example.com",
        "profileImage": {
          "id": "img_101",
          "url": "https://example.com/profile4.jpg",
          "filename": "profile4.jpg"
        }
      },
      "reported": {
        "id": "user_444",
        "name": "Emily Davis",
        "email": "emily.davis@example.com",
        "profileImage": {
          "id": "img_202",
          "url": "https://example.com/profile5.jpg",
          "filename": "profile5.jpg"
        }
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

## 2. GET /admin/reports/:id - Get Report by ID

### Request

```
GET /admin/reports/clp123abc456def789
Authorization: Bearer <admin_token>
```

### Response

```json
{
  "id": "clp123abc456def789",
  "reporterId": "user_456",
  "reportedId": "user_789",
  "reason": "INAPPROPRIATE_BEHAVIOR",
  "description": "User was using offensive language during the match and made inappropriate comments.",
  "status": "PENDING",
  "adminNotes": null,
  "resolvedBy": null,
  "resolvedAt": null,
  "createdAt": "2025-01-10T14:30:00.000Z",
  "updatedAt": "2025-01-10T14:30:00.000Z",
  "reporter": {
    "id": "user_456",
    "name": "John Smith",
    "email": "john.smith@example.com",
    "profileImage": {
      "id": "img_123",
      "url": "https://example.com/profile1.jpg",
      "filename": "profile1.jpg"
    }
  },
  "reported": {
    "id": "user_789",
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "profileImage": {
      "id": "img_456",
      "url": "https://example.com/profile2.jpg",
      "filename": "profile2.jpg"
    }
  }
}
```

## 3. POST /admin/reports - Create New Report

### Request

```json
POST /admin/reports
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "reportedId": "user_555",
  "reason": "HARASSMENT",
  "description": "User has been sending inappropriate messages and making other players uncomfortable."
}
```

### Response

```json
{
  "id": "clp777abc888def999",
  "reporterId": "admin_001",
  "reportedId": "user_555",
  "reason": "HARASSMENT",
  "description": "User has been sending inappropriate messages and making other players uncomfortable.",
  "status": "PENDING",
  "adminNotes": null,
  "resolvedBy": null,
  "resolvedAt": null,
  "createdAt": "2025-01-12T10:15:00.000Z",
  "updatedAt": "2025-01-12T10:15:00.000Z",
  "reporter": {
    "id": "admin_001",
    "name": "Admin User",
    "email": "admin@playdate.com",
    "profileImage": null
  },
  "reported": {
    "id": "user_555",
    "name": "Problem User",
    "email": "problem.user@example.com",
    "profileImage": {
      "id": "img_999",
      "url": "https://example.com/profile6.jpg",
      "filename": "profile6.jpg"
    }
  }
}
```

## 4. PATCH /admin/reports/:id - Update Report Status

### Request

```json
PATCH /admin/reports/clp123abc456def789
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "RESOLVED",
  "adminNotes": "Contacted both users. Issue resolved through mediation. Warning issued to reported user."
}
```

### Response

```json
{
  "id": "clp123abc456def789",
  "reporterId": "user_456",
  "reportedId": "user_789",
  "reason": "INAPPROPRIATE_BEHAVIOR",
  "description": "User was using offensive language during the match and made inappropriate comments.",
  "status": "RESOLVED",
  "adminNotes": "Contacted both users. Issue resolved through mediation. Warning issued to reported user.",
  "resolvedBy": "admin_001",
  "resolvedAt": "2025-01-12T11:30:00.000Z",
  "createdAt": "2025-01-10T14:30:00.000Z",
  "updatedAt": "2025-01-12T11:30:00.000Z",
  "reporter": {
    "id": "user_456",
    "name": "John Smith",
    "email": "john.smith@example.com",
    "profileImage": {
      "id": "img_123",
      "url": "https://example.com/profile1.jpg",
      "filename": "profile1.jpg"
    }
  },
  "reported": {
    "id": "user_789",
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "profileImage": {
      "id": "img_456",
      "url": "https://example.com/profile2.jpg",
      "filename": "profile2.jpg"
    }
  }
}
```

## 5. DELETE /admin/reports/:id - Delete Report

### Request

```
DELETE /admin/reports/clp123abc456def789
Authorization: Bearer <admin_token>
```

### Response

```json
{
  "message": "Report deleted successfully"
}
```

## Error Responses

### 400 Bad Request - Invalid Query Parameters

```json
{
  "error": {
    "formErrors": [],
    "fieldErrors": {
      "status": [
        "Invalid enum value. Expected 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED', received 'INVALID_STATUS'"
      ]
    }
  }
}
```

### 401 Unauthorized - Missing or Invalid Token

```json
{
  "error": "Access denied. No token provided."
}
```

### 403 Forbidden - Insufficient Permissions

```json
{
  "error": "Access denied. Insufficient permissions."
}
```

### 404 Not Found - Report Not Found

```json
{
  "error": "Report not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal server error"
}
```

## Query Parameters for GET /admin/reports

- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of reports per page (default: 10)
- `status` (optional): Filter by status (`PENDING`, `UNDER_REVIEW`, `RESOLVED`, `DISMISSED`)
- `reason` (optional): Filter by reason (`INAPPROPRIATE_BEHAVIOR`, `HARASSMENT`, `CHEATING`, `NO_SHOW`, `FAKE_PROFILE`, `SPAM`, `OTHER`)
- `reporterId` (optional): Filter by reporter user ID
- `reportedId` (optional): Filter by reported user ID
- `sortBy` (optional): Sort field (`createdAt`, `status`) (default: `createdAt`)
- `sortOrder` (optional): Sort order (`asc`, `desc`) (default: `desc`)

## Report Reasons

- `INAPPROPRIATE_BEHAVIOR`: General inappropriate conduct
- `HARASSMENT`: Harassment or bullying behavior
- `CHEATING`: Suspected cheating in games
- `NO_SHOW`: Not showing up for scheduled matches
- `FAKE_PROFILE`: Using fake profile information
- `SPAM`: Spamming messages or content
- `OTHER`: Other issues not covered above

## Report Statuses

- `PENDING`: New report waiting for review
- `UNDER_REVIEW`: Report is being investigated
- `RESOLVED`: Report has been resolved
- `DISMISSED`: Report was reviewed and dismissed
