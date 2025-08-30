"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotificationHandler = exports.markNotificationAsSeenHandler = exports.getNotificationsHandler = exports.createNotificationHandler = void 0;
const http_status_codes_1 = require("http-status-codes");
const notificationService_1 = require("./notificationService");
const createNotificationHandler = async (req, res) => {
    try {
        const notification = await (0, notificationService_1.createNotification)(req.body);
        res.status(http_status_codes_1.StatusCodes.CREATED).json(notification);
    }
    catch (error) {
        console.error("Error in createNotificationHandler:", error);
        res
            .status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ message: "Failed to create notification." });
    }
};
exports.createNotificationHandler = createNotificationHandler;
const getNotificationsHandler = async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await (0, notificationService_1.getNotificationsByUserId)(userId);
        res.status(http_status_codes_1.StatusCodes.OK).json(notifications);
    }
    catch (error) {
        console.error("Error in getNotificationsHandler:", error);
        res
            .status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ message: "Failed to fetch notifications." });
    }
};
exports.getNotificationsHandler = getNotificationsHandler;
const markNotificationAsSeenHandler = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await (0, notificationService_1.markNotificationAsSeen)(id);
        res.status(http_status_codes_1.StatusCodes.OK).json(notification);
    }
    catch (error) {
        console.error("Error in markNotificationAsSeenHandler:", error);
        res
            .status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ message: "Failed to mark notification as seen." });
    }
};
exports.markNotificationAsSeenHandler = markNotificationAsSeenHandler;
const deleteNotificationHandler = async (req, res) => {
    try {
        const { id } = req.params;
        await (0, notificationService_1.deleteNotification)(id);
        res.status(http_status_codes_1.StatusCodes.NO_CONTENT).send();
    }
    catch (error) {
        console.error("Error in deleteNotificationHandler:", error);
        res
            .status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ message: "Failed to delete notification." });
    }
};
exports.deleteNotificationHandler = deleteNotificationHandler;
