import { Router } from "express";
import {
  acceptUserSignupHandler,
  approveUserHandler,
  disApproveUserHandler,
  getFilteredUsersHandler,
  rejectUserSignupHandler,
  // New admin handlers
  getAllUsersHandler,
  getUserByIdHandler,
  updateUserByIdHandler,
  updateUserStatusHandler,
  deleteUserByIdHandler,
  getAllMatchesHandler,
  getMatchByIdHandler,
  updateMatchByIdHandler,
  deleteMatchByIdHandler,
  getAllGamesHandler,
  getGameByIdHandler,
  createGameHandler,
  updateGameByIdHandler,
  deleteGameByIdHandler,
  getAllReportsHandler,
  getReportByIdHandler,
  updateReportByIdHandler,
  createUserReportHandler,
  deleteReportByIdHandler,
  getPaymentAnalyticsHandler,
  getAllPaymentsHandler,
  getPaymentByIdHandler,
  createRefundHandler,
  getAllRefundsHandler,
  approveMatchRequestHandler,
  editMatchRequestHandler,
  declineMatchRequestHandler,
  getMatchRequestsHandler,
  createAdminMatchHandler,
} from "./adminController";

import { auth, isAuthorized, validateRequest } from "../../middleware";
import { createUserSchema, getFilteredUsersSchema } from "../user/usersSchema";
import {
  getUsersQuerySchema,
  getUserByIdSchema,
  updateUserSchema,
  updateUserStatusSchema,
  getMatchesQuerySchema,
  getMatchRequestsQuerySchema,
  updateMatchSchema,
  createAdminMatchSchema,
  createGameSchema,
  updateGameSchema,
  getReportsQuerySchema,
  updateReportSchema,
  createUserReportSchema,
  getPaymentAnalyticsSchema,
  getPaymentsQuerySchema,
  createRefundSchema,
  getRefundsQuerySchema,
} from "./adminSchema";
import { getAdminDashboardStatsHandler } from "./adminDashboard";
import { registerAdminUserHandler } from "../user/usersController";

const router = Router();

// Legacy user management routes (keeping for compatibility)
router.get("/users'", getFilteredUsersHandler);
router.post("/users/accept/:id", acceptUserSignupHandler);
router.post("/users/reject/:id", rejectUserSignupHandler);

router
  .route("/approve-users/:id")
  .get(auth, isAuthorized("ADMIN"), approveUserHandler)
  .delete(auth, isAuthorized("ADMIN"), disApproveUserHandler);

router
  .route("/admins")
  .post(
    auth,
    isAuthorized("ADMIN"),
    validateRequest(createUserSchema, "body"),
    registerAdminUserHandler
  )
  .get(
    // auth,
    // isAuthorized("ADMIN"),
    validateRequest(getFilteredUsersSchema, "query"),
    getFilteredUsersHandler
  );

// NEW ADMIN ROUTES
// Admin route to get all match requests
router.get(
  "/match-requests",
  auth,
  isAuthorized("ADMIN"),
  validateRequest(getMatchRequestsQuerySchema, "query"),
  getMatchRequestsHandler
);
// Match Request Management Routes
import {
  approveMatchRequestSchema,
  editMatchRequestSchema,
  declineMatchRequestSchema,
} from "./adminSchema";

router
  .route("/match-requests/:id/approve")
  .post(
    auth,
    isAuthorized("ADMIN"),
    validateRequest(approveMatchRequestSchema, "params"),
    approveMatchRequestHandler
  );

router
  .route("/match-requests/:id/edit")
  .patch(
    auth,
    isAuthorized("ADMIN"),
    validateRequest(editMatchRequestSchema, "body"),
    editMatchRequestHandler
  );

router.route("/match-requests/:id/decline").post(
  auth,
  isAuthorized("ADMIN"),
  // validateRequest(declineMatchRequestSchema, "body"),
  declineMatchRequestHandler
);

// User Management Routes
router
  .route("/users/all")
  .get(
    auth,
    isAuthorized("ADMIN"),
    validateRequest(getUsersQuerySchema, "query"),
    getAllUsersHandler
  );

router
  .route("/users/:id")
  .get(
    auth,
    isAuthorized("ADMIN"),
    validateRequest(getUserByIdSchema, "params"),
    getUserByIdHandler
  )
  .patch(
    auth,
    isAuthorized("ADMIN"),
    validateRequest(updateUserSchema, "body"),
    updateUserByIdHandler
  )
  .delete(auth, isAuthorized("ADMIN"), deleteUserByIdHandler);

router
  .route("/users/:id/status")
  .patch(
    auth,
    isAuthorized("ADMIN"),
    validateRequest(updateUserStatusSchema, "body"),
    updateUserStatusHandler
  );

// Match Management Routes
router
  .route("/matches")
  .get(
    auth,
    isAuthorized("ADMIN"),
    validateRequest(getMatchesQuerySchema, "query"),
    getAllMatchesHandler
  )
  .post(
    auth,
    isAuthorized("ADMIN"),
    validateRequest(createAdminMatchSchema, "body"),
    createAdminMatchHandler
  );

router
  .route("/matches/:id")
  .get(auth, isAuthorized("ADMIN"), getMatchByIdHandler)
  .patch(
    auth,
    isAuthorized("ADMIN"),
    validateRequest(updateMatchSchema, "body"),
    updateMatchByIdHandler
  )
  .delete(auth, isAuthorized("ADMIN"), deleteMatchByIdHandler);

// Game Management Routes
router
  .route("/games")
  .get(auth, isAuthorized("ADMIN"), getAllGamesHandler)
  .post(
    auth,
    isAuthorized("ADMIN"),
    validateRequest(createGameSchema, "body"),
    createGameHandler
  );

router
  .route("/games/:id")
  .get(auth, isAuthorized("ADMIN"), getGameByIdHandler)
  .patch(
    auth,
    isAuthorized("ADMIN"),
    validateRequest(updateGameSchema, "body"),
    updateGameByIdHandler
  )
  .delete(auth, isAuthorized("ADMIN"), deleteGameByIdHandler);

// Report Management Routes
router
  .route("/reports")
  .get(
    auth,
    isAuthorized("ADMIN"),
    validateRequest(getReportsQuerySchema, "query"),
    getAllReportsHandler
  )
  .post(
    auth,
    isAuthorized("ADMIN"),
    validateRequest(createUserReportSchema, "body"),
    createUserReportHandler
  );

router
  .route("/reports/:id")
  .get(auth, isAuthorized("ADMIN"), getReportByIdHandler)
  .patch(
    auth,
    isAuthorized("ADMIN"),
    validateRequest(updateReportSchema, "body"),
    updateReportByIdHandler
  )
  .delete(auth, isAuthorized("ADMIN"), deleteReportByIdHandler);

// Payment Analytics Routes
router
  .route("/payments/analytics")
  .get(
    auth,
    isAuthorized("ADMIN"),
    validateRequest(getPaymentAnalyticsSchema, "query"),
    getPaymentAnalyticsHandler
  );

router
  .route("/payments")
  .get(
    auth,
    isAuthorized("ADMIN"),
    validateRequest(getPaymentsQuerySchema, "query"),
    getAllPaymentsHandler
  );

// Individual Payment & Refund Routes
router
  .route("/payments/:id")
  .get(auth, isAuthorized("ADMIN"), getPaymentByIdHandler);

router
  .route("/payments/:id/refund")
  .post(
    auth,
    isAuthorized("ADMIN"),
    validateRequest(createRefundSchema, "body"),
    createRefundHandler
  );

// Refunds Overview Route
router
  .route("/refunds")
  .get(
    auth,
    isAuthorized("ADMIN"),
    validateRequest(getRefundsQuerySchema, "query"),
    getAllRefundsHandler
  );

// Admin Dashboard Route
router.get(
  "/dashboard",
  auth,
  isAuthorized("ADMIN"),
  getAdminDashboardStatsHandler
);

export default router;
