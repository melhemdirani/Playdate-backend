export const getMatchRequestsHandler = async (req: Request, res: Response) => {
  try {
    console.log("getMatchRequestsHandler called with query:", req.query);
    const parsed = getMatchRequestsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      console.log("Validation failed:", parsed.error.flatten());
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: parsed.error.flatten() });
    }

    console.log("Parsed data:", parsed.data);
    const result = await getAllMatchRequests(parsed.data);
    console.log("getAllMatchRequests result:", result);
    res.status(StatusCodes.OK).json(result);
  } catch (error: any) {
    console.error("Error in getMatchRequestsHandler:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Internal server error" });
  }
};
import {
  approveMatchRequest,
  editMatchRequest,
  declineMatchRequest,
  createAdminMatch,
} from "./adminService";

import { NextFunction } from "express";

export async function approveMatchRequestHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id, ...rest } = req.body;
    const result = await approveMatchRequest(id, rest);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function editMatchRequestHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id, ...updateData } = req.body;
    const result = await editMatchRequest(id, updateData);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function declineMatchRequestHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const result = await declineMatchRequest(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function createAdminMatchHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({ error: "Admin ID not found in request" });
    }

    console.log("Admin ID:", adminId);
    console.log("Request body:", req.body);

    const result = await createAdminMatch(adminId, req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error in createAdminMatchHandler:", error);
    next(error);
  }
}
import { Request, Response } from "express";
import {
  acceptUserSignup,
  rejectUserSignup,
  getFilteredUsers,
  disApproveUser,
  approveUser,
  // New admin functions
  getAllUsers,
  getUserById,
  updateUserById,
  updateUserStatus,
  deleteUserById,
  getAllMatches,
  getAllMatchRequests,
  getMatchById,
  updateMatchById,
  deleteMatchById,
  getAllGames,
  getGameById,
  createGame,
  updateGameById,
  deleteGameById,
  getAllReports,
  getReportById,
  updateReportById,
  createUserReport,
  deleteReportById,
  getPaymentAnalytics,
  getAllPayments,
  createRefund,
  getPaymentById,
  getAllRefunds,
} from "./adminService";
import {
  getUsersQuerySchema,
  getUserByIdSchema,
  updateUserSchema,
  updateUserStatusSchema,
  getMatchesQuerySchema,
  getMatchRequestsQuerySchema,
  updateMatchSchema,
  createGameSchema,
  updateGameSchema,
  getReportsQuerySchema,
  updateReportSchema,
  createUserReportSchema,
  getPaymentAnalyticsSchema,
  getPaymentsQuerySchema,
  createRefundSchema,
  getRefundsQuerySchema,
} from "./adminSchema";
import { getFilteredUsersSchema } from "../user/usersSchema";
import { StatusCodes } from "http-status-codes";
import { BadRequestError, NotFoundError } from "../../errors";

export async function acceptUserSignupHandler(req: Request, res: Response) {
  const { userId } = req.params;
  try {
    const result = await acceptUserSignup(userId);
    res.status(200).json({ message: "User signup accepted", result });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function rejectUserSignupHandler(req: Request, res: Response) {
  const { userId } = req.params;
  try {
    const result = await rejectUserSignup(userId);
    res.status(200).json({ message: "User signup rejected", result });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
export async function getFilteredUsersHandler(req: Request, res: Response) {
  try {
    const parsed = getFilteredUsersSchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    // console.log(JSON.stringify(parsed));
    const usersData = await getFilteredUsers(parsed.data);
    return res.status(200).json(usersData);
  } catch (error) {
    console.error("Error in getFilteredUsersController:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
// export async function manageUserStatusHandler(req: Request, res: Response) {
//   const { userId, status } = req.body;
//   try {
//     const result = await updateUserStatus(userId, status);
//     res.status(200).json({ message: "User status updated", result });
//   } catch (error: any) {
//     res.status(500).json({ message: error.message });
//   }
// }

// export async function addCourseHandler(req: Request, res: Response) {
//   try {
//     const result = await addCourse(req.body);
//     res.status(201).json({ message: "Course added", result });
//   } catch (error: any) {
//     res.status(500).json({ message: error.message });
//   }
// }

// export async function editCourseHandler(req: Request, res: Response) {
//   const { courseId } = req.params;
//   try {
//     const result = await editCourse(courseId, req.body);
//     res.status(200).json({ message: "Course updated", result });
//   } catch (error: any) {
//     res.status(500).json({ message: error.message });
//   }
// }

// export async function deleteCourseHandler(req: Request, res: Response) {
//   const { courseId } = req.params;
//   try {
//     await deleteCourse(courseId);
//     res.status(200).json({ message: "Course deleted" });
//   } catch (error: any) {
//     res.status(500).json({ message: error.message });
//   }
// }

export const approveUserHandler = async (req: Request, res: Response) => {
  const userId = req.params.id;
  try {
    const user = await approveUser(userId);
    res.status(StatusCodes.ACCEPTED).json(user);
  } catch (error: any) {
    console.error("Failed to fetch admin contacts", error);
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};
export const disApproveUserHandler = async (req: Request, res: Response) => {
  const userId = req.params.id;
  try {
    const user = await disApproveUser(userId);
    res.status(StatusCodes.ACCEPTED).json(user);
  } catch (error: any) {
    console.error("Failed to fetch admin contacts", error);
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

// NEW ADMIN HANDLERS

// User Management Handlers
export const getAllUsersHandler = async (req: Request, res: Response) => {
  try {
    const parsed = getUsersQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: parsed.error.flatten() });
    }

    const users = await getAllUsers(parsed.data);
    res.status(StatusCodes.OK).json(users);
  } catch (error: any) {
    console.error("Error in getAllUsersHandler:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Internal server error" });
  }
};

export const getUserByIdHandler = async (req: Request, res: Response) => {
  try {
    const parsed = getUserByIdSchema.safeParse(req.params);
    if (!parsed.success) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: parsed.error.flatten() });
    }

    const user = await getUserById(parsed.data.id);
    res.status(StatusCodes.OK).json(user);
  } catch (error: any) {
    console.error("Error in getUserByIdHandler:", error);
    if (error instanceof NotFoundError) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: error.message });
    }
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Internal server error" });
  }
};

export const updateUserByIdHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: parsed.error.flatten() });
    }

    const user = await updateUserById(userId, parsed.data);
    res.status(StatusCodes.OK).json(user);
  } catch (error: any) {
    console.error("Error in updateUserByIdHandler:", error);
    if (error instanceof NotFoundError) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: error.message });
    }
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Internal server error" });
  }
};

export const updateUserStatusHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const parsed = updateUserStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: parsed.error.flatten() });
    }

    const user = await updateUserStatus(userId, parsed.data);
    res.status(StatusCodes.OK).json(user);
  } catch (error: any) {
    console.error("Error in updateUserStatusHandler:", error);
    if (error instanceof NotFoundError) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: error.message });
    }
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Internal server error" });
  }
};

export const deleteUserByIdHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const result = await deleteUserById(userId);
    res.status(StatusCodes.OK).json(result);
  } catch (error: any) {
    console.error("Error in deleteUserByIdHandler:", error);
    if (error instanceof NotFoundError) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: error.message });
    }
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Internal server error" });
  }
};

// Match Management Handlers
export const getAllMatchesHandler = async (req: Request, res: Response) => {
  try {
    const parsed = getMatchesQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: parsed.error.flatten() });
    }

    const matches = await getAllMatches(parsed.data);
    res.status(StatusCodes.OK).json(matches);
  } catch (error: any) {
    console.error("Error in getAllMatchesHandler:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Internal server error" });
  }
};

export const getMatchByIdHandler = async (req: Request, res: Response) => {
  try {
    const matchId = req.params.id;
    const match = await getMatchById(matchId);
    res.status(StatusCodes.OK).json(match);
  } catch (error: any) {
    console.error("Error in getMatchByIdHandler:", error);
    if (error instanceof NotFoundError) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: error.message });
    }
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Internal server error" });
  }
};

export const updateMatchByIdHandler = async (req: Request, res: Response) => {
  try {
    const matchId = req.params.id;
    const parsed = updateMatchSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: parsed.error.flatten() });
    }

    const match = await updateMatchById(matchId, parsed.data);
    res.status(StatusCodes.OK).json(match);
  } catch (error: any) {
    console.error("Error in updateMatchByIdHandler:", error);
    if (error instanceof NotFoundError) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: error.message });
    }
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Internal server error" });
  }
};

export const deleteMatchByIdHandler = async (req: Request, res: Response) => {
  try {
    const matchId = req.params.id;
    const result = await deleteMatchById(matchId);
    res.status(StatusCodes.OK).json(result);
  } catch (error: any) {
    console.error("Error in deleteMatchByIdHandler:", error);
    if (error instanceof NotFoundError) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: error.message });
    }
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Internal server error" });
  }
};

// Game Management Handlers
export const getAllGamesHandler = async (req: Request, res: Response) => {
  try {
    const games = await getAllGames();
    res.status(StatusCodes.OK).json(games);
  } catch (error: any) {
    console.error("Error in getAllGamesHandler:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Internal server error" });
  }
};

export const getGameByIdHandler = async (req: Request, res: Response) => {
  try {
    const gameId = req.params.id;
    const game = await getGameById(gameId);
    res.status(StatusCodes.OK).json(game);
  } catch (error: any) {
    console.error("Error in getGameByIdHandler:", error);
    if (error instanceof NotFoundError) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: error.message });
    }
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Internal server error" });
  }
};

export const createGameHandler = async (req: Request, res: Response) => {
  try {
    const parsed = createGameSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: parsed.error.flatten() });
    }

    const game = await createGame(parsed.data);
    res.status(StatusCodes.CREATED).json(game);
  } catch (error: any) {
    console.error("Error in createGameHandler:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Internal server error" });
  }
};

export const updateGameByIdHandler = async (req: Request, res: Response) => {
  try {
    const gameId = req.params.id;
    const parsed = updateGameSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: parsed.error.flatten() });
    }

    const game = await updateGameById(gameId, parsed.data);
    res.status(StatusCodes.OK).json(game);
  } catch (error: any) {
    console.error("Error in updateGameByIdHandler:", error);
    if (error instanceof NotFoundError) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: error.message });
    }
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Internal server error" });
  }
};

export const deleteGameByIdHandler = async (req: Request, res: Response) => {
  try {
    const gameId = req.params.id;
    const result = await deleteGameById(gameId);
    res.status(StatusCodes.OK).json(result);
  } catch (error: any) {
    console.error("Error in deleteGameByIdHandler:", error);
    if (error instanceof NotFoundError) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: error.message });
    }
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Internal server error" });
  }
};

// Report Management Handlers
export const getAllReportsHandler = async (req: Request, res: Response) => {
  try {
    const parsed = getReportsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: parsed.error.flatten() });
    }

    const reports = await getAllReports(parsed.data);
    res.status(StatusCodes.OK).json(reports);
  } catch (error: any) {
    console.error("Error in getAllReportsHandler:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Internal server error" });
  }
};

export const getReportByIdHandler = async (req: Request, res: Response) => {
  try {
    const reportId = req.params.id;
    const report = await getReportById(reportId);
    res.status(StatusCodes.OK).json(report);
  } catch (error: any) {
    console.error("Error in getReportByIdHandler:", error);
    if (error instanceof NotFoundError) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: error.message });
    }
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Internal server error" });
  }
};

export const updateReportByIdHandler = async (req: Request, res: Response) => {
  try {
    const reportId = req.params.id;
    const adminId = (req as any).user?.id; // Assumes auth middleware adds user to request
    const parsed = updateReportSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: parsed.error.flatten() });
    }

    const report = await updateReportById(reportId, parsed.data, adminId);
    res.status(StatusCodes.OK).json(report);
  } catch (error: any) {
    console.error("Error in updateReportByIdHandler:", error);
    if (error instanceof NotFoundError) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: error.message });
    }
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Internal server error" });
  }
};

export const createUserReportHandler = async (req: Request, res: Response) => {
  try {
    const reporterId = (req as any).user?.id; // Assumes auth middleware adds user to request
    const parsed = createUserReportSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: parsed.error.flatten() });
    }

    const report = await createUserReport(parsed.data, reporterId);
    res.status(StatusCodes.CREATED).json(report);
  } catch (error: any) {
    console.error("Error in createUserReportHandler:", error);
    if (error instanceof NotFoundError) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: error.message });
    }
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Internal server error" });
  }
};

export const deleteReportByIdHandler = async (req: Request, res: Response) => {
  try {
    const reportId = req.params.id;
    const result = await deleteReportById(reportId);
    res.status(StatusCodes.OK).json(result);
  } catch (error: any) {
    console.error("Error in deleteReportByIdHandler:", error);
    if (error instanceof NotFoundError) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: error.message });
    }
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Internal server error" });
  }
};

// Payment Analytics Handlers
export const getPaymentAnalyticsHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const parsed = getPaymentAnalyticsSchema.safeParse(req.query);
    if (!parsed.success) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: parsed.error.flatten() });
    }

    const analytics = await getPaymentAnalytics(parsed.data);
    res.status(StatusCodes.OK).json(analytics);
  } catch (error: any) {
    console.error("Error in getPaymentAnalyticsHandler:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Internal server error" });
  }
};

export const getAllPaymentsHandler = async (req: Request, res: Response) => {
  try {
    const parsed = getPaymentsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: parsed.error.flatten() });
    }

    const payments = await getAllPayments(parsed.data);
    res.status(StatusCodes.OK).json(payments);
  } catch (error: any) {
    console.error("Error in getAllPaymentsHandler:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Internal server error" });
  }
};

// Refund Management Handlers
export const getPaymentByIdHandler = async (req: Request, res: Response) => {
  try {
    const paymentId = req.params.id;
    const payment = await getPaymentById(paymentId);
    res.status(StatusCodes.OK).json(payment);
  } catch (error: any) {
    console.error("Error in getPaymentByIdHandler:", error);
    if (error instanceof NotFoundError) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: error.message });
    }
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Internal server error" });
  }
};

export const createRefundHandler = async (req: Request, res: Response) => {
  try {
    const paymentId = req.params.id;
    const adminId = (req as any).user?.id;

    if (!adminId) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ error: "Admin authentication required" });
    }

    const parsed = createRefundSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: parsed.error.flatten() });
    }

    // Additional validation for refund amount
    if (parsed.data.amount <= 0) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "Refund amount must be positive" });
    }

    const refund = await createRefund(paymentId, parsed.data, adminId);
    res.status(StatusCodes.CREATED).json({
      message: "Refund processed successfully",
      refund,
    });
  } catch (error: any) {
    console.error("Error in createRefundHandler:", error);
    if (error instanceof NotFoundError) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: error.message });
    }
    if (error instanceof BadRequestError) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: error.message });
    }
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Failed to process refund" });
  }
};

export const getAllRefundsHandler = async (req: Request, res: Response) => {
  try {
    const parsed = getRefundsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: parsed.error.flatten() });
    }

    const refunds = await getAllRefunds(parsed.data);
    res.status(StatusCodes.OK).json(refunds);
  } catch (error: any) {
    console.error("Error in getAllRefundsHandler:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Internal server error" });
  }
};
// export const getFilteredUsersHandler = async (req: Request, res: Response) => {
//   const query = req.query;
//   try {
//     const users = (await getFilteredUsers(query)) as GetFilteredUsersInput;
//     res.status(StatusCodes.CREATED).json(users);
//   } catch (error: any) {
//     console.error("Failed to fetch users", error);
//     res.status(error.statusCode || 500).json({ message: error.message });
//   }
// };
