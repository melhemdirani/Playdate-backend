# Admin Dashboard Route Documentation

## Route

`GET /admin/dashboard`

## Description

Returns key statistics for admins:

- Total users
- Total matches
- Total revenue
- Pending reports
- Current active matches
- New users this month

## Example Response

```json
{
  "totalUsers": 1234,
  "totalMatches": 567,
  "totalRevenue": 8901.23,
  "pendingReports": 12,
  "activeMatches": 5,
  "newUsersThisMonth": 34
}
```

## Implementation

- Logic and handler are in `src/modules/admin/adminDashboard.ts`
- Register the route in `src/modules/admin/adminRoutes.ts`:
  ```js
  import { getAdminDashboardStatsHandler } from "./adminDashboard";
  router.get(
    "/dashboard",
    auth,
    isAuthorized("ADMIN"),
    getAdminDashboardStatsHandler
  );
  ```

## Notes

- Only accessible to authenticated admins.
- Data is fetched live from the database.
