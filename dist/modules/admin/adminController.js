"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllRefundsHandler = exports.createRefundHandler = exports.getPaymentByIdHandler = exports.getAllPaymentsHandler = exports.getPaymentAnalyticsHandler = exports.deleteReportByIdHandler = exports.createUserReportHandler = exports.updateReportByIdHandler = exports.getReportByIdHandler = exports.getAllReportsHandler = exports.deleteGameByIdHandler = exports.updateGameByIdHandler = exports.createGameHandler = exports.getGameByIdHandler = exports.getAllGamesHandler = exports.deleteMatchByIdHandler = exports.updateMatchByIdHandler = exports.getMatchByIdHandler = exports.getAllMatchesHandler = exports.deleteUserByIdHandler = exports.updateUserStatusHandler = exports.updateUserByIdHandler = exports.getUserByIdHandler = exports.getAllUsersHandler = exports.disApproveUserHandler = exports.approveUserHandler = exports.getFilteredUsersHandler = exports.rejectUserSignupHandler = exports.acceptUserSignupHandler = exports.createAdminMatchHandler = exports.declineMatchRequestHandler = exports.editMatchRequestHandler = exports.approveMatchRequestHandler = exports.getMatchRequestsHandler = void 0;
const getMatchRequestsHandler = async (req, res) => {
    try {
        console.log("getMatchRequestsHandler called with query:", req.query);
        const parsed = adminSchema_1.getMatchRequestsQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            console.log("Validation failed:", parsed.error.flatten());
            return res
                .status(http_status_codes_1.StatusCodes.BAD_REQUEST)
                .json({ error: parsed.error.flatten() });
        }
        console.log("Parsed data:", parsed.data);
        const result = await (0, adminService_2.getAllMatchRequests)(parsed.data);
        console.log("getAllMatchRequests result:", result);
        res.status(http_status_codes_1.StatusCodes.OK).json(result);
    }
    catch (error) {
        console.error("Error in getMatchRequestsHandler:", error);
        res
            .status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ error: "Internal server error" });
    }
};
exports.getMatchRequestsHandler = getMatchRequestsHandler;
const adminService_1 = require("./adminService");
async function approveMatchRequestHandler(req, res, next) {
    try {
        const { id, ...rest } = req.body;
        const result = await (0, adminService_1.approveMatchRequest)(id, rest);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
}
exports.approveMatchRequestHandler = approveMatchRequestHandler;
async function editMatchRequestHandler(req, res, next) {
    try {
        const { id, ...updateData } = req.body;
        const result = await (0, adminService_1.editMatchRequest)(id, updateData);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
}
exports.editMatchRequestHandler = editMatchRequestHandler;
async function declineMatchRequestHandler(req, res, next) {
    try {
        const { id } = req.params;
        const result = await (0, adminService_1.declineMatchRequest)(id);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
}
exports.declineMatchRequestHandler = declineMatchRequestHandler;
async function createAdminMatchHandler(req, res, next) {
    var _a;
    try {
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!adminId) {
            return res.status(401).json({ error: "Admin ID not found in request" });
        }
        console.log("Admin ID:", adminId);
        console.log("Request body:", req.body);
        const result = await (0, adminService_1.createAdminMatch)(adminId, req.body);
        res.status(201).json(result);
    }
    catch (error) {
        console.error("Error in createAdminMatchHandler:", error);
        next(error);
    }
}
exports.createAdminMatchHandler = createAdminMatchHandler;
const adminService_2 = require("./adminService");
const adminSchema_1 = require("./adminSchema");
const usersSchema_1 = require("../user/usersSchema");
const http_status_codes_1 = require("http-status-codes");
const errors_1 = require("../../errors");
async function acceptUserSignupHandler(req, res) {
    const { userId } = req.params;
    try {
        const result = await (0, adminService_2.acceptUserSignup)(userId);
        res.status(200).json({ message: "User signup accepted", result });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}
exports.acceptUserSignupHandler = acceptUserSignupHandler;
async function rejectUserSignupHandler(req, res) {
    const { userId } = req.params;
    try {
        const result = await (0, adminService_2.rejectUserSignup)(userId);
        res.status(200).json({ message: "User signup rejected", result });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}
exports.rejectUserSignupHandler = rejectUserSignupHandler;
async function getFilteredUsersHandler(req, res) {
    try {
        const parsed = usersSchema_1.getFilteredUsersSchema.safeParse(req.query);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.flatten() });
        }
        // console.log(JSON.stringify(parsed));
        const usersData = await (0, adminService_2.getFilteredUsers)(parsed.data);
        return res.status(200).json(usersData);
    }
    catch (error) {
        console.error("Error in getFilteredUsersController:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
exports.getFilteredUsersHandler = getFilteredUsersHandler;
// export async function manageUserStatusHandler(req: Request, res: Response) {
//   const { userId, status } = req.body;
//   try {
//     const result = await updateUserStatus(userId, status);
//     res.status(200).json({ message: "User status updated", result });
//   } catch (error: any) {
//     res.status(500).json({ message: error.message });
//   }
// }
// export async function addCourseHandler(req: Request, res: Response) {
//   try {
//     const result = await addCourse(req.body);
//     res.status(201).json({ message: "Course added", result });
//   } catch (error: any) {
//     res.status(500).json({ message: error.message });
//   }
// }
// export async function editCourseHandler(req: Request, res: Response) {
//   const { courseId } = req.params;
//   try {
//     const result = await editCourse(courseId, req.body);
//     res.status(200).json({ message: "Course updated", result });
//   } catch (error: any) {
//     res.status(500).json({ message: error.message });
//   }
// }
// export async function deleteCourseHandler(req: Request, res: Response) {
//   const { courseId } = req.params;
//   try {
//     await deleteCourse(courseId);
//     res.status(200).json({ message: "Course deleted" });
//   } catch (error: any) {
//     res.status(500).json({ message: error.message });
//   }
// }
const approveUserHandler = async (req, res) => {
    const userId = req.params.id;
    try {
        const user = await (0, adminService_2.approveUser)(userId);
        res.status(http_status_codes_1.StatusCodes.ACCEPTED).json(user);
    }
    catch (error) {
        console.error("Failed to fetch admin contacts", error);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};
exports.approveUserHandler = approveUserHandler;
const disApproveUserHandler = async (req, res) => {
    const userId = req.params.id;
    try {
        const user = await (0, adminService_2.disApproveUser)(userId);
        res.status(http_status_codes_1.StatusCodes.ACCEPTED).json(user);
    }
    catch (error) {
        console.error("Failed to fetch admin contacts", error);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};
exports.disApproveUserHandler = disApproveUserHandler;
// NEW ADMIN HANDLERS
// User Management Handlers
const getAllUsersHandler = async (req, res) => {
    try {
        const parsed = adminSchema_1.getUsersQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            return res
                .status(http_status_codes_1.StatusCodes.BAD_REQUEST)
                .json({ error: parsed.error.flatten() });
        }
        const users = await (0, adminService_2.getAllUsers)(parsed.data);
        res.status(http_status_codes_1.StatusCodes.OK).json(users);
    }
    catch (error) {
        console.error("Error in getAllUsersHandler:", error);
        res
            .status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ error: "Internal server error" });
    }
};
exports.getAllUsersHandler = getAllUsersHandler;
const getUserByIdHandler = async (req, res) => {
    try {
        const parsed = adminSchema_1.getUserByIdSchema.safeParse(req.params);
        if (!parsed.success) {
            return res
                .status(http_status_codes_1.StatusCodes.BAD_REQUEST)
                .json({ error: parsed.error.flatten() });
        }
        const user = await (0, adminService_2.getUserById)(parsed.data.id);
        res.status(http_status_codes_1.StatusCodes.OK).json(user);
    }
    catch (error) {
        console.error("Error in getUserByIdHandler:", error);
        if (error instanceof errors_1.NotFoundError) {
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({ error: error.message });
        }
        res
            .status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ error: "Internal server error" });
    }
};
exports.getUserByIdHandler = getUserByIdHandler;
const updateUserByIdHandler = async (req, res) => {
    try {
        const userId = req.params.id;
        const parsed = adminSchema_1.updateUserSchema.safeParse(req.body);
        if (!parsed.success) {
            return res
                .status(http_status_codes_1.StatusCodes.BAD_REQUEST)
                .json({ error: parsed.error.flatten() });
        }
        const user = await (0, adminService_2.updateUserById)(userId, parsed.data);
        res.status(http_status_codes_1.StatusCodes.OK).json(user);
    }
    catch (error) {
        console.error("Error in updateUserByIdHandler:", error);
        if (error instanceof errors_1.NotFoundError) {
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({ error: error.message });
        }
        res
            .status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ error: "Internal server error" });
    }
};
exports.updateUserByIdHandler = updateUserByIdHandler;
const updateUserStatusHandler = async (req, res) => {
    try {
        const userId = req.params.id;
        const parsed = adminSchema_1.updateUserStatusSchema.safeParse(req.body);
        if (!parsed.success) {
            return res
                .status(http_status_codes_1.StatusCodes.BAD_REQUEST)
                .json({ error: parsed.error.flatten() });
        }
        const user = await (0, adminService_2.updateUserStatus)(userId, parsed.data);
        res.status(http_status_codes_1.StatusCodes.OK).json(user);
    }
    catch (error) {
        console.error("Error in updateUserStatusHandler:", error);
        if (error instanceof errors_1.NotFoundError) {
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({ error: error.message });
        }
        res
            .status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ error: "Internal server error" });
    }
};
exports.updateUserStatusHandler = updateUserStatusHandler;
const deleteUserByIdHandler = async (req, res) => {
    try {
        const userId = req.params.id;
        const result = await (0, adminService_2.deleteUserById)(userId);
        res.status(http_status_codes_1.StatusCodes.OK).json(result);
    }
    catch (error) {
        console.error("Error in deleteUserByIdHandler:", error);
        if (error instanceof errors_1.NotFoundError) {
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({ error: error.message });
        }
        res
            .status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ error: "Internal server error" });
    }
};
exports.deleteUserByIdHandler = deleteUserByIdHandler;
// Match Management Handlers
const getAllMatchesHandler = async (req, res) => {
    try {
        const parsed = adminSchema_1.getMatchesQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            return res
                .status(http_status_codes_1.StatusCodes.BAD_REQUEST)
                .json({ error: parsed.error.flatten() });
        }
        const matches = await (0, adminService_2.getAllMatches)(parsed.data);
        res.status(http_status_codes_1.StatusCodes.OK).json(matches);
    }
    catch (error) {
        console.error("Error in getAllMatchesHandler:", error);
        res
            .status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ error: "Internal server error" });
    }
};
exports.getAllMatchesHandler = getAllMatchesHandler;
const getMatchByIdHandler = async (req, res) => {
    try {
        const matchId = req.params.id;
        const match = await (0, adminService_2.getMatchById)(matchId);
        res.status(http_status_codes_1.StatusCodes.OK).json(match);
    }
    catch (error) {
        console.error("Error in getMatchByIdHandler:", error);
        if (error instanceof errors_1.NotFoundError) {
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({ error: error.message });
        }
        res
            .status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ error: "Internal server error" });
    }
};
exports.getMatchByIdHandler = getMatchByIdHandler;
const updateMatchByIdHandler = async (req, res) => {
    try {
        const matchId = req.params.id;
        const parsed = adminSchema_1.updateMatchSchema.safeParse(req.body);
        if (!parsed.success) {
            return res
                .status(http_status_codes_1.StatusCodes.BAD_REQUEST)
                .json({ error: parsed.error.flatten() });
        }
        const match = await (0, adminService_2.updateMatchById)(matchId, parsed.data);
        res.status(http_status_codes_1.StatusCodes.OK).json(match);
    }
    catch (error) {
        console.error("Error in updateMatchByIdHandler:", error);
        if (error instanceof errors_1.NotFoundError) {
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({ error: error.message });
        }
        res
            .status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ error: "Internal server error" });
    }
};
exports.updateMatchByIdHandler = updateMatchByIdHandler;
const deleteMatchByIdHandler = async (req, res) => {
    try {
        const matchId = req.params.id;
        const result = await (0, adminService_2.deleteMatchById)(matchId);
        res.status(http_status_codes_1.StatusCodes.OK).json(result);
    }
    catch (error) {
        console.error("Error in deleteMatchByIdHandler:", error);
        if (error instanceof errors_1.NotFoundError) {
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({ error: error.message });
        }
        res
            .status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ error: "Internal server error" });
    }
};
exports.deleteMatchByIdHandler = deleteMatchByIdHandler;
// Game Management Handlers
const getAllGamesHandler = async (req, res) => {
    try {
        const games = await (0, adminService_2.getAllGames)();
        res.status(http_status_codes_1.StatusCodes.OK).json(games);
    }
    catch (error) {
        console.error("Error in getAllGamesHandler:", error);
        res
            .status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ error: "Internal server error" });
    }
};
exports.getAllGamesHandler = getAllGamesHandler;
const getGameByIdHandler = async (req, res) => {
    try {
        const gameId = req.params.id;
        const game = await (0, adminService_2.getGameById)(gameId);
        res.status(http_status_codes_1.StatusCodes.OK).json(game);
    }
    catch (error) {
        console.error("Error in getGameByIdHandler:", error);
        if (error instanceof errors_1.NotFoundError) {
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({ error: error.message });
        }
        res
            .status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ error: "Internal server error" });
    }
};
exports.getGameByIdHandler = getGameByIdHandler;
const createGameHandler = async (req, res) => {
    try {
        const parsed = adminSchema_1.createGameSchema.safeParse(req.body);
        if (!parsed.success) {
            return res
                .status(http_status_codes_1.StatusCodes.BAD_REQUEST)
                .json({ error: parsed.error.flatten() });
        }
        const game = await (0, adminService_2.createGame)(parsed.data);
        res.status(http_status_codes_1.StatusCodes.CREATED).json(game);
    }
    catch (error) {
        console.error("Error in createGameHandler:", error);
        res
            .status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ error: "Internal server error" });
    }
};
exports.createGameHandler = createGameHandler;
const updateGameByIdHandler = async (req, res) => {
    try {
        const gameId = req.params.id;
        const parsed = adminSchema_1.updateGameSchema.safeParse(req.body);
        if (!parsed.success) {
            return res
                .status(http_status_codes_1.StatusCodes.BAD_REQUEST)
                .json({ error: parsed.error.flatten() });
        }
        const game = await (0, adminService_2.updateGameById)(gameId, parsed.data);
        res.status(http_status_codes_1.StatusCodes.OK).json(game);
    }
    catch (error) {
        console.error("Error in updateGameByIdHandler:", error);
        if (error instanceof errors_1.NotFoundError) {
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({ error: error.message });
        }
        res
            .status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ error: "Internal server error" });
    }
};
exports.updateGameByIdHandler = updateGameByIdHandler;
const deleteGameByIdHandler = async (req, res) => {
    try {
        const gameId = req.params.id;
        const result = await (0, adminService_2.deleteGameById)(gameId);
        res.status(http_status_codes_1.StatusCodes.OK).json(result);
    }
    catch (error) {
        console.error("Error in deleteGameByIdHandler:", error);
        if (error instanceof errors_1.NotFoundError) {
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({ error: error.message });
        }
        res
            .status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ error: "Internal server error" });
    }
};
exports.deleteGameByIdHandler = deleteGameByIdHandler;
// Report Management Handlers
const getAllReportsHandler = async (req, res) => {
    try {
        const parsed = adminSchema_1.getReportsQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            return res
                .status(http_status_codes_1.StatusCodes.BAD_REQUEST)
                .json({ error: parsed.error.flatten() });
        }
        const reports = await (0, adminService_2.getAllReports)(parsed.data);
        res.status(http_status_codes_1.StatusCodes.OK).json(reports);
    }
    catch (error) {
        console.error("Error in getAllReportsHandler:", error);
        res
            .status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ error: "Internal server error" });
    }
};
exports.getAllReportsHandler = getAllReportsHandler;
const getReportByIdHandler = async (req, res) => {
    try {
        const reportId = req.params.id;
        const report = await (0, adminService_2.getReportById)(reportId);
        res.status(http_status_codes_1.StatusCodes.OK).json(report);
    }
    catch (error) {
        console.error("Error in getReportByIdHandler:", error);
        if (error instanceof errors_1.NotFoundError) {
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({ error: error.message });
        }
        res
            .status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ error: "Internal server error" });
    }
};
exports.getReportByIdHandler = getReportByIdHandler;
const updateReportByIdHandler = async (req, res) => {
    var _a;
    try {
        const reportId = req.params.id;
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id; // Assumes auth middleware adds user to request
        const parsed = adminSchema_1.updateReportSchema.safeParse(req.body);
        if (!parsed.success) {
            return res
                .status(http_status_codes_1.StatusCodes.BAD_REQUEST)
                .json({ error: parsed.error.flatten() });
        }
        const report = await (0, adminService_2.updateReportById)(reportId, parsed.data, adminId);
        res.status(http_status_codes_1.StatusCodes.OK).json(report);
    }
    catch (error) {
        console.error("Error in updateReportByIdHandler:", error);
        if (error instanceof errors_1.NotFoundError) {
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({ error: error.message });
        }
        res
            .status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ error: "Internal server error" });
    }
};
exports.updateReportByIdHandler = updateReportByIdHandler;
const createUserReportHandler = async (req, res) => {
    var _a;
    try {
        const reporterId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id; // Assumes auth middleware adds user to request
        const parsed = adminSchema_1.createUserReportSchema.safeParse(req.body);
        if (!parsed.success) {
            return res
                .status(http_status_codes_1.StatusCodes.BAD_REQUEST)
                .json({ error: parsed.error.flatten() });
        }
        const report = await (0, adminService_2.createUserReport)(parsed.data, reporterId);
        res.status(http_status_codes_1.StatusCodes.CREATED).json(report);
    }
    catch (error) {
        console.error("Error in createUserReportHandler:", error);
        if (error instanceof errors_1.NotFoundError) {
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({ error: error.message });
        }
        res
            .status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ error: "Internal server error" });
    }
};
exports.createUserReportHandler = createUserReportHandler;
const deleteReportByIdHandler = async (req, res) => {
    try {
        const reportId = req.params.id;
        const result = await (0, adminService_2.deleteReportById)(reportId);
        res.status(http_status_codes_1.StatusCodes.OK).json(result);
    }
    catch (error) {
        console.error("Error in deleteReportByIdHandler:", error);
        if (error instanceof errors_1.NotFoundError) {
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({ error: error.message });
        }
        res
            .status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ error: "Internal server error" });
    }
};
exports.deleteReportByIdHandler = deleteReportByIdHandler;
// Payment Analytics Handlers
const getPaymentAnalyticsHandler = async (req, res) => {
    try {
        const parsed = adminSchema_1.getPaymentAnalyticsSchema.safeParse(req.query);
        if (!parsed.success) {
            return res
                .status(http_status_codes_1.StatusCodes.BAD_REQUEST)
                .json({ error: parsed.error.flatten() });
        }
        const analytics = await (0, adminService_2.getPaymentAnalytics)(parsed.data);
        res.status(http_status_codes_1.StatusCodes.OK).json(analytics);
    }
    catch (error) {
        console.error("Error in getPaymentAnalyticsHandler:", error);
        res
            .status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ error: "Internal server error" });
    }
};
exports.getPaymentAnalyticsHandler = getPaymentAnalyticsHandler;
const getAllPaymentsHandler = async (req, res) => {
    try {
        const parsed = adminSchema_1.getPaymentsQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            return res
                .status(http_status_codes_1.StatusCodes.BAD_REQUEST)
                .json({ error: parsed.error.flatten() });
        }
        const payments = await (0, adminService_2.getAllPayments)(parsed.data);
        res.status(http_status_codes_1.StatusCodes.OK).json(payments);
    }
    catch (error) {
        console.error("Error in getAllPaymentsHandler:", error);
        res
            .status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ error: "Internal server error" });
    }
};
exports.getAllPaymentsHandler = getAllPaymentsHandler;
// Refund Management Handlers
const getPaymentByIdHandler = async (req, res) => {
    try {
        const paymentId = req.params.id;
        const payment = await (0, adminService_2.getPaymentById)(paymentId);
        res.status(http_status_codes_1.StatusCodes.OK).json(payment);
    }
    catch (error) {
        console.error("Error in getPaymentByIdHandler:", error);
        if (error instanceof errors_1.NotFoundError) {
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({ error: error.message });
        }
        res
            .status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ error: "Internal server error" });
    }
};
exports.getPaymentByIdHandler = getPaymentByIdHandler;
const createRefundHandler = async (req, res) => {
    var _a;
    try {
        const paymentId = req.params.id;
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!adminId) {
            return res
                .status(http_status_codes_1.StatusCodes.UNAUTHORIZED)
                .json({ error: "Admin authentication required" });
        }
        const parsed = adminSchema_1.createRefundSchema.safeParse(req.body);
        if (!parsed.success) {
            return res
                .status(http_status_codes_1.StatusCodes.BAD_REQUEST)
                .json({ error: parsed.error.flatten() });
        }
        // Additional validation for refund amount
        if (parsed.data.amount <= 0) {
            return res
                .status(http_status_codes_1.StatusCodes.BAD_REQUEST)
                .json({ error: "Refund amount must be positive" });
        }
        const refund = await (0, adminService_2.createRefund)(paymentId, parsed.data, adminId);
        res.status(http_status_codes_1.StatusCodes.CREATED).json({
            message: "Refund processed successfully",
            refund,
        });
    }
    catch (error) {
        console.error("Error in createRefundHandler:", error);
        if (error instanceof errors_1.NotFoundError) {
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({ error: error.message });
        }
        if (error instanceof errors_1.BadRequestError) {
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: error.message });
        }
        res
            .status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ error: "Failed to process refund" });
    }
};
exports.createRefundHandler = createRefundHandler;
const getAllRefundsHandler = async (req, res) => {
    try {
        const parsed = adminSchema_1.getRefundsQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            return res
                .status(http_status_codes_1.StatusCodes.BAD_REQUEST)
                .json({ error: parsed.error.flatten() });
        }
        const refunds = await (0, adminService_2.getAllRefunds)(parsed.data);
        res.status(http_status_codes_1.StatusCodes.OK).json(refunds);
    }
    catch (error) {
        console.error("Error in getAllRefundsHandler:", error);
        res
            .status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ error: "Internal server error" });
    }
};
exports.getAllRefundsHandler = getAllRefundsHandler;
// export const getFilteredUsersHandler = async (req: Request, res: Response) => {
//   const query = req.query;
//   try {
//     const users = (await getFilteredUsers(query)) as GetFilteredUsersInput;
//     res.status(StatusCodes.CREATED).json(users);
//   } catch (error: any) {
//     console.error("Failed to fetch users", error);
//     res.status(error.statusCode || 500).json({ message: error.message });
//   }
// };
