"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const notificationSchema_1 = require("./notificationSchema");
const notificationController_1 = require("./notificationController");
const router = (0, express_1.Router)();
router.route('/')
    .post(auth_1.auth, (0, validate_1.validateRequest)(notificationSchema_1.createNotificationSchema, 'body'), notificationController_1.createNotificationHandler)
    .get(auth_1.auth, notificationController_1.getNotificationsHandler);
router.route('/:id/seen')
    .patch(auth_1.auth, notificationController_1.markNotificationAsSeenHandler);
router.route('/:id')
    .delete(auth_1.auth, notificationController_1.deleteNotificationHandler);
exports.default = router;
