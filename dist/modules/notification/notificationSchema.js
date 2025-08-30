"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNotificationSchema = exports.createNotificationSchema = void 0;
const zod_1 = require("zod");
const data_1 = require("./data");
const notificationKeys = Object.keys(data_1.notificationsData);
exports.createNotificationSchema = zod_1.z.object({
    type: zod_1.z.enum(notificationKeys),
    redirectLink: zod_1.z.string().url().optional(),
    userId: zod_1.z.string(),
    data: zod_1.z.any().optional(),
    title: zod_1.z.string().optional(),
    subtitle: zod_1.z.string().optional(),
});
exports.updateNotificationSchema = zod_1.z.object({
    seen: zod_1.z.boolean().optional(),
});
