import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { IToken } from "../../utils";
import {
  createMatch,
  deleteMatch,
  getMatchById,
  getMatches,
  updateMatch,
  joinMatch,
  reportMatchResult,
  updateMatchOutcome,
  submitPlayerRatings,
  reportNoShow,
  rescheduleMatch,
  cancelMatch,
  leaveMatch,
  getRecommendedMatches,
  submitNoShowReason,
} from "./matchService";
import { createNotification } from "../notification/notificationService";
import { BadRequestError, NotFoundError } from "../../errors";
import {
  GetMatchesQueryInput,
  reportMatchResultSchema,
  GetRecommendedMatchesQueryInput,
  RescheduleMatchInput,
  submitNoShowReasonSchema,
  SubmitNoShowReasonInput,
} from "./matchSchema";

interface CustomRequest extends Request {
  user: IToken;
}

export const createMatchHandler = async (req: CustomRequest, res: Response) => {
  try {
    const match = await createMatch(req.body, req.user.id);
    res.status(StatusCodes.CREATED).json({ match });
  } catch (error) {
    console.error("Error in createMatchHandler:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Something went wrong while creating the match.",
    });
  }
};

export const getMatchesHandler = async (req: CustomRequest, res: Response) => {
  try {
    const query = req.query as GetMatchesQueryInput;
    const matches = await getMatches(query);
    res.status(StatusCodes.OK).json({ matches });
  } catch (error: any) {
    console.error("getMatchesHandler error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error?.message || "Failed to fetch matches.",
    });
  }
};

export const getRecommendedMatchesHandler = async (
  req: CustomRequest,
  res: Response
) => {
  console.log("start");
  try {
    const userId = req.user.id;
    const query = req.query as GetRecommendedMatchesQueryInput;
    const matches = await getRecommendedMatches(userId, query);
    res.status(StatusCodes.OK).json({ matches });
  } catch (error: any) {
    console.error("getRecommendedMatchesHandler error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error?.message || "Failed to fetch recommended matches.",
    });
  }
};

export const getMatchByIdHandler = async (
  req: CustomRequest,
  res: Response
) => {
  const match = await getMatchById(req.params.id);
  res.status(StatusCodes.OK).json({ match });
};

export const updateMatchHandler = async (req: CustomRequest, res: Response) => {
  const match = await updateMatch(req.params.id, req.body);
  res.status(StatusCodes.OK).json({ match });
};

export const deleteMatchHandler = async (req: CustomRequest, res: Response) => {
  await deleteMatch(req.params.id);
  res.status(StatusCodes.NO_CONTENT).send();
};

export const joinMatchHandler = async (req: CustomRequest, res: Response) => {
  try {
    const { clientSecret } = await joinMatch(req.user.id, req.params.id);
    res.status(StatusCodes.OK).json({
      clientSecret,
    });
  } catch (error) {
    console.error("joinMatchHandler error:", error);

    // Send booking error notification for specific errors
    if (error instanceof BadRequestError || error instanceof NotFoundError) {
      try {
        await createNotification({
          userId: req.user.id,
          type: "booking_error",
          data: {
            matchId: req.params.id,
            errorMessage: error.message,
          },
          redirectLink: `/matches`,
        });
      } catch (notificationError) {
        console.error(
          "Failed to send booking error notification:",
          notificationError
        );
      }

      return res.status(error.statusCode).json({ message: error.message });
    }

    // Send generic booking error for unexpected errors
    try {
      await createNotification({
        userId: req.user.id,
        type: "booking_error",
        data: {
          matchId: req.params.id,
          errorMessage: "An unexpected error occurred",
        },
        redirectLink: `/support`,
      });
    } catch (notificationError) {
      console.error(
        "Failed to send booking error notification:",
        notificationError
      );
    }

    res.status(500).json({ message: "Something went wrong." });
  }
};

export const reportMatchResultHandler = async (
  req: CustomRequest,
  res: Response
) => {
  try {
    const input = reportMatchResultSchema.parse(req.body);

    const result = await reportMatchResult({
      matchId: req.params.id,
      userId: req.user.id,
      ...input,
    });

    res.status(StatusCodes.CREATED).json({ result });
  } catch (error) {
    console.error("reportMatchResultHandler error:", error);

    if (error instanceof BadRequestError || error instanceof NotFoundError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    res.status(500).json({ message: "Something went wrong." });
  }
};

export const updateMatchOutcomeHandler = async (
  req: Request & { user: { id: string } },
  res: Response
) => {
  try {
    const { id: matchId } = req.params;
    const { outcome } = req.body;
    const userId = req.user.id;

    // Validate outcome input (optional but recommended)
    if (!["WON", "LOST", "DRAW"].includes(outcome)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Invalid outcome" });
    }

    const result = await updateMatchOutcome(matchId, userId, outcome);

    res.status(StatusCodes.OK).json({ result });
  } catch (error) {
    console.error("updateMatchOutcomeHandler error:", error);

    if (error instanceof BadRequestError || error instanceof NotFoundError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong." });
  }
};

export const reportNoShowHandler = async (
  req: CustomRequest,
  res: Response
) => {
  try {
    const { id: matchId } = req.params;
    const { reportedUserIds, reason: reporterComment } = req.body;
    const reporterId = req.user.id;

    const reports = [];
    for (const reportedUserId of reportedUserIds) {
      const report = await reportNoShow(
        matchId,
        reporterId,
        reportedUserId,
        reporterComment
      );
      reports.push(report);
    }

    res.status(StatusCodes.CREATED).json({ reports });
  } catch (error) {
    console.error("reportNoShowHandler error:", error);

    if (error instanceof BadRequestError || error instanceof NotFoundError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong." });
  }
};

export const rescheduleMatchController = async (
  req: CustomRequest,
  res: Response
) => {
  try {
    const { id: matchId } = req.params;
    const { newDate, newTime } = req.body as RescheduleMatchInput;
    const requestingUserId = req.user.id;

    const { originalMatch, matchRequest } = await rescheduleMatch(
      matchId,
      newDate,
      newTime,
      requestingUserId
    );

    res.status(StatusCodes.CREATED).json({
      message: "Reschedule request submitted for admin approval",
      matchRequest,
      originalMatch: {
        id: originalMatch.id,
        scheduledAt: originalMatch.scheduledAt,
      },
    });
  } catch (error) {
    console.error("rescheduleMatchController error:", error);

    if (error instanceof BadRequestError || error instanceof NotFoundError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong." });
  }
};

export const cancelMatchHandler = async (req: CustomRequest, res: Response) => {
  try {
    const { cancellationReason, customCancellationReason } = req.body;
    const match = await cancelMatch(
      req.params.id,
      req.user.id,
      cancellationReason,
      customCancellationReason,
      req.user.role
    );
    res.status(StatusCodes.OK).json({ match });
  } catch (error) {
    console.error("cancelMatchHandler error:", error);

    if (error instanceof BadRequestError || error instanceof NotFoundError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    res.status(500).json({ message: "Something went wrong." });
  }
};

export const leaveMatchHandler = async (req: CustomRequest, res: Response) => {
  try {
    const { leaveReason, customLeaveReason } = req.body;
    await leaveMatch(
      req.params.id,
      req.user.id,
      leaveReason,
      customLeaveReason
    );
    res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    console.error("leaveMatchHandler error:", error);

    if (error instanceof BadRequestError || error instanceof NotFoundError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    res.status(500).json({ message: "Something went wrong." });
  }
};

export const submitNoShowReasonHandler = async (
  req: CustomRequest,
  res: Response
) => {
  try {
    const { matchId, noShowReportId } = req.params;
    const { reason, customReason } = req.body as SubmitNoShowReasonInput;
    const userId = req.user.id;

    const updatedReport = await submitNoShowReason(
      noShowReportId,
      userId,
      reason,
      customReason
    );

    res.status(StatusCodes.OK).json({ report: updatedReport });
  } catch (error) {
    console.error("submitNoShowReasonHandler error:", error);

    if (error instanceof BadRequestError || error instanceof NotFoundError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong." });
  }
};

export const submitPlayerRatingsHandler = async (
  req: Request & { user: { id: string } },
  res: Response
) => {
  try {
    const { id: matchId } = req.params;
    const { ratings } = req.body;
    const userId = req.user.id;

    const result = await submitPlayerRatings(matchId, userId, ratings);

    res.status(StatusCodes.OK).json({ result });
  } catch (error) {
    console.error("submitPlayerRatingsHandler error:", error);

    if (error instanceof BadRequestError || error instanceof NotFoundError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong." });
  }
};
