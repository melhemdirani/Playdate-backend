"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Expo push token update
const usersController_1 = require("./usersController");
const usersController_2 = require("./usersController");
const express_1 = require("express");
const middleware_1 = require("../../middleware");
const usersController_3 = require("./usersController");
const usersSchema_1 = require("./usersSchema");
const usersController_4 = require("./usersController");
const adminController_1 = require("../admin/adminController");
const router = (0, express_1.Router)();
router
    .route("/")
    .get(adminController_1.getFilteredUsersHandler)
    .post((0, middleware_1.validateRequest)(usersSchema_1.createUserSchema, "body"), usersController_4.registerUserHandler)
    .patch(middleware_1.auth, (0, middleware_1.validateRequest)(usersSchema_1.updateUserSchema, "body"), usersController_4.updateUserHandler);
router
    .route("/login")
    .post((0, middleware_1.validateRequest)(usersSchema_1.loginUserSchema, "body"), usersController_4.loginUserHandler);
router.route("/refreshToken").post(usersController_4.refreshTokenHandler);
router.route("/get-info").get(middleware_1.auth, usersController_4.getInfoUserHandler);
router.route("/send-otp").post(usersController_4.sendOtpHandler);
router.route("/apply-otp").post(usersController_4.applyOtpHandler);
router
    .route("/check-phone")
    .post((0, middleware_1.validateRequest)(usersSchema_1.checkPhoneSchema, "body"), usersController_4.checkPhoneHandler);
router
    .route("/check-email")
    .post((0, middleware_1.validateRequest)(usersSchema_1.checkEmailSchema, "body"), usersController_4.checkEmailHandler);
router
    .route("/forgot-password")
    .post((0, middleware_1.validateRequest)(usersSchema_1.forgetPasswordSchema, "body"), usersController_4.forgotPasswordHandler);
router
    .route("/reset-password")
    .post((0, middleware_1.validateRequest)(usersSchema_1.resetPasswordByTokenSchema, "body"), usersController_4.resetPasswordByTokenHandler);
router.route("/delete").delete(middleware_1.auth, usersController_4.deleteUserHandler);
router.route("/deactivate").patch(middleware_1.auth, usersController_4.deactivateUserHandler);
router.route("/reactivate").patch(middleware_1.auth, usersController_4.reactivateUserHandler);
router.route("/pinned-matches").get(middleware_1.auth, usersController_4.getUserPinnedMatchesHandler);
router.route("/pin-match").post(middleware_1.auth, usersController_4.pinMatchHandler);
router.route("/unpin-match").post(middleware_1.auth, usersController_4.unpinMatchHandler);
router.get("/switch-team/:matchId", middleware_1.auth, usersController_3.switchTeamHandler);
// Notifications route
router
    .route("/notifications/mark-all")
    .patch(middleware_1.auth, usersController_4.markAllNotificationsAsSeenHandler);
router.post("/expo-push-token", usersController_1.updateExpoPushTokenHandler);
// Payment routes
router.route("/payments").get(middleware_1.auth, usersController_4.getUserPaymentsHandler);
router.route("/payments/:paymentId").get(middleware_1.auth, usersController_4.getUserPaymentByIdHandler);
router
    .route("/:id")
    .get(middleware_1.auth, (0, middleware_1.validateRequest)(usersSchema_1.getUserByIdSchema, "params"), usersController_4.getUserPublicInfoHandler);
router.post("/auth/facebook/register", (0, middleware_1.validateRequest)(usersController_2.facebookRegisterSchema, "body"), usersController_2.facebookRegisterHandler);
router.post("/auth/facebook/login", (0, middleware_1.validateRequest)(usersController_2.facebookLoginSchema, "body"), usersController_2.facebookLoginHandler);
exports.default = router;
