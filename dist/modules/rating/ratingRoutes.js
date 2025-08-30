"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ratingController_1 = require("./ratingController");
const validate_1 = require("../../middleware/validate");
const ratingSchema_1 = require("./ratingSchema");
const auth_1 = __importDefault(require("../../middleware/auth"));
const router = express_1.default.Router();
router.post("/", auth_1.default, (0, validate_1.validateRequest)(ratingSchema_1.createRatingSchema, "body"), ratingController_1.createRatingController);
router.get("/user/:userId", ratingController_1.getUserRatingsController);
router.get("/user/:userId/overall", ratingController_1.calculateUserOverallRatingController);
exports.default = router;
