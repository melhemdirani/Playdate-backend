"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.videoSelection = exports.videoListResponseSchema = exports.videoResponseSchema = exports.videoInputSchema = exports.imageListResponseJson = exports.imageResponseJson = exports.imageInputJson = exports.imageSelection = exports.imageListResponseSchema = exports.imageResponseSchema = exports.imageInputSchema = void 0;
const zod_1 = require("zod");
const zod_to_json_schema_1 = __importDefault(require("zod-to-json-schema"));
exports.imageInputSchema = zod_1.z.object({
    publicId: zod_1.z.string({
        required_error: "PublicId is required",
        invalid_type_error: "PublicId must be a string",
    }),
    url: zod_1.z.string({
        required_error: "Url is required",
        invalid_type_error: "Url must be a string",
    }),
    fileName: zod_1.z.string({
        required_error: "fileName is required",
        invalid_type_error: "fileName must be a string",
    }),
});
exports.imageResponseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    publicId: zod_1.z.string(),
    url: zod_1.z.string(),
    fileName: zod_1.z.string(),
    // createdAt: z.date().optional(),
    // updatedAt: z.date().optional(),
});
exports.imageListResponseSchema = zod_1.z.array(exports.imageResponseSchema);
exports.imageSelection = {
    id: true,
    publicId: true,
    url: true,
    // createdAt: true,
    // updatedAt: true,
    fileName: true,
};
exports.imageInputJson = (0, zod_to_json_schema_1.default)(exports.imageInputSchema);
exports.imageResponseJson = (0, zod_to_json_schema_1.default)(exports.imageResponseSchema);
exports.imageListResponseJson = (0, zod_to_json_schema_1.default)(exports.imageListResponseSchema);
//videos
//same as images
exports.videoInputSchema = exports.imageInputSchema;
exports.videoResponseSchema = exports.imageResponseSchema;
exports.videoListResponseSchema = exports.imageListResponseSchema;
exports.videoSelection = {
    id: true,
    publicId: true,
    url: true,
    createdAt: true,
    updatedAt: true,
    videoLength: true,
};
