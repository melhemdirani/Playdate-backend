import express from "express";
import {
  createRatingController,
  getUserRatingsController,
  calculateUserOverallRatingController,
} from "./ratingController";
import { validateRequest } from "../../middleware/validate";
import { createRatingSchema } from "./ratingSchema";
import authenticate from "../../middleware/auth";

const router = express.Router();

router.post(
  "/",
  authenticate,
  validateRequest(createRatingSchema, "body"),
  createRatingController
);
router.get("/user/:userId", getUserRatingsController);
router.get("/user/:userId/overall", calculateUserOverallRatingController);

export default router;
