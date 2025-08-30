"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateExpoPushTokenHandler = exports.getUserPaymentByIdHandler = exports.getUserPaymentsHandler = exports.markAllNotificationsAsSeenHandler = exports.getUserPublicInfoHandler = exports.resetPasswordByTokenHandler = exports.forgotPasswordHandler = exports.reactivateUserHandler = exports.deactivateUserHandler = exports.deleteUserHandler = exports.checkEmailHandler = exports.checkPhoneHandler = exports.applyOtpHandler = exports.sendOtpHandler = exports.registerAdminUserHandler = exports.getInfoUserHandler = exports.refreshTokenHandler = exports.loginUserHandler = exports.updateUserHandler = exports.registerUserHandler = exports.getUserPinnedMatchesHandler = exports.pinMatchHandler = exports.unpinMatchHandler = exports.switchTeamHandler = exports.facebookLoginHandler = exports.facebookRegisterHandler = exports.facebookLoginSchema = exports.facebookRegisterSchema = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const zod_1 = require("zod");
exports.facebookRegisterSchema = zod_1.z.object({
    token: zod_1.z.string({
        required_error: "Facebook token required",
        invalid_type_error: "Token must be a string",
    }),
});
exports.facebookLoginSchema = zod_1.z.object({
    token: zod_1.z.string({
        required_error: "Facebook token required",
        invalid_type_error: "Token must be a string",
    }),
});
const usersService_1 = require("./usersService");
async function facebookRegisterHandler(req, res) {
    const parsed = exports.facebookRegisterSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
    }
    const { token } = parsed.data;
    try {
        const { user, accessToken, refreshToken } = await (0, usersService_1.facebookRegisterService)(token);
        res.status(http_status_codes_1.StatusCodes.CREATED).json({ user, accessToken, refreshToken });
    }
    catch (error) {
        res.status(401).json({ error: error.message });
    }
}
exports.facebookRegisterHandler = facebookRegisterHandler;
async function facebookLoginHandler(req, res) {
    const parsed = exports.facebookLoginSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
    }
    const { token } = parsed.data;
    try {
        const { user, accessToken, refreshToken } = await (0, usersService_1.facebookLoginService)(token);
        res.status(http_status_codes_1.StatusCodes.OK).json({ user, accessToken, refreshToken });
    }
    catch (error) {
        res.status(401).json({ error: error.message });
    }
}
exports.facebookLoginHandler = facebookLoginHandler;
const usersService_2 = require("./usersService");
async function switchTeamHandler(req, res, next) {
    try {
        const userId = req.user.id;
        const matchId = req.params.matchId;
        const result = await (0, usersService_2.switchUserTeam)(userId, matchId);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
}
exports.switchTeamHandler = switchTeamHandler;
const usersService_3 = require("./usersService");
async function unpinMatchHandler(req, res, next) {
    try {
        const userId = req.user.id;
        const { matchId } = req.body;
        if (!matchId) {
            return res.status(400).json({ error: "matchId is required" });
        }
        const result = await (0, usersService_3.unpinMatchForUser)(userId, matchId);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
}
exports.unpinMatchHandler = unpinMatchHandler;
const usersService_4 = require("./usersService");
async function pinMatchHandler(req, res) {
    try {
        const userId = req.user.id;
        const { matchId } = req.body;
        if (!matchId) {
            throw new errors_1.BadRequestError("matchId is required");
        }
        const pinned = await (0, usersService_4.pinMatchForUser)(userId, matchId);
        res
            .status(http_status_codes_1.StatusCodes.OK)
            .json({ message: "Match pinned successfully", pinned });
    }
    catch (err) {
        res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: err.message });
    }
}
exports.pinMatchHandler = pinMatchHandler;
async function getUserPinnedMatchesHandler(req, res) {
    try {
        const userId = req.user.id;
        const matches = await (0, usersService_4.getUserPinnedMatches)(userId);
        res.status(http_status_codes_1.StatusCodes.OK).json({ matches });
    }
    catch (err) {
        res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: err.message });
    }
}
exports.getUserPinnedMatchesHandler = getUserPinnedMatchesHandler;
const http_status_codes_1 = require("http-status-codes");
const utils_1 = require("../../utils");
const usersService_5 = require("./usersService");
const errors_1 = require("../../errors");
const userActivities_1 = __importStar(require("../../middleware/userActivities"));
const authService_1 = require("./authService");
const usersService_6 = require("./usersService");
async function registerUserHandler(req, res) {
    try {
        const body = req.body;
        const user = await (0, usersService_5.createUser)(body);
        if (!user.email) {
            throw new Error("User email is missing");
        }
        const { accessToken, refreshToken } = await (0, utils_1.createTokenForUser)({
            id: user.id,
            email: user.email,
            role: user.role,
        });
        res
            .status(http_status_codes_1.StatusCodes.CREATED)
            .json({ ...user, accessToken, refreshToken });
        // logUserActivity(
        //   {
        //     activity: UserActivityType.PROFILE_CREATE,
        //     details: { ...req.body },
        //     ipAddress: req.ip,
        //   },
        //   user.id
        // );
    }
    catch (err) {
        console.error("Error:", err);
        (0, userActivities_1.default)({
            activity: userActivities_1.UserActivityType.PROFILE_CREATE_FAILED,
            details: req.body,
            errorMessage: (err === null || err === void 0 ? void 0 : err.message) || "",
            ipAddress: req.ip,
        }, "");
        if (err instanceof errors_1.NotFoundError) {
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({ error: err.message });
        }
        else if (err instanceof errors_1.UnAuthorizedError) {
            return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({ error: err.message });
        }
        else if (err instanceof errors_1.BadRequestError) {
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: err.message });
        }
        return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: err });
    }
}
exports.registerUserHandler = registerUserHandler;
async function updateUserHandler(req, res) {
    var _a;
    try {
        const userId = (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res
                .status(http_status_codes_1.StatusCodes.UNAUTHORIZED)
                .json({ error: "User not authorized" });
        }
        const body = req.body;
        const user = await (0, usersService_5.updateUser)(userId, body);
        if (!user.email) {
            throw new Error("User email is missing");
        }
        const { accessToken, refreshToken } = await (0, utils_1.createTokenForUser)({
            id: user.id,
            email: user.email,
            role: user.role,
        });
        res.status(http_status_codes_1.StatusCodes.OK).json({ ...user, accessToken, refreshToken });
        // logUserActivity(
        //   {
        //     activity: UserActivityType.PROFILE_UPDATE,
        //     details: req.body,
        //     ipAddress: req.ip,
        //   },
        //   user.id
        // );
    }
    catch (err) {
        console.error("Error:", err);
        // logUserActivity(
        //   {
        //     activity: UserActivityType.PROFILE_UPDATE_FAILED,
        //     details: req.body,
        //     errorMessage: err?.message || "",
        //     ipAddress: req.ip,
        //   },
        //   req.params.id || ""
        // );
        if (err instanceof errors_1.NotFoundError) {
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({ error: err.message });
        }
        else if (err instanceof errors_1.UnAuthorizedError) {
            return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({ error: err.message });
        }
        else if (err instanceof errors_1.BadRequestError) {
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: err.message });
        }
        return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: err });
    }
}
exports.updateUserHandler = updateUserHandler;
async function loginUserHandler(req, res) {
    const body = req.body;
    try {
        const user = await (0, usersService_5.loginUser)(body);
        if (user && user.email) {
            const { accessToken, refreshToken } = await (0, utils_1.createTokenForUser)({
                id: user.id,
                email: user.email,
                role: "ADMIN",
            });
            (0, userActivities_1.default)({
                activity: userActivities_1.UserActivityType.LOGIN_SUCCESS,
                details: body,
                ipAddress: req.ip,
            }, user.id);
            res.status(http_status_codes_1.StatusCodes.OK).json({
                user,
                accessToken,
                refreshToken,
            });
        }
        else {
            (0, userActivities_1.default)({
                activity: userActivities_1.UserActivityType.LOGIN_FAILURE,
                details: body,
                ipAddress: req.ip,
            }, "");
            // Handle the case where loginUser returns undefined (e.g., due to an error)
            res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ user });
        }
    }
    catch (error) {
        console.error("Error:", error);
        // Return the actual error message in the response
        (0, userActivities_1.default)({
            activity: userActivities_1.UserActivityType.LOGIN_FAILURE,
            details: body,
            ipAddress: req.ip,
            errorMessage: (error === null || error === void 0 ? void 0 : error.message) ? error === null || error === void 0 ? void 0 : error.message : "",
        }, "");
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json(error === null || error === void 0 ? void 0 : error.message);
    }
}
exports.loginUserHandler = loginUserHandler;
async function refreshTokenHandler(req, res) {
    const { refreshToken } = req.body;
    try {
        if (!refreshToken) {
            return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
                message: "Refresh token is required",
            });
        }
        const payload = (0, utils_1.verifyRefreshToken)(refreshToken);
        if (!payload) {
            return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
                message: "Invalid refresh token",
            });
        }
        const savedRefreshToken = await (0, authService_1.findRefreshTokenById)(payload.jti);
        if (!savedRefreshToken || savedRefreshToken.revoked) {
            return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
                message: "Invalid refresh token",
            });
        }
        const hashedToken = (0, utils_1.hashToken)(refreshToken);
        if (hashedToken !== savedRefreshToken.token) {
            return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
                message: "Invalid refresh token",
            });
        }
        const user = await prisma.user.findUnique({ where: { id: payload.id } });
        if (!user) {
            return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
                message: "User not found",
            });
        }
        //we can revoke the refresh token if we want to and generate a new one after nb of refreshes
        // await revokeRefreshToken(savedRefreshToken.id);
        // const { accessToken, refreshToken: newRefreshToken } =
        //   await createTokenForUser({
        //     id: user.id,
        //     email: user.email,
        //     role: user.role
        //   });
        if (!user.email) {
            // Handle missing email case
            return res
                .status(http_status_codes_1.StatusCodes.BAD_REQUEST)
                .json({ error: "User email is missing" });
        }
        const accessToken = (0, utils_1.generateAccessToken)({
            id: user.id,
            email: user.email,
            role: user.role,
        });
        return res
            .status(http_status_codes_1.StatusCodes.OK)
            .json({ accessToken, refreshToken: savedRefreshToken.token });
    }
    catch (err) {
        return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
            message: "Refresh token is required",
        });
    }
}
exports.refreshTokenHandler = refreshTokenHandler;
async function getInfoUserHandler(req, res) {
    const userId = req.user.id;
    try {
        const userInfo = await (0, usersService_5.getUserByInfo)(userId);
        if (userId && userInfo) {
            res.status(http_status_codes_1.StatusCodes.OK).json({
                ...userInfo,
            });
        }
        else {
            // Handle the case where loginUser returns undefined (e.g., due to an error)
            res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ message: "Bad req" });
        }
    }
    catch (error) {
        console.log("Error:", error);
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json(error === null || error === void 0 ? void 0 : error.message);
    }
}
exports.getInfoUserHandler = getInfoUserHandler;
async function registerAdminUserHandler(req, res) {
    // fix later
    if (req.user.role !== "ADMIN") {
        throw new errors_1.UnAuthorizedError("You are not authorized to access this route");
    }
    const body = req.body;
    const user = await (0, usersService_5.createUser)(body);
    res.status(http_status_codes_1.StatusCodes.CREATED).json({
        ...user,
    });
}
exports.registerAdminUserHandler = registerAdminUserHandler;
async function sendOtpHandler(req, res) {
    const { phoneNumber } = req.body;
    try {
        // Validate UAE phone number format (e.g. +9715XXXXXXXX)
        if (typeof phoneNumber !== "string" || !/^\+9715\d{8}$/.test(phoneNumber)) {
            throw new errors_1.BadRequestError("Invalid UAE phone number format.");
        }
        // Delegate to service (which handles DB updates + mock sending)
        await (0, usersService_5.sendPhoneOtp)({ phoneNumber });
        return res.status(http_status_codes_1.StatusCodes.OK).json({
            message: "OTP sent successfully.",
        });
    }
    catch (err) {
        return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
            error: (err === null || err === void 0 ? void 0 : err.message) || "Failed to send OTP.",
        });
    }
}
exports.sendOtpHandler = sendOtpHandler;
async function applyOtpHandler(req, res) {
    const { phoneNumber, otp } = req.body;
    console.log("applyOtpHandler", { phoneNumber, otp });
    try {
        // Validate inputs
        if (typeof phoneNumber !== "string" || !/^\+9715\d{8}$/.test(phoneNumber)) {
            throw new errors_1.BadRequestError("Invalid UAE phone number format.");
        }
        if (typeof otp !== "string" || otp.length !== 4 || !/^\d{4}$/.test(otp)) {
            throw new errors_1.BadRequestError("Invalid OTP format. Must be 4 digits.");
        }
        // Delegate to service to apply OTP logic
        await (0, usersService_5.applyPhoneOtp)({ phoneNumber, otp });
        return res.status(http_status_codes_1.StatusCodes.OK).json({
            message: "OTP verified successfully.",
        });
    }
    catch (err) {
        return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
            error: (err === null || err === void 0 ? void 0 : err.message) || "Failed to verify OTP.",
        });
    }
}
exports.applyOtpHandler = applyOtpHandler;
async function checkPhoneHandler(req, res) {
    try {
        const body = req.body;
        const result = await (0, usersService_5.checkPhoneNumber)(body);
        res.status(http_status_codes_1.StatusCodes.OK).json(result);
    }
    catch (err) {
        return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: err.message });
    }
}
exports.checkPhoneHandler = checkPhoneHandler;
async function checkEmailHandler(req, res) {
    try {
        const body = req.body;
        const result = await (0, usersService_5.checkEmail)(body);
        res.status(http_status_codes_1.StatusCodes.OK).json(result);
    }
    catch (err) {
        return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: err.message });
    }
}
exports.checkEmailHandler = checkEmailHandler;
async function deleteUserHandler(req, res) {
    const userId = req.user.id;
    try {
        await (0, usersService_6.deleteUser)(userId);
        res.status(http_status_codes_1.StatusCodes.OK).json({ message: "User deleted successfully" });
    }
    catch (err) {
        return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: err.message });
    }
}
exports.deleteUserHandler = deleteUserHandler;
async function deactivateUserHandler(req, res) {
    const userId = req.user.id;
    try {
        await (0, usersService_6.deactivateUser)(userId);
        res
            .status(http_status_codes_1.StatusCodes.OK)
            .json({ message: "User deactivated successfully" });
    }
    catch (err) {
        return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: err.message });
    }
}
exports.deactivateUserHandler = deactivateUserHandler;
async function reactivateUserHandler(req, res) {
    const userId = req.user.id;
    try {
        await (0, usersService_6.reactivateUser)(userId);
        res
            .status(http_status_codes_1.StatusCodes.OK)
            .json({ message: "User reactivated successfully" });
    }
    catch (err) {
        return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: err.message });
    }
}
exports.reactivateUserHandler = reactivateUserHandler;
async function forgotPasswordHandler(req, res) {
    const { email } = req.body;
    try {
        await (0, authService_1.forgotPassword)(email);
        res
            .status(http_status_codes_1.StatusCodes.OK)
            .json({ message: "Password reset email sent successfully" });
    }
    catch (err) {
        return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: err.message });
    }
}
exports.forgotPasswordHandler = forgotPasswordHandler;
async function resetPasswordByTokenHandler(req, res) {
    const body = req.body;
    try {
        await (0, authService_1.resetPasswordByToken)(body);
        res
            .status(http_status_codes_1.StatusCodes.OK)
            .json({ message: "Password has been reset successfully" });
    }
    catch (err) {
        return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: err.message });
    }
}
exports.resetPasswordByTokenHandler = resetPasswordByTokenHandler;
async function getUserPublicInfoHandler(req, res) {
    const { id } = req.params;
    try {
        const userInfo = await (0, usersService_6.getUserPublicInfo)(id);
        res.status(http_status_codes_1.StatusCodes.OK).json(userInfo);
    }
    catch (err) {
        if (err instanceof errors_1.NotFoundError) {
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({ error: err.message });
        }
        return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: err.message });
    }
}
exports.getUserPublicInfoHandler = getUserPublicInfoHandler;
async function markAllNotificationsAsSeenHandler(req, res) {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res
                .status(http_status_codes_1.StatusCodes.UNAUTHORIZED)
                .json({ error: "User not authenticated" });
        }
        const result = await (0, usersService_5.markAllNotificationsAsSeen)(userId);
        res.status(http_status_codes_1.StatusCodes.OK).json(result);
    }
    catch (err) {
        console.error("Error marking notifications as seen:", err);
        return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: err.message });
    }
}
exports.markAllNotificationsAsSeenHandler = markAllNotificationsAsSeenHandler;
async function getUserPaymentsHandler(req, res) {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res
                .status(http_status_codes_1.StatusCodes.UNAUTHORIZED)
                .json({ error: "User not authenticated" });
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const payments = await (0, usersService_5.getUserPayments)(userId, page, limit);
        res.status(http_status_codes_1.StatusCodes.OK).json(payments);
    }
    catch (err) {
        console.error("Error fetching user payments:", err);
        return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: err.message });
    }
}
exports.getUserPaymentsHandler = getUserPaymentsHandler;
async function getUserPaymentByIdHandler(req, res) {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res
                .status(http_status_codes_1.StatusCodes.UNAUTHORIZED)
                .json({ error: "User not authenticated" });
        }
        const { paymentId } = req.params;
        const payment = await (0, usersService_5.getUserPaymentById)(userId, paymentId);
        res.status(http_status_codes_1.StatusCodes.OK).json(payment);
    }
    catch (err) {
        console.error("Error fetching payment details:", err);
        if (err instanceof errors_1.NotFoundError) {
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({ error: err.message });
        }
        return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: err.message });
    }
}
exports.getUserPaymentByIdHandler = getUserPaymentByIdHandler;
async function updateExpoPushTokenHandler(req, res) {
    const { userId, expoPushToken } = req.body;
    if (!userId || !expoPushToken) {
        return res.status(400).json({ error: "userId and expoPushToken required" });
    }
    try {
        await prisma.user.update({
            where: { id: userId },
            data: { expoPushToken },
        });
        return res.status(200).json({ success: true });
    }
    catch (error) {
        return res.status(500).json({ error: "Failed to update Expo push token" });
    }
}
exports.updateExpoPushTokenHandler = updateExpoPushTokenHandler;
