"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRatingSchema = void 0;
const zod_1 = require("zod");
exports.createRatingSchema = zod_1.z.object({
    body: zod_1.z.object({
        ratedId: zod_1.z.string({
            required_error: 'Rated user ID is required',
        }),
        matchId: zod_1.z.string({
            required_error: 'Match ID is required',
        }),
        rating: zod_1.z.number({
            required_error: 'Rating is required',
        }).int().min(1).max(5),
    }),
});
