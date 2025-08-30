import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

import { z } from "zod";

export const facebookRegisterSchema = z.object({
  token: z.string({
    required_error: "Facebook token required",
    invalid_type_error: "Token must be a string",
  }),
});

export const facebookLoginSchema = z.object({
  token: z.string({
    required_error: "Facebook token required",
    invalid_type_error: "Token must be a string",
  }),
});

import { facebookRegisterService, facebookLoginService } from "./usersService";

export async function facebookRegisterHandler(req: Request, res: Response) {
  const parsed = facebookRegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors });
  }
  const { token } = parsed.data;
  try {
    const { user, accessToken, refreshToken } = await facebookRegisterService(
      token
    );
    res.status(StatusCodes.CREATED).json({ user, accessToken, refreshToken });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
}

export async function facebookLoginHandler(req: Request, res: Response) {
  const parsed = facebookLoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors });
  }
  const { token } = parsed.data;
  try {
    const { user, accessToken, refreshToken } = await facebookLoginService(
      token
    );
    res.status(StatusCodes.OK).json({ user, accessToken, refreshToken });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
}
import { switchUserTeam } from "./usersService";
export async function switchTeamHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user.id;
    const matchId = req.params.matchId;
    const result = await switchUserTeam(userId, matchId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
import { NextFunction } from "express";
import { unpinMatchForUser } from "./usersService";

export async function unpinMatchHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user.id;
    const { matchId } = req.body;
    if (!matchId) {
      return res.status(400).json({ error: "matchId is required" });
    }
    const result = await unpinMatchForUser(userId, matchId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
import { pinMatchForUser, getUserPinnedMatches } from "./usersService";

export async function pinMatchHandler(req: Request, res: Response) {
  try {
    const userId = req.user.id;
    const { matchId } = req.body;
    if (!matchId) {
      throw new BadRequestError("matchId is required");
    }
    const pinned = await pinMatchForUser(userId, matchId);
    res
      .status(StatusCodes.OK)
      .json({ message: "Match pinned successfully", pinned });
  } catch (err: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ error: err.message });
  }
}

export async function getUserPinnedMatchesHandler(req: Request, res: Response) {
  try {
    const userId = req.user.id;
    const matches = await getUserPinnedMatches(userId);
    res.status(StatusCodes.OK).json({ matches });
  } catch (err: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ error: err.message });
  }
}
import { StatusCodes } from "http-status-codes";

import { Response, Request } from "express";
import {
  CheckEmailInput,
  CheckPhoneInput,
  CreateUserInput,
  LoginUserInput,
  UpdateUserInput,
  ResetPasswordByTokenInput,
  GetUserByIdInput,
} from "./usersSchema";
import {
  createTokenForUser,
  generateAccessToken,
  hashToken,
  verifyRefreshToken,
} from "../../utils";
import {
  applyPhoneOtp,
  checkEmail,
  checkPhoneNumber,
  createUser,
  generateOTP,
  getUserByInfo,
  loginUser,
  sendPhoneOtp,
  updateUser,
  markAllNotificationsAsSeen,
  getUserPayments,
  getUserPaymentById,
  // sendOtp,
} from "./usersService";

import {
  BadRequestError,
  NotFoundError,
  UnAuthorizedError,
} from "../../errors";

import logUserActivity, {
  UserActivityType,
} from "../../middleware/userActivities";
import {
  findRefreshTokenById,
  forgotPassword,
  resetPasswordByToken,
} from "./authService";
import {
  deleteUser,
  deactivateUser,
  reactivateUser,
  getUserPublicInfo,
} from "./usersService";

export async function registerUserHandler(req: Request, res: Response) {
  try {
    const body = req.body as CreateUserInput;

    const user = await createUser(body);
    if (!user.email) {
      throw new Error("User email is missing");
    }
    const { accessToken, refreshToken } = await createTokenForUser({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res
      .status(StatusCodes.CREATED)
      .json({ ...user, accessToken, refreshToken });

    // logUserActivity(
    //   {
    //     activity: UserActivityType.PROFILE_CREATE,
    //     details: { ...req.body },
    //     ipAddress: req.ip,
    //   },
    //   user.id
    // );
  } catch (err: any) {
    console.error("Error:", err);

    logUserActivity(
      {
        activity: UserActivityType.PROFILE_CREATE_FAILED,
        details: req.body,
        errorMessage: err?.message || "",
        ipAddress: req.ip,
      },
      ""
    );

    if (err instanceof NotFoundError) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: err.message });
    } else if (err instanceof UnAuthorizedError) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ error: err.message });
    } else if (err instanceof BadRequestError) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: err.message });
    }

    return res.status(StatusCodes.BAD_REQUEST).json({ error: err });
  }
}
export async function updateUserHandler(req: Request, res: Response) {
  try {
    const userId = req?.user?.id;
    if (!userId) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ error: "User not authorized" });
    }

    const body = req.body as any;

    const user = await updateUser(userId, body);
    if (!user.email) {
      throw new Error("User email is missing");
    }

    const { accessToken, refreshToken } = await createTokenForUser({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(StatusCodes.OK).json({ ...user, accessToken, refreshToken });

    // logUserActivity(
    //   {
    //     activity: UserActivityType.PROFILE_UPDATE,
    //     details: req.body,
    //     ipAddress: req.ip,
    //   },
    //   user.id
    // );
  } catch (err: any) {
    console.error("Error:", err);

    // logUserActivity(
    //   {
    //     activity: UserActivityType.PROFILE_UPDATE_FAILED,
    //     details: req.body,
    //     errorMessage: err?.message || "",
    //     ipAddress: req.ip,
    //   },
    //   req.params.id || ""
    // );

    if (err instanceof NotFoundError) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: err.message });
    } else if (err instanceof UnAuthorizedError) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ error: err.message });
    } else if (err instanceof BadRequestError) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: err.message });
    }

    return res.status(StatusCodes.BAD_REQUEST).json({ error: err });
  }
}
export async function loginUserHandler(req: Request, res: Response) {
  const body = req.body;
  try {
    const user = await loginUser(body as LoginUserInput);
    if (user && user.email) {
      const { accessToken, refreshToken } = await createTokenForUser({
        id: user.id,
        email: user.email,
        role: "ADMIN",
      });
      logUserActivity(
        {
          activity: UserActivityType.LOGIN_SUCCESS,
          details: body,
          ipAddress: req.ip,
        },
        user.id
      );
      res.status(StatusCodes.OK).json({
        user,
        accessToken,
        refreshToken,
      });
    } else {
      logUserActivity(
        {
          activity: UserActivityType.LOGIN_FAILURE,
          details: body,
          ipAddress: req.ip,
        },
        ""
      );

      // Handle the case where loginUser returns undefined (e.g., due to an error)
      res.status(StatusCodes.BAD_REQUEST).json({ user });
    }
  } catch (error: any) {
    console.error("Error:", error);
    // Return the actual error message in the response
    logUserActivity(
      {
        activity: UserActivityType.LOGIN_FAILURE,
        details: body,
        ipAddress: req.ip,
        errorMessage: error?.message ? error?.message : "",
      },
      ""
    );
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error?.message);
  }
}
export async function refreshTokenHandler(req: Request, res: Response) {
  const { refreshToken } = req.body;
  try {
    if (!refreshToken) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "Refresh token is required",
      });
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "Invalid refresh token",
      });
    }

    const savedRefreshToken = await findRefreshTokenById(payload.jti as string);
    if (!savedRefreshToken || savedRefreshToken.revoked) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "Invalid refresh token",
      });
    }

    const hashedToken = hashToken(refreshToken);
    if (hashedToken !== savedRefreshToken.token) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "Invalid refresh token",
      });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "User not found",
      });
    }

    //we can revoke the refresh token if we want to and generate a new one after nb of refreshes

    // await revokeRefreshToken(savedRefreshToken.id);

    // const { accessToken, refreshToken: newRefreshToken } =
    //   await createTokenForUser({
    //     id: user.id,
    //     email: user.email,
    //     role: user.role
    //   });
    if (!user.email) {
      // Handle missing email case
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "User email is missing" });
    }
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return res
      .status(StatusCodes.OK)
      .json({ accessToken, refreshToken: savedRefreshToken.token });
  } catch (err) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      message: "Refresh token is required",
    });
  }
}
export async function getInfoUserHandler(req: Request, res: Response) {
  const userId = req.user.id;

  try {
    const userInfo = await getUserByInfo(userId);
    if (userId && userInfo) {
      res.status(StatusCodes.OK).json({
        ...userInfo,
      });
    } else {
      // Handle the case where loginUser returns undefined (e.g., due to an error)
      res.status(StatusCodes.BAD_REQUEST).json({ message: "Bad req" });
    }
  } catch (error: any) {
    console.log("Error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error?.message);
  }
}

export async function registerAdminUserHandler(req: Request, res: Response) {
  // fix later
  if (req.user.role !== "ADMIN") {
    throw new UnAuthorizedError("You are not authorized to access this route");
  }
  const body = req.body as CreateUserInput;
  const user = await createUser(body);
  res.status(StatusCodes.CREATED).json({
    ...user,
  });
}

export async function sendOtpHandler(req: Request, res: Response) {
  const { phoneNumber } = req.body;

  try {
    // Validate UAE phone number format (e.g. +9715XXXXXXXX)
    if (typeof phoneNumber !== "string" || !/^\+9715\d{8}$/.test(phoneNumber)) {
      throw new BadRequestError("Invalid UAE phone number format.");
    }

    // Delegate to service (which handles DB updates + mock sending)
    await sendPhoneOtp({ phoneNumber });

    return res.status(StatusCodes.OK).json({
      message: "OTP sent successfully.",
    });
  } catch (err: any) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      error: err?.message || "Failed to send OTP.",
    });
  }
}
export async function applyOtpHandler(req: Request, res: Response) {
  const { phoneNumber, otp } = req.body;
  console.log("applyOtpHandler", { phoneNumber, otp });
  try {
    // Validate inputs
    if (typeof phoneNumber !== "string" || !/^\+9715\d{8}$/.test(phoneNumber)) {
      throw new BadRequestError("Invalid UAE phone number format.");
    }

    if (typeof otp !== "string" || otp.length !== 4 || !/^\d{4}$/.test(otp)) {
      throw new BadRequestError("Invalid OTP format. Must be 4 digits.");
    }

    // Delegate to service to apply OTP logic
    await applyPhoneOtp({ phoneNumber, otp });

    return res.status(StatusCodes.OK).json({
      message: "OTP verified successfully.",
    });
  } catch (err: any) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      error: err?.message || "Failed to verify OTP.",
    });
  }
}

export async function checkPhoneHandler(req: Request, res: Response) {
  try {
    const body = req.body as CheckPhoneInput;
    const result = await checkPhoneNumber(body);
    res.status(StatusCodes.OK).json(result);
  } catch (err: any) {
    return res.status(StatusCodes.BAD_REQUEST).json({ error: err.message });
  }
}

export async function checkEmailHandler(req: Request, res: Response) {
  try {
    const body = req.body as CheckEmailInput;
    const result = await checkEmail(body);
    res.status(StatusCodes.OK).json(result);
  } catch (err: any) {
    return res.status(StatusCodes.BAD_REQUEST).json({ error: err.message });
  }
}

export async function deleteUserHandler(req: Request, res: Response) {
  const userId = req.user.id;
  try {
    await deleteUser(userId);
    res.status(StatusCodes.OK).json({ message: "User deleted successfully" });
  } catch (err: any) {
    return res.status(StatusCodes.BAD_REQUEST).json({ error: err.message });
  }
}

export async function deactivateUserHandler(req: Request, res: Response) {
  const userId = req.user.id;

  try {
    await deactivateUser(userId);
    res
      .status(StatusCodes.OK)
      .json({ message: "User deactivated successfully" });
  } catch (err: any) {
    return res.status(StatusCodes.BAD_REQUEST).json({ error: err.message });
  }
}

export async function reactivateUserHandler(req: Request, res: Response) {
  const userId = req.user.id;
  try {
    await reactivateUser(userId);
    res
      .status(StatusCodes.OK)
      .json({ message: "User reactivated successfully" });
  } catch (err: any) {
    return res.status(StatusCodes.BAD_REQUEST).json({ error: err.message });
  }
}

export async function forgotPasswordHandler(req: Request, res: Response) {
  const { email } = req.body;
  try {
    await forgotPassword(email);
    res
      .status(StatusCodes.OK)
      .json({ message: "Password reset email sent successfully" });
  } catch (err: any) {
    return res.status(StatusCodes.BAD_REQUEST).json({ error: err.message });
  }
}

export async function resetPasswordByTokenHandler(req: Request, res: Response) {
  const body = req.body as ResetPasswordByTokenInput;
  try {
    await resetPasswordByToken(body);
    res
      .status(StatusCodes.OK)
      .json({ message: "Password has been reset successfully" });
  } catch (err: any) {
    return res.status(StatusCodes.BAD_REQUEST).json({ error: err.message });
  }
}

export async function getUserPublicInfoHandler(req: Request, res: Response) {
  const { id } = req.params as GetUserByIdInput;
  try {
    const userInfo = await getUserPublicInfo(id);
    res.status(StatusCodes.OK).json(userInfo);
  } catch (err: any) {
    if (err instanceof NotFoundError) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: err.message });
    }
    return res.status(StatusCodes.BAD_REQUEST).json({ error: err.message });
  }
}

export async function markAllNotificationsAsSeenHandler(
  req: Request,
  res: Response
) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ error: "User not authenticated" });
    }

    const result = await markAllNotificationsAsSeen(userId);
    res.status(StatusCodes.OK).json(result);
  } catch (err: any) {
    console.error("Error marking notifications as seen:", err);
    return res.status(StatusCodes.BAD_REQUEST).json({ error: err.message });
  }
}

export async function getUserPaymentsHandler(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ error: "User not authenticated" });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const payments = await getUserPayments(userId, page, limit);
    res.status(StatusCodes.OK).json(payments);
  } catch (err: any) {
    console.error("Error fetching user payments:", err);
    return res.status(StatusCodes.BAD_REQUEST).json({ error: err.message });
  }
}

export async function getUserPaymentByIdHandler(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ error: "User not authenticated" });
    }

    const { paymentId } = req.params;
    const payment = await getUserPaymentById(userId, paymentId);
    res.status(StatusCodes.OK).json(payment);
  } catch (err: any) {
    console.error("Error fetching payment details:", err);
    if (err instanceof NotFoundError) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: err.message });
    }
    return res.status(StatusCodes.BAD_REQUEST).json({ error: err.message });
  }
}
export async function updateExpoPushTokenHandler(req: Request, res: Response) {
  const { userId, expoPushToken } = req.body;
  if (!userId || !expoPushToken) {
    return res.status(400).json({ error: "userId and expoPushToken required" });
  }
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { expoPushToken },
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update Expo push token" });
  }
}
