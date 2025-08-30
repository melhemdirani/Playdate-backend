import { Request, Response } from "express";
import {
  calculateUserOverallRating,
  getUserRatings,
  createRating,
} from "./ratingService";
import { CreateRatingInput } from "./ratingSchema";
import { BadRequestError, NotFoundError } from "../../errors";

export const createRatingController = async (
  req: Request<{}, {}, CreateRatingInput>,
  res: Response
) => {
  const { ratedId, matchId, rating } = req.body;
  const raterId = req.user.id; // Assuming req.user.id is set by authentication middleware

  if (!raterId) {
    throw new BadRequestError(
      "Rater ID not found. Please ensure you are authenticated."
    );
  }

  try {
    const newRating = await createRating(raterId, ratedId, matchId, rating);
    res.status(201).json(newRating);
  } catch (error: any) {
    if (error.code === "P2002") {
      // Prisma unique constraint violation
      throw new BadRequestError(
        "You have already rated this user for this match."
      );
    }
    throw error; // Re-throw other errors
  }
};

export const getUserRatingsController = async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const ratings = await getUserRatings(userId);
    if (!ratings) {
      throw new NotFoundError("No ratings found for this user.");
    }
    res.status(200).json(ratings);
  } catch (error) {
    throw error;
  }
};

export const calculateUserOverallRatingController = async (
  req: Request,
  res: Response
) => {
  const { userId } = req.params;
  try {
    const overallRating = await calculateUserOverallRating(userId);
    res.status(200).json({ userId, overallRating });
  } catch (error) {
    throw error;
  }
};
