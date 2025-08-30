import axios from "axios";
import { createTokenForUser } from "../../utils";
import { StatusCodes } from "http-status-codes";
import { userSelectionForLogin } from "./usersSchema";

// Helper to get Facebook user info from token
async function getFacebookUserInfo(token: string) {
  const fields = "id,name,email";
  const url = `https://graph.facebook.com/me?fields=${fields}&access_token=${token}`;
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error: any) {
    throw new Error("Invalid Facebook token or unable to fetch user info");
  }
}

export async function facebookRegisterService(token: string) {
  // Get user info from Facebook
  const fbUser = await getFacebookUserInfo(token);
  if (!fbUser.email) throw new Error("Facebook account has no email");

  // Check if user exists
  let user = await prisma.user.findUnique({ where: { email: fbUser.email } });
  if (user) throw new Error("User already exists. Please login.");

  // Create user
  const newUser = await prisma.user.create({
    data: {
      email: fbUser.email,
      name: fbUser.name,
      bySocial: true,
      password: Math.random().toString(36).slice(-8), // random password
    },
    select: userSelectionForLogin,
  });

  // Generate tokens
  const { accessToken, refreshToken } = await createTokenForUser({
    id: newUser.id,
    email: newUser.email || "",
    role: newUser.role,
  });
  return { user: newUser, accessToken, refreshToken };
}

export async function facebookLoginService(token: string) {
  // Get user info from Facebook
  const fbUser = await getFacebookUserInfo(token);
  if (!fbUser.email) throw new Error("Facebook account has no email");

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: fbUser.email },
    select: userSelectionForLogin,
  });
  if (!user || !user.bySocial)
    throw new Error("No social account found. Please register.");

  // Generate tokens
  const { accessToken, refreshToken } = await createTokenForUser({
    id: user.id,
    email: user.email || "",
    role: user.role,
  });
  return { user, accessToken, refreshToken };
}
export async function switchUserTeam(userId: string, matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { participants: true },
  });
  if (!match) throw new BadRequestError("Match not found");
  if (match.maxPlayers <= 2) throw new BadRequestError("Not a team game");
  const participant = match.participants.find((p) => p.userId === userId);
  if (!participant) throw new BadRequestError("User not in match");
  const newTeam = participant.team === 1 ? 2 : 1;
  await prisma.matchParticipant.update({
    where: { userId_matchId: { userId, matchId } },
    data: { team: newTeam },
  });
  return { message: `Switched to team ${newTeam}` };
}
export async function unpinMatchForUser(userId: string, matchId: string) {
  try {
    const existing = await prisma.userPinnedMatch.findUnique({
      where: { userId_matchId: { userId, matchId } },
    });
    if (!existing) {
      throw new BadRequestError("Pinned match not found.");
    }
    await prisma.userPinnedMatch.delete({
      where: { userId_matchId: { userId, matchId } },
    });
    return { message: "Match unpinned successfully." };
  } catch (error: any) {
    throw new BadRequestError(error.message || "Failed to unpin match.");
  }
}
export async function pinMatchForUser(userId: string, matchId: string) {
  try {
    const existing = await prisma.userPinnedMatch.findUnique({
      where: { userId_matchId: { userId, matchId } },
    });
    if (existing) {
      throw new BadRequestError("Match already pinned.");
    }
    const pinned = await prisma.userPinnedMatch.create({
      data: { userId, matchId },
    });
    return pinned;
  } catch (error: any) {
    throw new BadRequestError(error.message || "Failed to pin match.");
  }
}

export async function getUserPinnedMatches(userId: string) {
  try {
    // Use 'include' and spread matchSelection into the match include
    const pinnedMatches = await prisma.userPinnedMatch.findMany({
      where: { userId },
      include: {
        match: {
          select: matchSelection,
        },
      },
    });
    // Add isPinned: true to each match for parity
    return pinnedMatches.map((pm) => ({
      ...pm.match,
      isPinned: true,
    }));
  } catch (error: any) {
    throw new BadRequestError("Failed to get pinned matches.");
  }
}
import {
  CheckEmailInput,
  CheckPhoneInput,
  CreateUserInput,
  LoginUserInput,
  UpdateUserInput,
  userOtpSelection,
  userSelection,
  userWithParticipatedMatchesSelection,
  publicUserSelection,
  ScoreInput,
} from "./usersSchema";
import firebaseAdmin from "firebase-admin";
import { prisma } from "../../db/db";
import { calculateUserOverallRating } from "../rating/ratingService";
import { BadRequestError, NotFoundError } from "../../errors";
import { comparePassword, hashPassword } from "../../utils";
import { GameLevel, Role } from "@prisma/client";
import { matchSelection } from "../match/matchSchema";

/// check profile link function

export async function markAllNotificationsAsSeen(userId: string) {
  try {
    const result = await prisma.notification.updateMany({
      where: {
        userId: userId,
        seen: false,
      },
      data: {
        seen: true,
      },
    });

    return {
      message: "All notifications marked as seen",
      updatedCount: result.count,
    };
  } catch (error: any) {
    throw new BadRequestError("Failed to mark notifications as seen");
  }
}

export async function getUserPayments(
  userId: string,
  page: number = 1,
  limit: number = 10
) {
  try {
    const [payments, totalPayments] = await Promise.all([
      prisma.payment.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          description: true,
          paymentMethod: true,
          refundAmount: true,
          refundReason: true,
          refundedAt: true,
          createdAt: true,
          match: {
            select: {
              id: true,
              scheduledAt: true,
              status: true,
              game: {
                select: {
                  name: true,
                },
              },
              location: {
                select: {
                  name: true,
                  city: true,
                },
              },
            },
          },
        },
      }),
      prisma.payment.count({ where: { userId } }),
    ]);

    // Calculate totals
    const totalSpent = await prisma.payment.aggregate({
      where: {
        userId,
        status: { in: ["COMPLETED", "PARTIALLY_REFUNDED", "REFUNDED"] },
      },
      _sum: { amount: true },
    });

    const totalRefunded = await prisma.payment.aggregate({
      where: { userId, status: { in: ["REFUNDED", "PARTIALLY_REFUNDED"] } },
      _sum: { refundAmount: true },
    });

    return {
      payments,
      totalPayments,
      totalPages: Math.ceil(totalPayments / limit),
      currentPage: page,
      summary: {
        totalSpent: totalSpent._sum.amount || 0,
        totalRefunded: totalRefunded._sum.refundAmount || 0,
        netSpent:
          (totalSpent._sum.amount || 0) -
          (totalRefunded._sum.refundAmount || 0),
      },
    };
  } catch (error: any) {
    throw new BadRequestError("Failed to fetch user payments");
  }
}

export async function getUserPaymentById(userId: string, paymentId: string) {
  try {
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, userId },
      select: {
        id: true,
        stripePaymentId: true,
        amount: true,
        currency: true,
        status: true,
        description: true,
        paymentMethod: true,
        refundAmount: true,
        refundReason: true,
        refundedAt: true,
        createdAt: true,
        updatedAt: true,
        match: {
          select: {
            id: true,
            scheduledAt: true,
            status: true,
            maxPlayers: true,
            pricePerUser: true,
            game: {
              select: {
                name: true,
              },
            },
            location: {
              select: {
                name: true,
                city: true,
                country: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundError("Payment not found");
    }

    return payment;
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new BadRequestError("Failed to fetch payment details");
  }
}

export async function createUser(body: CreateUserInput) {
  if (!body.email) {
    throw new BadRequestError("Email is missing");
  }
  if (!body.phoneNumber) {
    throw new BadRequestError("phoneNumber is missing");
  }
  const userExists = await prisma.user.findUnique({
    where: { email: body.email },
  });

  if (userExists) {
    throw new BadRequestError("Email already in use");
  }
  const phoneExists = await prisma.user.findUnique({
    where: { phoneNumber: body.phoneNumber },
  });
  // console.log("phoneExists", phoneExists);
  if (phoneExists) {
    throw new BadRequestError("phone number is already in use");
  }
  if (!body.bySocial) {
    if (!body.password) {
      throw new BadRequestError("Password is missing");
    }

    if (!body.name) {
      throw new BadRequestError("Name is missing");
    }

    const hashedPassword = hashPassword(body.password);
    const otp = generateOTP();

    try {
      const {
        firebaseToken,
        games,
        locations,
        profileImage,
        quoteType,
        quoteAnswer,
        gamesPlayed,
        gamesLevel,
        ...data
      } = body;

      const user = await prisma.user.create({
        data: {
          ...data,
          // No role passed here, so Prisma default REGULAR applies
          otp,
          password: hashedPassword,
          profileImage: profileImage?.url
            ? {
                create: {
                  publicId: profileImage.publicId,
                  url: profileImage.url,
                  fileName: profileImage.fileName,
                },
              }
            : undefined,
          games: body.gamesLevel?.length
            ? {
                create: body.gamesLevel.map((g) => {
                  const score = calculateUserGameScore({
                    level: g.level,
                    frequency: g.frequency,
                    userSelfRating: g.userSelfRating,
                    startDate: g.startDate,
                    gameId: g.gameId,
                  });

                  return {
                    game: { connect: { id: g.gameId } },
                    level: g.level,
                    gameScore: {
                      create: {
                        level: g.level,
                        gameId: g.gameId,
                        score,
                        frequency: g.frequency,
                        userSelfRating: g.userSelfRating,
                        startDate: g.startDate,
                      },
                    },
                  };
                }),
              }
            : undefined,
          locations: locations?.length
            ? {
                create: locations.map((loc) => ({
                  name: loc.name,
                  longitude: loc.longitude,
                  latitude: loc.latitude,
                  city: loc.city,
                  country: loc.country,
                })),
              }
            : undefined,
          gamesPlayed: gamesPlayed,
        },
        select: userOtpSelection,
      });

      if (!process.env.DISABLE_OTP) {
        await sendPhoneOtp({
          phoneNumber: body.phoneNumber,
        });
      }

      return user;
    } catch (error) {
      throw error;
    }
  } else {
    // Social login flow
    try {
      if (!body.firebaseToken) {
        throw new BadRequestError("firebaseToken missing");
      }
      const firebaseUid = await verifyIdToken(body.firebaseToken);
      const user = await createUserWithFirebaseUID(firebaseUid.uid, body);
      // welcomeEmail({ to: body.email, otp: "1111", name: body.name });
      return user;
    } catch (error) {
      throw error;
    }
  }
}
// Calculates a player's score for a game based on multiple factors:
// - Base level (BEGINNER, INTERMEDIATE, PROFESSIONAL)
// - Activity (games played per month)
// - Experience (how long they've been playing)
// - Confidence (% fine-tuning/self-estimation)

// Calculates a user's score within their self-declared level.
// The score will always be capped at 99 during registration.
// This allows determining "how much of a beginner/intermediate/professional" they are.
// Promotion to the next level can happen later when score exceeds 100.

export function calculateUserGameScore(input: ScoreInput): number {
  const baseLevel = levelToNumber(input.level); // 1 (Beginner), 2 (Intermediate), 3 (Professional)

  // How many months since the user started playing
  const months = monthsSince(input.startDate);

  // Normalize frequency: max 12 games/month = 1.0 weight
  const activityWeight = Math.min(input.frequency, 12) / 12;

  // Normalize self-rating (fine-tuning %): 0–100% → 0.0–1.0
  const fineTune = Math.min(input.userSelfRating, 100) / 100;

  // Final score formula:
  // - baseLevel: user-declared level
  // - months / 12: adds scaling based on years of experience
  // - activityWeight: favors more active players
  // - fineTune: reflects user's confidence in their self-declared level
  //
  // Example:
  // Beginner (1), 6 months, plays 10 games/month, 90% confidence
  // → 1 * (1 + 6/12) * (10/30) * 0.9 * 100
  // → 1.5 * 0.33 * 0.9 * 100 ≈ 44
  const rawScore =
    baseLevel * (1 + months / 12) * activityWeight * fineTune * 100;

  // Cap score at 99 during registration. They can only level up later.
  return Math.min(Math.round(rawScore), 99);
}

// Converts GameLevel enum to a numeric base value
export function levelToNumber(level: GameLevel): number {
  switch (level) {
    case "BEGINNER":
      return 1;
    case "INTERMEDIATE":
      return 2;
    case "PROFESSIONAL":
      return 3;
    default:
      return 0;
  }
}

// Calculates number of months from given start date until now
function monthsSince(startDate: string): number {
  const start = new Date(startDate);
  const now = new Date();
  return Math.max(
    (now.getFullYear() - start.getFullYear()) * 12 +
      now.getMonth() -
      start.getMonth(),
    0
  );
}

export async function updateUser(userId: string, body: UpdateUserInput) {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    throw new NotFoundError("User not found");
  }

  const {
    email,
    phoneNumber,
    password,
    profileImage,
    games,
    gamesLevel,
    locations,
    preferredTimes,
    quoteType,
    quoteAnswer,
    gamesPlayed,
    expoPushToken,
    ...rest
  } = body;

  if (email && email !== existingUser.email) {
    const emailInUse = await prisma.user.findUnique({ where: { email } });
    if (emailInUse) {
      throw new BadRequestError("Email already in use");
    }
  }

  if (phoneNumber && phoneNumber !== existingUser.phoneNumber) {
    const phoneInUse = await prisma.user.findUnique({ where: { phoneNumber } });
    if (phoneInUse) {
      throw new BadRequestError("Phone number already in use");
    }
  }

  const updatedData: any = {
    ...rest,
  };

  if (email) updatedData.email = email;
  if (phoneNumber) updatedData.phoneNumber = phoneNumber;
  if (preferredTimes !== undefined) updatedData.preferredTimes = preferredTimes;
  if (quoteType !== undefined) updatedData.quoteType = quoteType;
  if (quoteAnswer !== undefined) updatedData.quoteAnswer = quoteAnswer;
  if (gamesPlayed !== undefined) updatedData.gamesPlayed = gamesPlayed;
  if (expoPushToken !== undefined) updatedData.expoPushToken = expoPushToken;

  // Profile Image update logic
  if (profileImage?.url) {
    updatedData.profileImage = {
      upsert: {
        update: {
          publicId: profileImage.publicId,
          url: profileImage.url,
          fileName: profileImage.fileName,
        },
        create: {
          publicId: profileImage.publicId,
          url: profileImage.url,
          fileName: profileImage.fileName,
        },
      },
    };
  }

  // Games update logic
  if (games?.length) {
    await prisma.userGame.deleteMany({ where: { userId } });
    updatedData.games = {
      create: games.map((g: any) => ({
        game: { connect: { id: g.gameId } },
        level: g.level,
        gameScore: {
          create: {
            startDate: g.startDate,
            frequency: g.frequency,
            userSelfRating: g.userSelfRating,
            level: g.level,
          },
        },
      })),
    };
  }

  if (gamesLevel?.length) {
    await prisma.userGame.deleteMany({ where: { userId } });
    updatedData.games = {
      create: gamesLevel.map((g: any) => ({
        game: { connect: { id: g.gameId } },
        level: g.level,
        gameScore: {
          create: {
            startDate: g.startDate,
            frequency: g.frequency,
            userSelfRating: g.userSelfRating,
            level: g.level,
          },
        },
      })),
    };
  }

  // Locations update logic
  if (locations?.length) {
    await prisma.location.deleteMany({ where: { userId } });
    updatedData.locations = {
      create: locations.map((loc: any) => ({
        name: loc.name,
        longitude: loc.longitude,
        latitude: loc.latitude,
        city: loc.city,
        country: loc.country,
      })),
    };
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updatedData,
    select: userOtpSelection,
  });

  return updatedUser;
}

export async function loginUser(loginInput: LoginUserInput) {
  const userToCheck = await prisma.user.findUnique({
    where: {
      email: loginInput.email,
    },
    select: {
      role: true,
      isVerified: true,
      password: true,
      bySocial: true,
    },
  });

  if (!userToCheck) {
    throw new BadRequestError(
      " User not found. Please try signing in with a different account or create a new account."
    );
  }

  try {
    // Authenticate user using Firebase
    // Compare passwords - This part can remain as is

    if (loginInput.bySocial) {
      const user = await loginUserWithFirebase(loginInput);
      // if (
      //   userToCheck.role !== "ADMIN" &&
      // !userToCheck.isVerified &&
      //   !userToCheck.bySocial &&
      //   process.env.NODE_ENV !== "development"
      // ) {
      //   throw new BadRequestError(
      //     "Please verify your email address before logging in."
      //   );
      // }
      return user;
    } else if (!loginInput.bySocial) {
      if (!userToCheck.password || !loginInput.password) {
        throw new BadRequestError("User password not found");
      }
      const passwordMatch = await comparePassword(
        loginInput.password,
        userToCheck.password
      );
      if (!passwordMatch) {
        throw new BadRequestError("Invalid credentials");
      }

      // Retrieve user data from your database - This part can remain as is
      const user = await prisma.user.findUnique({
        where: { email: loginInput.email },
        select: userSelection,
      });

      if (!user) {
        throw new NotFoundError("User not found. Please try again");
      }

      // Optionally, you can also store the Firebase UID in your user's record for future reference
      // user.firebaseUid = userRecord.uid;

      // if (
      //   userToCheck.role !== "ADMIN" &&
      //   !userToCheck.isVerified &&
      //   !userToCheck.bySocial &&
      //   process.env.NODE_ENV !== "development"
      // ) {
      //   throw new BadRequestError(
      //     "Please verify your email address before logging in."
      //   );
      // }
      return user;
    }
  } catch (error) {
    console.log("erorr loggin in", error);
    throw error;
  }
}

export async function registerUserWithFirebase(body: CreateUserInput) {
  try {
    const firebaseUser = await firebaseAdmin.auth().createUser({
      email: body.email,
      password: body.password,
    });

    // If the user has successfully registered with Firebase, you can return the Firebase UID
    return firebaseUser.uid;
  } catch (error) {
    console.error("Firebase registration error:", error);
    throw error;
  }
}
export async function createUserWithFirebaseUID(
  firebaseUid: string,
  body: CreateUserInput,
  role?: Role
) {
  const otp = generateOTP();
  if (!body.email) {
    throw new BadRequestError("Email is missing");
  }

  const {
    firebaseToken,
    games,
    locations,
    profileImage,
    quoteType,
    quoteAnswer,
    gamesPlayed,
    ...data
  } = body;

  try {
    const user = await prisma.user.create({
      data: {
        ...data,
        role: "REGULAR",
        password: body.password ?? "",
        firebaseUid,
        email: body.email,
        quoteType,
        quoteAnswer,
        profileImage: profileImage?.url
          ? {
              create: {
                publicId: profileImage.publicId,
                url: profileImage.url,
                fileName: profileImage.fileName,
              },
            }
          : undefined,
        otp,
        games: games?.length
          ? {
              create: games.map((g) => ({
                game: { connect: { id: g.gameId } },
                level: g.level,
              })),
            }
          : undefined,
        locations: locations?.length
          ? {
              create: locations.map((loc) => ({
                name: loc.name,
                longitude: loc.longitude,
                latitude: loc.latitude,
                city: loc.city,
                country: loc.country,
              })),
            }
          : undefined,
        gamesPlayed: gamesPlayed,
      },
      select: userOtpSelection,
    });

    return user;
  } catch (error) {
    throw error;
  }
}

export async function verifyIdToken(idToken: string) {
  try {
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
    // The ID token is valid. You can access user information like this:
    const uid = decodedToken.uid;
    const email = decodedToken.email;
    // ... Other user information

    // Return user information or perform additional actions
    return { uid, email /*, other user data */ };
  } catch (error) {
    console.error("Error verifying ID token:", error);
    throw error;
  }
}

async function loginUserWithFirebase(loginInput: LoginUserInput) {
  if (!loginInput.firebaseToken) {
    throw new BadRequestError("firebaseToken not found");
  }
  try {
    // Authenticate user using Firebase

    const decodedToken = await firebaseAdmin
      .auth()
      .verifyIdToken(loginInput.firebaseToken);
    const userEmail = decodedToken.email;
    // Optionally, you can also store the Firebase UID in your user's record for future reference
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: userSelection, // Define the fields you want to select
    });
    if (!user) {
      throw new BadRequestError("User not found. Please try again");
    }

    await prisma.user.update({
      where: { id: user.id }, // Assuming you have a unique identifier for users
      data: { firebaseUid: decodedToken.uid },
    });

    return user;
  } catch (error) {
    throw error;
  }
}
export async function validateEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (user) {
    throw new NotFoundError("Email already used");
  } else return { emailAvailable: true };
}

export async function checkPhoneNumber(body: CheckPhoneInput) {
  const { phoneNumber } = body;
  const user = await prisma.user.findUnique({
    where: {
      phoneNumber,
    },
  });

  if (user) {
    return { available: false };
  }
  return { available: true };
}

export async function checkEmail(body: CheckEmailInput) {
  const { email } = body;
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (user) {
    return { available: false };
  }
  return { available: true };
}

export async function getUserByInfo(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userWithParticipatedMatchesSelection,
    });

    if (!user) {
      throw new NotFoundError("No users found.");
    }
    const totalMatchesPlayed = await prisma.matchParticipant.count({
      where: {
        userId: userId,
        match: {
          status: "COMPLETED",
        },
      },
    });
    const overallRating = await calculateUserOverallRating(userId);
    return {
      ...user,
      gamesPlayed: totalMatchesPlayed,
      overallRating,
    };
  } catch (error: any) {
    console.error("Failed to retrieve users:", error);
    throw new Error(
      `Error retrieving users from the database: ${error.message}`
    );
  }
}
export async function createAdminAccount(body: any) {
  const userExists = await prisma.user.findUnique({
    where: {
      email: body.email,
    },
  });
  if (userExists) {
    throw new BadRequestError("Email already in use");
  }

  if (!body.bySocial) {
    if (!body.password) {
      throw new BadRequestError("Password is missing");
    }
    const hashedPassword = hashPassword(body.password);
    const otp = generateOTP();

    try {
      // const firebaseuser = await firebaseAdmin.auth().createUser({
      //   email: body.email,
      //   password: body.password,
      //   displayName: body.name, // Set user's display name
      // });

      const { userCards, firebaseToken, gamesPlayed, ...data } = body;

      const user = await prisma.user.create({
        data: {
          ...data,
          role: "ADMIN",
          otp: otp,
          password: hashedPassword,
          isVerified: true,
          gamesPlayed: gamesPlayed,
        },
        select: userOtpSelection,
      });

      return user;
    } catch (error) {
      throw error;
    }
  } else {
    try {
      if (!body.firebaseToken) {
        throw new BadRequestError("firebaseToken missing");
      }
      const firebaseUid = await verifyIdToken(body.firebaseToken);
      const user = await createUserWithFirebaseUID(
        firebaseUid.uid,
        body,
        "ADMIN"
      );
      // welcomeEmail({ to: body.email, otp: "1111", name: body.name });
      return user;
    } catch (error) {
      throw error;
    }
  }
}

export function generateOTP(length = 4): string {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
}

export async function sendPhoneOtp({ phoneNumber }: { phoneNumber: string }) {
  // Check if user exists
  const user = await prisma.user.findFirst({
    where: { phoneNumber },
  });

  if (!user) {
    throw new BadRequestError("User with this phone number not found");
  }

  // Generate OTP
  const otp = generateOTP(); // e.g. returns 6-digit string

  // Update user with OTP and expiry (5 minutes)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      otp,
      otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
  });

  // Mock send (later will be Twilio)
  console.log(`Mock sending OTP ${otp} to ${phoneNumber}`);

  // Optional: return OTP for testing (disable in prod)
  return { message: "OTP sent", otp }; // remove otp in production
}

export async function applyPhoneOtp({
  phoneNumber,
  otp,
}: {
  phoneNumber: string;
  otp: string;
}) {
  // Find user by phone number
  const user = await prisma.user.findFirst({
    where: { phoneNumber },
  });

  if (!user) {
    throw new BadRequestError("User with this phone number not found");
  }

  if (!user.otp || !user.otpExpiresAt) {
    throw new BadRequestError("No OTP has been requested for this number");
  }

  // Check if OTP is expired
  const now = new Date();
  if (user.otpExpiresAt < now) {
    throw new BadRequestError("OTP has expired. Please request a new one.");
  }

  // Check if OTP matches
  if (user.otp !== otp) {
    throw new BadRequestError("Incorrect OTP");
  }

  // OTP is valid → mark user as verified and clear OTP
  await prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      otp: null,
      otpExpiresAt: null,
    },
  });

  return { message: "OTP verified successfully" };
}

export async function deleteUser(userId: string) {
  return await prisma.user.delete({
    where: {
      id: userId,
    },
  });
}

export async function deactivateUser(userId: string) {
  return await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      deactivated: true,
    },
  });
}

export async function reactivateUser(userId: string) {
  return await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      deactivated: false,
    },
  });
}

export async function getUserPublicInfo(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: publicUserSelection,
    });

    if (!user) {
      throw new NotFoundError("User not found.");
    }

    const overallRating = await calculateUserOverallRating(userId);

    return {
      ...user,
      overallRating,
    };
  } catch (error: any) {
    console.error("Failed to retrieve public user info:", error);
    throw new Error(
      `Error retrieving public user info from the database: ${error.message}`
    );
  }
}
