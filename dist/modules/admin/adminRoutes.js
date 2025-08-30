"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("./adminController");
const middleware_1 = require("../../middleware");
const usersSchema_1 = require("../user/usersSchema");
const adminSchema_1 = require("./adminSchema");
const adminDashboard_1 = require("./adminDashboard");
const usersController_1 = require("../user/usersController");
const router = (0, express_1.Router)();
// Legacy user management routes (keeping for compatibility)
router.get("/users'", adminController_1.getFilteredUsersHandler);
router.post("/users/accept/:id", adminController_1.acceptUserSignupHandler);
router.post("/users/reject/:id", adminController_1.rejectUserSignupHandler);
router
    .route("/approve-users/:id")
    .get(middleware_1.auth, (0, middleware_1.isAuthorized)("ADMIN"), adminController_1.approveUserHandler)
    .delete(middleware_1.auth, (0, middleware_1.isAuthorized)("ADMIN"), adminController_1.disApproveUserHandler);
router
    .route("/admins")
    .post(middleware_1.auth, (0, middleware_1.isAuthorized)("ADMIN"), (0, middleware_1.validateRequest)(usersSchema_1.createUserSchema, "body"), usersController_1.registerAdminUserHandler)
    .get(
// auth,
// isAuthorized("ADMIN"),
(0, middleware_1.validateRequest)(usersSchema_1.getFilteredUsersSchema, "query"), adminController_1.getFilteredUsersHandler);
// NEW ADMIN ROUTES
// Admin route to get all match requests
router.get("/match-requests", middleware_1.auth, (0, middleware_1.isAuthorized)("ADMIN"), (0, middleware_1.validateRequest)(adminSchema_1.getMatchRequestsQuerySchema, "query"), adminController_1.getMatchRequestsHandler);
// Match Request Management Routes
const adminSchema_2 = require("./adminSchema");
router
    .route("/match-requests/:id/approve")
    .post(middleware_1.auth, (0, middleware_1.isAuthorized)("ADMIN"), (0, middleware_1.validateRequest)(adminSchema_2.approveMatchRequestSchema, "params"), adminController_1.approveMatchRequestHandler);
router
    .route("/match-requests/:id/edit")
    .patch(middleware_1.auth, (0, middleware_1.isAuthorized)("ADMIN"), (0, middleware_1.validateRequest)(adminSchema_2.editMatchRequestSchema, "body"), adminController_1.editMatchRequestHandler);
router.route("/match-requests/:id/decline").post(middleware_1.auth, (0, middleware_1.isAuthorized)("ADMIN"), 
// validateRequest(declineMatchRequestSchema, "body"),
adminController_1.declineMatchRequestHandler);
// User Management Routes
router
    .route("/users/all")
    .get(middleware_1.auth, (0, middleware_1.isAuthorized)("ADMIN"), (0, middleware_1.validateRequest)(adminSchema_1.getUsersQuerySchema, "query"), adminController_1.getAllUsersHandler);
router
    .route("/users/:id")
    .get(middleware_1.auth, (0, middleware_1.isAuthorized)("ADMIN"), (0, middleware_1.validateRequest)(adminSchema_1.getUserByIdSchema, "params"), adminController_1.getUserByIdHandler)
    .patch(middleware_1.auth, (0, middleware_1.isAuthorized)("ADMIN"), (0, middleware_1.validateRequest)(adminSchema_1.updateUserSchema, "body"), adminController_1.updateUserByIdHandler)
    .delete(middleware_1.auth, (0, middleware_1.isAuthorized)("ADMIN"), adminController_1.deleteUserByIdHandler);
router
    .route("/users/:id/status")
    .patch(middleware_1.auth, (0, middleware_1.isAuthorized)("ADMIN"), (0, middleware_1.validateRequest)(adminSchema_1.updateUserStatusSchema, "body"), adminController_1.updateUserStatusHandler);
// Match Management Routes
router
    .route("/matches")
    .get(middleware_1.auth, (0, middleware_1.isAuthorized)("ADMIN"), (0, middleware_1.validateRequest)(adminSchema_1.getMatchesQuerySchema, "query"), adminController_1.getAllMatchesHandler)
    .post(middleware_1.auth, (0, middleware_1.isAuthorized)("ADMIN"), (0, middleware_1.validateRequest)(adminSchema_1.createAdminMatchSchema, "body"), adminController_1.createAdminMatchHandler);
router
    .route("/matches/:id")
    .get(middleware_1.auth, (0, middleware_1.isAuthorized)("ADMIN"), adminController_1.getMatchByIdHandler)
    .patch(middleware_1.auth, (0, middleware_1.isAuthorized)("ADMIN"), (0, middleware_1.validateRequest)(adminSchema_1.updateMatchSchema, "body"), adminController_1.updateMatchByIdHandler)
    .delete(middleware_1.auth, (0, middleware_1.isAuthorized)("ADMIN"), adminController_1.deleteMatchByIdHandler);
// Game Management Routes
router
    .route("/games")
    .get(middleware_1.auth, (0, middleware_1.isAuthorized)("ADMIN"), adminController_1.getAllGamesHandler)
    .post(middleware_1.auth, (0, middleware_1.isAuthorized)("ADMIN"), (0, middleware_1.validateRequest)(adminSchema_1.createGameSchema, "body"), adminController_1.createGameHandler);
router
    .route("/games/:id")
    .get(middleware_1.auth, (0, middleware_1.isAuthorized)("ADMIN"), adminController_1.getGameByIdHandler)
    .patch(middleware_1.auth, (0, middleware_1.isAuthorized)("ADMIN"), (0, middleware_1.validateRequest)(adminSchema_1.updateGameSchema, "body"), adminController_1.updateGameByIdHandler)
    .delete(middleware_1.auth, (0, middleware_1.isAuthorized)("ADMIN"), adminController_1.deleteGameByIdHandler);
// Report Management Routes
router
    .route("/reports")
    .get(middleware_1.auth, (0, middleware_1.isAuthorized)("ADMIN"), (0, middleware_1.validateRequest)(adminSchema_1.getReportsQuerySchema, "query"), adminController_1.getAllReportsHandler)
    .post(middleware_1.auth, (0, middleware_1.isAuthorized)("ADMIN"), (0, middleware_1.validateRequest)(adminSchema_1.createUserReportSchema, "body"), adminController_1.createUserReportHandler);
router
    .route("/reports/:id")
    .get(middleware_1.auth, (0, middleware_1.isAuthorized)("ADMIN"), adminController_1.getReportByIdHandler)
    .patch(middleware_1.auth, (0, middleware_1.isAuthorized)("ADMIN"), (0, middleware_1.validateRequest)(adminSchema_1.updateReportSchema, "body"), adminController_1.updateReportByIdHandler)
    .delete(middleware_1.auth, (0, middleware_1.isAuthorized)("ADMIN"), adminController_1.deleteReportByIdHandler);
// Payment Analytics Routes
router
    .route("/payments/analytics")
    .get(middleware_1.auth, (0, middleware_1.isAuthorized)("ADMIN"), (0, middleware_1.validateRequest)(adminSchema_1.getPaymentAnalyticsSchema, "query"), adminController_1.getPaymentAnalyticsHandler);
router
    .route("/payments")
    .get(middleware_1.auth, (0, middleware_1.isAuthorized)("ADMIN"), (0, middleware_1.validateRequest)(adminSchema_1.getPaymentsQuerySchema, "query"), adminController_1.getAllPaymentsHandler);
// Individual Payment & Refund Routes
router
    .route("/payments/:id")
    .get(middleware_1.auth, (0, middleware_1.isAuthorized)("ADMIN"), adminController_1.getPaymentByIdHandler);
router
    .route("/payments/:id/refund")
    .post(middleware_1.auth, (0, middleware_1.isAuthorized)("ADMIN"), (0, middleware_1.validateRequest)(adminSchema_1.createRefundSchema, "body"), adminController_1.createRefundHandler);
// Refunds Overview Route
router
    .route("/refunds")
    .get(middleware_1.auth, (0, middleware_1.isAuthorized)("ADMIN"), (0, middleware_1.validateRequest)(adminSchema_1.getRefundsQuerySchema, "query"), adminController_1.getAllRefundsHandler);
// Admin Dashboard Route
router.get("/dashboard", middleware_1.auth, (0, middleware_1.isAuthorized)("ADMIN"), adminDashboard_1.getAdminDashboardStatsHandler);
exports.default = router;
