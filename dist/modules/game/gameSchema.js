"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gameSelection = exports.gameSchema = void 0;
const zod_1 = require("zod");
const imageSchema_1 = require("../variants/image/imageSchema");
exports.gameSchema = zod_1.z.object({
    name: zod_1.z.enum(["padel", "basketball", "tennis", "volleyball", "squash"]),
    image: imageSchema_1.imageInputSchema.optional(),
});
exports.gameSelection = {
    id: true,
    name: true,
    image: imageSchema_1.imageSelection,
};
