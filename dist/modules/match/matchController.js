"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitPlayerRatingsHandler = exports.submitNoShowReasonHandler = exports.leaveMatchHandler = exports.cancelMatchHandler = exports.rescheduleMatchController = exports.reportNoShowHandler = exports.updateMatchOutcomeHandler = exports.reportMatchResultHandler = exports.joinMatchHandler = exports.deleteMatchHandler = exports.updateMatchHandler = exports.getMatchByIdHandler = exports.getRecommendedMatchesHandler = exports.getMatchesHandler = exports.createMatchHandler = void 0;
const http_status_codes_1 = require("http-status-codes");
const matchService_1 = require("./matchService");
const notificationService_1 = require("../notification/notificationService");
const errors_1 = require("../../errors");
const matchSchema_1 = require("./matchSchema");
const createMatchHandler = async (req, res) => {
    try {
        const match = await (0, matchService_1.createMatch)(req.body, req.user.id);
        res.status(http_status_codes_1.StatusCodes.CREATED).json({ match });
    }
    catch (error) {
        console.error("Error in createMatchHandler:", error);
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: "Something went wrong while creating the match.",
        });
    }
};
exports.createMatchHandler = createMatchHandler;
const getMatchesHandler = async (req, res) => {
    try {
        const query = req.query;
        const matches = await (0, matchService_1.getMatches)(query);
        res.status(http_status_codes_1.StatusCodes.OK).json({ matches });
    }
    catch (error) {
        console.error("getMatchesHandler error:", error);
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: (error === null || error === void 0 ? void 0 : error.message) || "Failed to fetch matches.",
        });
    }
};
exports.getMatchesHandler = getMatchesHandler;
const getRecommendedMatchesHandler = async (req, res) => {
    try {
        const userId = req.user.id;
        const query = req.query;
        const matches = await (0, matchService_1.getRecommendedMatches)(userId, query);
        res.status(http_status_codes_1.StatusCodes.OK).json({ matches });
    }
    catch (error) {
        console.error("getRecommendedMatchesHandler error:", error);
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: (error === null || error === void 0 ? void 0 : error.message) || "Failed to fetch recommended matches.",
        });
    }
};
exports.getRecommendedMatchesHandler = getRecommendedMatchesHandler;
const getMatchByIdHandler = async (req, res) => {
    const match = await (0, matchService_1.getMatchById)(req.params.id);
    res.status(http_status_codes_1.StatusCodes.OK).json({ match });
};
exports.getMatchByIdHandler = getMatchByIdHandler;
const updateMatchHandler = async (req, res) => {
    const match = await (0, matchService_1.updateMatch)(req.params.id, req.body);
    res.status(http_status_codes_1.StatusCodes.OK).json({ match });
};
exports.updateMatchHandler = updateMatchHandler;
const deleteMatchHandler = async (req, res) => {
    await (0, matchService_1.deleteMatch)(req.params.id);
    res.status(http_status_codes_1.StatusCodes.NO_CONTENT).send();
};
exports.deleteMatchHandler = deleteMatchHandler;
const joinMatchHandler = async (req, res) => {
    try {
        const { clientSecret } = await (0, matchService_1.joinMatch)(req.user.id, req.params.id);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            clientSecret,
        });
    }
    catch (error) {
        console.error("joinMatchHandler error:", error);
        // Send booking error notification for specific errors
        if (error instanceof errors_1.BadRequestError || error instanceof errors_1.NotFoundError) {
            try {
                await (0, notificationService_1.createNotification)({
                    userId: req.user.id,
                    type: "booking_error",
                    data: {
                        matchId: req.params.id,
                        errorMessage: error.message,
                    },
                    redirectLink: `/matches`,
                });
            }
            catch (notificationError) {
                console.error("Failed to send booking error notification:", notificationError);
            }
            return res.status(error.statusCode).json({ message: error.message });
        }
        // Send generic booking error for unexpected errors
        try {
            await (0, notificationService_1.createNotification)({
                userId: req.user.id,
                type: "booking_error",
                data: {
                    matchId: req.params.id,
                    errorMessage: "An unexpected error occurred",
                },
                redirectLink: `/support`,
            });
        }
        catch (notificationError) {
            console.error("Failed to send booking error notification:", notificationError);
        }
        res.status(500).json({ message: "Something went wrong." });
    }
};
exports.joinMatchHandler = joinMatchHandler;
const reportMatchResultHandler = async (req, res) => {
    try {
        const input = matchSchema_1.reportMatchResultSchema.parse(req.body);
        const result = await (0, matchService_1.reportMatchResult)({
            matchId: req.params.id,
            userId: req.user.id,
            ...input,
        });
        res.status(http_status_codes_1.StatusCodes.CREATED).json({ result });
    }
    catch (error) {
        console.error("reportMatchResultHandler error:", error);
        if (error instanceof errors_1.BadRequestError || error instanceof errors_1.NotFoundError) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        res.status(500).json({ message: "Something went wrong." });
    }
};
exports.reportMatchResultHandler = reportMatchResultHandler;
const updateMatchOutcomeHandler = async (req, res) => {
    try {
        const { id: matchId } = req.params;
        const { outcome } = req.body;
        const userId = req.user.id;
        // Validate outcome input (optional but recommended)
        if (!["WON", "LOST", "DRAW"].includes(outcome)) {
            return res
                .status(http_status_codes_1.StatusCodes.BAD_REQUEST)
                .json({ message: "Invalid outcome" });
        }
        const result = await (0, matchService_1.updateMatchOutcome)(matchId, userId, outcome);
        res.status(http_status_codes_1.StatusCodes.OK).json({ result });
    }
    catch (error) {
        console.error("updateMatchOutcomeHandler error:", error);
        if (error instanceof errors_1.BadRequestError || error instanceof errors_1.NotFoundError) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        res
            .status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ message: "Something went wrong." });
    }
};
exports.updateMatchOutcomeHandler = updateMatchOutcomeHandler;
const reportNoShowHandler = async (req, res) => {
    try {
        const { id: matchId } = req.params;
        const { reportedUserIds, reason: reporterComment } = req.body;
        const reporterId = req.user.id;
        const reports = [];
        for (const reportedUserId of reportedUserIds) {
            const report = await (0, matchService_1.reportNoShow)(matchId, reporterId, reportedUserId, reporterComment);
            reports.push(report);
        }
        res.status(http_status_codes_1.StatusCodes.CREATED).json({ reports });
    }
    catch (error) {
        console.error("reportNoShowHandler error:", error);
        if (error instanceof errors_1.BadRequestError || error instanceof errors_1.NotFoundError) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        res
            .status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ message: "Something went wrong." });
    }
};
exports.reportNoShowHandler = reportNoShowHandler;
const rescheduleMatchController = async (req, res) => {
    try {
        const { id: matchId } = req.params;
        const { newDate, newTime } = req.body;
        const requestingUserId = req.user.id;
        const { originalMatch, matchRequest } = await (0, matchService_1.rescheduleMatch)(matchId, newDate, newTime, requestingUserId);
        res.status(http_status_codes_1.StatusCodes.CREATED).json({
            message: "Reschedule request submitted for admin approval",
            matchRequest,
            originalMatch: {
                id: originalMatch.id,
                scheduledAt: originalMatch.scheduledAt,
            },
        });
    }
    catch (error) {
        console.error("rescheduleMatchController error:", error);
        if (error instanceof errors_1.BadRequestError || error instanceof errors_1.NotFoundError) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        res
            .status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ message: "Something went wrong." });
    }
};
exports.rescheduleMatchController = rescheduleMatchController;
const cancelMatchHandler = async (req, res) => {
    try {
        const { cancellationReason, customCancellationReason } = req.body;
        const match = await (0, matchService_1.cancelMatch)(req.params.id, req.user.id, cancellationReason, customCancellationReason, req.user.role);
        res.status(http_status_codes_1.StatusCodes.OK).json({ match });
    }
    catch (error) {
        console.error("cancelMatchHandler error:", error);
        if (error instanceof errors_1.BadRequestError || error instanceof errors_1.NotFoundError) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        res.status(500).json({ message: "Something went wrong." });
    }
};
exports.cancelMatchHandler = cancelMatchHandler;
const leaveMatchHandler = async (req, res) => {
    try {
        const { leaveReason, customLeaveReason } = req.body;
        await (0, matchService_1.leaveMatch)(req.params.id, req.user.id, leaveReason, customLeaveReason);
        res.status(http_status_codes_1.StatusCodes.NO_CONTENT).send();
    }
    catch (error) {
        console.error("leaveMatchHandler error:", error);
        if (error instanceof errors_1.BadRequestError || error instanceof errors_1.NotFoundError) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        res.status(500).json({ message: "Something went wrong." });
    }
};
exports.leaveMatchHandler = leaveMatchHandler;
const submitNoShowReasonHandler = async (req, res) => {
    try {
        const { matchId, noShowReportId } = req.params;
        const { reason, customReason } = req.body;
        const userId = req.user.id;
        const updatedReport = await (0, matchService_1.submitNoShowReason)(noShowReportId, userId, reason, customReason);
        res.status(http_status_codes_1.StatusCodes.OK).json({ report: updatedReport });
    }
    catch (error) {
        console.error("submitNoShowReasonHandler error:", error);
        if (error instanceof errors_1.BadRequestError || error instanceof errors_1.NotFoundError) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        res
            .status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ message: "Something went wrong." });
    }
};
exports.submitNoShowReasonHandler = submitNoShowReasonHandler;
const submitPlayerRatingsHandler = async (req, res) => {
    try {
        const { id: matchId } = req.params;
        const { ratings } = req.body;
        const userId = req.user.id;
        const result = await (0, matchService_1.submitPlayerRatings)(matchId, userId, ratings);
        res.status(http_status_codes_1.StatusCodes.OK).json({ result });
    }
    catch (error) {
        console.error("submitPlayerRatingsHandler error:", error);
        if (error instanceof errors_1.BadRequestError || error instanceof errors_1.NotFoundError) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        res
            .status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ message: "Something went wrong." });
    }
};
exports.submitPlayerRatingsHandler = submitPlayerRatingsHandler;
