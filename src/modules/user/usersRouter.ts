// Expo push token update
import { updateExpoPushTokenHandler } from "./usersController";

import {
  facebookRegisterHandler,
  facebookLoginHandler,
  facebookRegisterSchema,
  facebookLoginSchema,
} from "./usersController";
import { Router } from "express";
import { validateRequest, auth, isAuthorized } from "../../middleware";
import { switchTeamHandler } from "./usersController";

import {
  checkEmailSchema,
  checkPhoneSchema,
  createUserSchema,
  forgetPasswordSchema,
  loginUserSchema,
  resetPasswordByTokenSchema,
  updateUserSchema,
  getUserByIdSchema,
} from "./usersSchema";

import {
  applyOtpHandler,
  checkEmailHandler,
  checkPhoneHandler,
  getInfoUserHandler,
  loginUserHandler,
  refreshTokenHandler,
  registerUserHandler,
  pinMatchHandler,
  getUserPinnedMatchesHandler,
  unpinMatchHandler,
  sendOtpHandler,
  updateUserHandler,
  deleteUserHandler,
  deactivateUserHandler,
  reactivateUserHandler,
  forgotPasswordHandler,
  resetPasswordByTokenHandler,
  getUserPublicInfoHandler,
  markAllNotificationsAsSeenHandler,
  getUserPaymentsHandler,
  getUserPaymentByIdHandler,
} from "./usersController";
import { getFilteredUsersHandler } from "../admin/adminController";

const router = Router();
router
  .route("/")
  .get(getFilteredUsersHandler)
  .post(validateRequest(createUserSchema, "body"), registerUserHandler)
  .patch(auth, validateRequest(updateUserSchema, "body"), updateUserHandler);
router
  .route("/login")
  .post(validateRequest(loginUserSchema, "body"), loginUserHandler);

router.route("/refreshToken").post(refreshTokenHandler);
router.route("/get-info").get(auth, getInfoUserHandler);
router.route("/send-otp").post(sendOtpHandler);
router.route("/apply-otp").post(applyOtpHandler);
router
  .route("/check-phone")
  .post(validateRequest(checkPhoneSchema, "body"), checkPhoneHandler);
router
  .route("/check-email")
  .post(validateRequest(checkEmailSchema, "body"), checkEmailHandler);

router
  .route("/forgot-password")
  .post(validateRequest(forgetPasswordSchema, "body"), forgotPasswordHandler);
router
  .route("/reset-password")
  .post(
    validateRequest(resetPasswordByTokenSchema, "body"),
    resetPasswordByTokenHandler
  );

router.route("/delete").delete(auth, deleteUserHandler);
router.route("/deactivate").patch(auth, deactivateUserHandler);
router.route("/reactivate").patch(auth, reactivateUserHandler);

router.route("/pinned-matches").get(auth, getUserPinnedMatchesHandler);
router.route("/pin-match").post(auth, pinMatchHandler);
router.route("/unpin-match").post(auth, unpinMatchHandler);
router.get("/switch-team/:matchId", auth, switchTeamHandler);

// Notifications route
router
  .route("/notifications/mark-all")
  .patch(auth, markAllNotificationsAsSeenHandler);
router.post("/expo-push-token", updateExpoPushTokenHandler);

// Payment routes
router.route("/payments").get(auth, getUserPaymentsHandler);

router.route("/payments/:paymentId").get(auth, getUserPaymentByIdHandler);

router
  .route("/:id")
  .get(
    auth,
    validateRequest(getUserByIdSchema, "params"),
    getUserPublicInfoHandler
  );
router.post(
  "/auth/facebook/register",
  validateRequest(facebookRegisterSchema, "body"),
  facebookRegisterHandler
);
router.post(
  "/auth/facebook/login",
  validateRequest(facebookLoginSchema, "body"),
  facebookLoginHandler
);

export default router;
