"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateUserOverallRatingController = exports.getUserRatingsController = exports.createRatingController = void 0;
const ratingService_1 = require("./ratingService");
const errors_1 = require("../../errors");
const createRatingController = async (req, res) => {
    const { ratedId, matchId, rating } = req.body;
    const raterId = req.user.id; // Assuming req.user.id is set by authentication middleware
    if (!raterId) {
        throw new errors_1.BadRequestError("Rater ID not found. Please ensure you are authenticated.");
    }
    try {
        const newRating = await (0, ratingService_1.createRating)(raterId, ratedId, matchId, rating);
        res.status(201).json(newRating);
    }
    catch (error) {
        if (error.code === "P2002") {
            // Prisma unique constraint violation
            throw new errors_1.BadRequestError("You have already rated this user for this match.");
        }
        throw error; // Re-throw other errors
    }
};
exports.createRatingController = createRatingController;
const getUserRatingsController = async (req, res) => {
    const { userId } = req.params;
    try {
        const ratings = await (0, ratingService_1.getUserRatings)(userId);
        if (!ratings) {
            throw new errors_1.NotFoundError("No ratings found for this user.");
        }
        res.status(200).json(ratings);
    }
    catch (error) {
        throw error;
    }
};
exports.getUserRatingsController = getUserRatingsController;
const calculateUserOverallRatingController = async (req, res) => {
    const { userId } = req.params;
    try {
        const overallRating = await (0, ratingService_1.calculateUserOverallRating)(userId);
        res.status(200).json({ userId, overallRating });
    }
    catch (error) {
        throw error;
    }
};
exports.calculateUserOverallRatingController = calculateUserOverallRatingController;
