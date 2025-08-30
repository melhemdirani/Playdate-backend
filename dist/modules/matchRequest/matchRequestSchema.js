"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMatchRequestSchema = void 0;
const zod_1 = require("zod");
const matchSchema_1 = require("../match/matchSchema");
exports.createMatchRequestSchema = zod_1.z.object({
    gameId: zod_1.z.string(),
    location: matchSchema_1.LocationSchema,
    scheduledAt: zod_1.z.string().datetime(),
    maxPlayers: zod_1.z.number().int().positive(),
    durationMins: zod_1.z.number().int().positive().optional(),
});
