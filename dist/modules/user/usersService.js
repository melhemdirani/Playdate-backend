"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserPublicInfo = exports.reactivateUser = exports.deactivateUser = exports.deleteUser = exports.applyPhoneOtp = exports.sendPhoneOtp = exports.generateOTP = exports.createAdminAccount = exports.getUserByInfo = exports.checkEmail = exports.checkPhoneNumber = exports.validateEmail = exports.verifyIdToken = exports.createUserWithFirebaseUID = exports.registerUserWithFirebase = exports.loginUser = exports.updateUser = exports.levelToNumber = exports.calculateUserGameScore = exports.createUser = exports.getUserPaymentById = exports.getUserPayments = exports.markAllNotificationsAsSeen = exports.getUserPinnedMatches = exports.pinMatchForUser = exports.unpinMatchForUser = exports.switchUserTeam = exports.facebookLoginService = exports.facebookRegisterService = void 0;
const axios_1 = __importDefault(require("axios"));
const utils_1 = require("../../utils");
const usersSchema_1 = require("./usersSchema");
// Helper to get Facebook user info from token
async function getFacebookUserInfo(token) {
    const fields = "id,name,email";
    const url = `https://graph.facebook.com/me?fields=${fields}&access_token=${token}`;
    try {
        const response = await axios_1.default.get(url);
        return response.data;
    }
    catch (error) {
        throw new Error("Invalid Facebook token or unable to fetch user info");
    }
}
async function facebookRegisterService(token) {
    // Get user info from Facebook
    const fbUser = await getFacebookUserInfo(token);
    if (!fbUser.email)
        throw new Error("Facebook account has no email");
    // Check if user exists
    let user = await db_1.prisma.user.findUnique({ where: { email: fbUser.email } });
    if (user)
        throw new Error("User already exists. Please login.");
    // Create user
    const newUser = await db_1.prisma.user.create({
        data: {
            email: fbUser.email,
            name: fbUser.name,
            bySocial: true,
            password: Math.random().toString(36).slice(-8), // random password
        },
        select: usersSchema_1.userSelectionForLogin,
    });
    // Generate tokens
    const { accessToken, refreshToken } = await (0, utils_1.createTokenForUser)({
        id: newUser.id,
        email: newUser.email || "",
        role: newUser.role,
    });
    return { user: newUser, accessToken, refreshToken };
}
exports.facebookRegisterService = facebookRegisterService;
async function facebookLoginService(token) {
    // Get user info from Facebook
    const fbUser = await getFacebookUserInfo(token);
    if (!fbUser.email)
        throw new Error("Facebook account has no email");
    // Find user
    const user = await db_1.prisma.user.findUnique({
        where: { email: fbUser.email },
        select: usersSchema_1.userSelectionForLogin,
    });
    if (!user || !user.bySocial)
        throw new Error("No social account found. Please register.");
    // Generate tokens
    const { accessToken, refreshToken } = await (0, utils_1.createTokenForUser)({
        id: user.id,
        email: user.email || "",
        role: user.role,
    });
    return { user, accessToken, refreshToken };
}
exports.facebookLoginService = facebookLoginService;
async function switchUserTeam(userId, matchId) {
    const match = await db_1.prisma.match.findUnique({
        where: { id: matchId },
        include: { participants: true },
    });
    if (!match)
        throw new errors_1.BadRequestError("Match not found");
    if (match.maxPlayers <= 2)
        throw new errors_1.BadRequestError("Not a team game");
    const participant = match.participants.find((p) => p.userId === userId);
    if (!participant)
        throw new errors_1.BadRequestError("User not in match");
    const newTeam = participant.team === 1 ? 2 : 1;
    await db_1.prisma.matchParticipant.update({
        where: { userId_matchId: { userId, matchId } },
        data: { team: newTeam },
    });
    return { message: `Switched to team ${newTeam}` };
}
exports.switchUserTeam = switchUserTeam;
async function unpinMatchForUser(userId, matchId) {
    try {
        const existing = await db_1.prisma.userPinnedMatch.findUnique({
            where: { userId_matchId: { userId, matchId } },
        });
        if (!existing) {
            throw new errors_1.BadRequestError("Pinned match not found.");
        }
        await db_1.prisma.userPinnedMatch.delete({
            where: { userId_matchId: { userId, matchId } },
        });
        return { message: "Match unpinned successfully." };
    }
    catch (error) {
        throw new errors_1.BadRequestError(error.message || "Failed to unpin match.");
    }
}
exports.unpinMatchForUser = unpinMatchForUser;
async function pinMatchForUser(userId, matchId) {
    try {
        const existing = await db_1.prisma.userPinnedMatch.findUnique({
            where: { userId_matchId: { userId, matchId } },
        });
        if (existing) {
            throw new errors_1.BadRequestError("Match already pinned.");
        }
        const pinned = await db_1.prisma.userPinnedMatch.create({
            data: { userId, matchId },
        });
        return pinned;
    }
    catch (error) {
        throw new errors_1.BadRequestError(error.message || "Failed to pin match.");
    }
}
exports.pinMatchForUser = pinMatchForUser;
async function getUserPinnedMatches(userId) {
    try {
        // Use 'include' and spread matchSelection into the match include
        const pinnedMatches = await db_1.prisma.userPinnedMatch.findMany({
            where: { userId },
            include: {
                match: {
                    select: matchSchema_1.matchSelection,
                },
            },
        });
        // Add isPinned: true to each match for parity
        return pinnedMatches.map((pm) => ({
            ...pm.match,
            isPinned: true,
        }));
    }
    catch (error) {
        throw new errors_1.BadRequestError("Failed to get pinned matches.");
    }
}
exports.getUserPinnedMatches = getUserPinnedMatches;
const usersSchema_2 = require("./usersSchema");
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const db_1 = require("../../db/db");
const ratingService_1 = require("../rating/ratingService");
const errors_1 = require("../../errors");
const utils_2 = require("../../utils");
const matchSchema_1 = require("../match/matchSchema");
/// check profile link function
async function markAllNotificationsAsSeen(userId) {
    try {
        const result = await db_1.prisma.notification.updateMany({
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
    }
    catch (error) {
        throw new errors_1.BadRequestError("Failed to mark notifications as seen");
    }
}
exports.markAllNotificationsAsSeen = markAllNotificationsAsSeen;
async function getUserPayments(userId, page = 1, limit = 10) {
    try {
        const [payments, totalPayments] = await Promise.all([
            db_1.prisma.payment.findMany({
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
            db_1.prisma.payment.count({ where: { userId } }),
        ]);
        // Calculate totals
        const totalSpent = await db_1.prisma.payment.aggregate({
            where: {
                userId,
                status: { in: ["COMPLETED", "PARTIALLY_REFUNDED", "REFUNDED"] },
            },
            _sum: { amount: true },
        });
        const totalRefunded = await db_1.prisma.payment.aggregate({
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
                netSpent: (totalSpent._sum.amount || 0) -
                    (totalRefunded._sum.refundAmount || 0),
            },
        };
    }
    catch (error) {
        throw new errors_1.BadRequestError("Failed to fetch user payments");
    }
}
exports.getUserPayments = getUserPayments;
async function getUserPaymentById(userId, paymentId) {
    try {
        const payment = await db_1.prisma.payment.findFirst({
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
            throw new errors_1.NotFoundError("Payment not found");
        }
        return payment;
    }
    catch (error) {
        if (error instanceof errors_1.NotFoundError) {
            throw error;
        }
        throw new errors_1.BadRequestError("Failed to fetch payment details");
    }
}
exports.getUserPaymentById = getUserPaymentById;
async function createUser(body) {
    var _a;
    if (!body.email) {
        throw new errors_1.BadRequestError("Email is missing");
    }
    if (!body.phoneNumber) {
        throw new errors_1.BadRequestError("phoneNumber is missing");
    }
    const userExists = await db_1.prisma.user.findUnique({
        where: { email: body.email },
    });
    if (userExists) {
        throw new errors_1.BadRequestError("Email already in use");
    }
    const phoneExists = await db_1.prisma.user.findUnique({
        where: { phoneNumber: body.phoneNumber },
    });
    // console.log("phoneExists", phoneExists);
    if (phoneExists) {
        throw new errors_1.BadRequestError("phone number is already in use");
    }
    if (!body.bySocial) {
        if (!body.password) {
            throw new errors_1.BadRequestError("Password is missing");
        }
        if (!body.name) {
            throw new errors_1.BadRequestError("Name is missing");
        }
        const hashedPassword = (0, utils_2.hashPassword)(body.password);
        const otp = generateOTP();
        try {
            const { firebaseToken, games, locations, profileImage, quoteType, quoteAnswer, gamesPlayed, gamesLevel, ...data } = body;
            const user = await db_1.prisma.user.create({
                data: {
                    ...data,
                    // No role passed here, so Prisma default REGULAR applies
                    otp,
                    password: hashedPassword,
                    profileImage: (profileImage === null || profileImage === void 0 ? void 0 : profileImage.url)
                        ? {
                            create: {
                                publicId: profileImage.publicId,
                                url: profileImage.url,
                                fileName: profileImage.fileName,
                            },
                        }
                        : undefined,
                    games: ((_a = body.gamesLevel) === null || _a === void 0 ? void 0 : _a.length)
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
                    locations: (locations === null || locations === void 0 ? void 0 : locations.length)
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
                select: usersSchema_2.userOtpSelection,
            });
            if (!process.env.DISABLE_OTP) {
                await sendPhoneOtp({
                    phoneNumber: body.phoneNumber,
                });
            }
            return user;
        }
        catch (error) {
            throw error;
        }
    }
    else {
        // Social login flow
        try {
            if (!body.firebaseToken) {
                throw new errors_1.BadRequestError("firebaseToken missing");
            }
            const firebaseUid = await verifyIdToken(body.firebaseToken);
            const user = await createUserWithFirebaseUID(firebaseUid.uid, body);
            // welcomeEmail({ to: body.email, otp: "1111", name: body.name });
            return user;
        }
        catch (error) {
            throw error;
        }
    }
}
exports.createUser = createUser;
// Calculates a player's score for a game based on multiple factors:
// - Base level (BEGINNER, INTERMEDIATE, PROFESSIONAL)
// - Activity (games played per month)
// - Experience (how long they've been playing)
// - Confidence (% fine-tuning/self-estimation)
// Calculates a user's score within their self-declared level.
// The score will always be capped at 99 during registration.
// This allows determining "how much of a beginner/intermediate/professional" they are.
// Promotion to the next level can happen later when score exceeds 100.
function calculateUserGameScore(input) {
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
    const rawScore = baseLevel * (1 + months / 12) * activityWeight * fineTune * 100;
    // Cap score at 99 during registration. They can only level up later.
    return Math.min(Math.round(rawScore), 99);
}
exports.calculateUserGameScore = calculateUserGameScore;
// Converts GameLevel enum to a numeric base value
function levelToNumber(level) {
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
exports.levelToNumber = levelToNumber;
// Calculates number of months from given start date until now
function monthsSince(startDate) {
    const start = new Date(startDate);
    const now = new Date();
    return Math.max((now.getFullYear() - start.getFullYear()) * 12 +
        now.getMonth() -
        start.getMonth(), 0);
}
async function updateUser(userId, body) {
    const existingUser = await db_1.prisma.user.findUnique({
        where: { id: userId },
    });
    if (!existingUser) {
        throw new errors_1.NotFoundError("User not found");
    }
    const { email, phoneNumber, password, profileImage, games, gamesLevel, locations, preferredTimes, quoteType, quoteAnswer, gamesPlayed, expoPushToken, ...rest } = body;
    if (email && email !== existingUser.email) {
        const emailInUse = await db_1.prisma.user.findUnique({ where: { email } });
        if (emailInUse) {
            throw new errors_1.BadRequestError("Email already in use");
        }
    }
    if (phoneNumber && phoneNumber !== existingUser.phoneNumber) {
        const phoneInUse = await db_1.prisma.user.findUnique({ where: { phoneNumber } });
        console.log("phoneInUse", phoneInUse, existingUser);
        if (phoneInUse) {
            throw new errors_1.BadRequestError("Phone number already in use");
        }
    }
    const updatedData = {
        ...rest,
    };
    if (email)
        updatedData.email = email;
    if (phoneNumber)
        updatedData.phoneNumber = phoneNumber;
    if (preferredTimes !== undefined)
        updatedData.preferredTimes = preferredTimes;
    if (quoteType !== undefined)
        updatedData.quoteType = quoteType;
    if (quoteAnswer !== undefined)
        updatedData.quoteAnswer = quoteAnswer;
    if (gamesPlayed !== undefined)
        updatedData.gamesPlayed = gamesPlayed;
    if (expoPushToken !== undefined)
        updatedData.expoPushToken = expoPushToken;
    // Profile Image update logic
    if (profileImage === null || profileImage === void 0 ? void 0 : profileImage.url) {
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
    if (games === null || games === void 0 ? void 0 : games.length) {
        await db_1.prisma.userGame.deleteMany({ where: { userId } });
        updatedData.games = {
            create: games.map((g) => ({
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
    if (gamesLevel === null || gamesLevel === void 0 ? void 0 : gamesLevel.length) {
        await db_1.prisma.userGame.deleteMany({ where: { userId } });
        updatedData.games = {
            create: gamesLevel.map((g) => ({
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
    if (locations === null || locations === void 0 ? void 0 : locations.length) {
        await db_1.prisma.location.deleteMany({ where: { userId } });
        updatedData.locations = {
            create: locations.map((loc) => ({
                name: loc.name,
                longitude: loc.longitude,
                latitude: loc.latitude,
                city: loc.city,
                country: loc.country,
            })),
        };
    }
    const updatedUser = await db_1.prisma.user.update({
        where: { id: userId },
        data: updatedData,
        select: usersSchema_2.userOtpSelection,
    });
    return updatedUser;
}
exports.updateUser = updateUser;
async function loginUser(loginInput) {
    const userToCheck = await db_1.prisma.user.findUnique({
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
        throw new errors_1.BadRequestError(" User not found. Please try signing in with a different account or create a new account.");
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
        }
        else if (!loginInput.bySocial) {
            if (!userToCheck.password || !loginInput.password) {
                throw new errors_1.BadRequestError("User password not found");
            }
            const passwordMatch = await (0, utils_2.comparePassword)(loginInput.password, userToCheck.password);
            if (!passwordMatch) {
                throw new errors_1.BadRequestError("Invalid credentials");
            }
            // Retrieve user data from your database - This part can remain as is
            const user = await db_1.prisma.user.findUnique({
                where: { email: loginInput.email },
                select: usersSchema_2.userSelection,
            });
            if (!user) {
                throw new errors_1.NotFoundError("User not found. Please try again");
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
    }
    catch (error) {
        console.log("erorr loggin in", error);
        throw error;
    }
}
exports.loginUser = loginUser;
async function registerUserWithFirebase(body) {
    try {
        const firebaseUser = await firebase_admin_1.default.auth().createUser({
            email: body.email,
            password: body.password,
        });
        // If the user has successfully registered with Firebase, you can return the Firebase UID
        return firebaseUser.uid;
    }
    catch (error) {
        console.error("Firebase registration error:", error);
        throw error;
    }
}
exports.registerUserWithFirebase = registerUserWithFirebase;
async function createUserWithFirebaseUID(firebaseUid, body, role) {
    var _a;
    const otp = generateOTP();
    if (!body.email) {
        throw new errors_1.BadRequestError("Email is missing");
    }
    const { firebaseToken, games, locations, profileImage, quoteType, quoteAnswer, gamesPlayed, ...data } = body;
    try {
        const user = await db_1.prisma.user.create({
            data: {
                ...data,
                role: "REGULAR",
                password: (_a = body.password) !== null && _a !== void 0 ? _a : "",
                firebaseUid,
                email: body.email,
                quoteType,
                quoteAnswer,
                profileImage: (profileImage === null || profileImage === void 0 ? void 0 : profileImage.url)
                    ? {
                        create: {
                            publicId: profileImage.publicId,
                            url: profileImage.url,
                            fileName: profileImage.fileName,
                        },
                    }
                    : undefined,
                otp,
                games: (games === null || games === void 0 ? void 0 : games.length)
                    ? {
                        create: games.map((g) => ({
                            game: { connect: { id: g.gameId } },
                            level: g.level,
                        })),
                    }
                    : undefined,
                locations: (locations === null || locations === void 0 ? void 0 : locations.length)
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
            select: usersSchema_2.userOtpSelection,
        });
        return user;
    }
    catch (error) {
        throw error;
    }
}
exports.createUserWithFirebaseUID = createUserWithFirebaseUID;
async function verifyIdToken(idToken) {
    try {
        const decodedToken = await firebase_admin_1.default.auth().verifyIdToken(idToken);
        // The ID token is valid. You can access user information like this:
        const uid = decodedToken.uid;
        const email = decodedToken.email;
        // ... Other user information
        // Return user information or perform additional actions
        return { uid, email /*, other user data */ };
    }
    catch (error) {
        console.error("Error verifying ID token:", error);
        throw error;
    }
}
exports.verifyIdToken = verifyIdToken;
async function loginUserWithFirebase(loginInput) {
    if (!loginInput.firebaseToken) {
        throw new errors_1.BadRequestError("firebaseToken not found");
    }
    try {
        // Authenticate user using Firebase
        const decodedToken = await firebase_admin_1.default
            .auth()
            .verifyIdToken(loginInput.firebaseToken);
        const userEmail = decodedToken.email;
        // Optionally, you can also store the Firebase UID in your user's record for future reference
        const user = await db_1.prisma.user.findUnique({
            where: { email: userEmail },
            select: usersSchema_2.userSelection, // Define the fields you want to select
        });
        if (!user) {
            throw new errors_1.BadRequestError("User not found. Please try again");
        }
        await db_1.prisma.user.update({
            where: { id: user.id },
            data: { firebaseUid: decodedToken.uid },
        });
        return user;
    }
    catch (error) {
        throw error;
    }
}
async function validateEmail(email) {
    const user = await db_1.prisma.user.findUnique({
        where: {
            email,
        },
    });
    if (user) {
        throw new errors_1.NotFoundError("Email already used");
    }
    else
        return { emailAvailable: true };
}
exports.validateEmail = validateEmail;
async function checkPhoneNumber(body) {
    const { phoneNumber } = body;
    const user = await db_1.prisma.user.findUnique({
        where: {
            phoneNumber,
        },
    });
    if (user) {
        return { available: false };
    }
    return { available: true };
}
exports.checkPhoneNumber = checkPhoneNumber;
async function checkEmail(body) {
    const { email } = body;
    const user = await db_1.prisma.user.findUnique({
        where: {
            email,
        },
    });
    if (user) {
        return { available: false };
    }
    return { available: true };
}
exports.checkEmail = checkEmail;
async function getUserByInfo(userId) {
    try {
        const user = await db_1.prisma.user.findUnique({
            where: { id: userId },
            select: usersSchema_2.userWithParticipatedMatchesSelection,
        });
        if (!user) {
            throw new errors_1.NotFoundError("No users found.");
        }
        const totalMatchesPlayed = await db_1.prisma.matchParticipant.count({
            where: {
                userId: userId,
                match: {
                    status: "COMPLETED",
                },
            },
        });
        const overallRating = await (0, ratingService_1.calculateUserOverallRating)(userId);
        return {
            ...user,
            gamesPlayed: totalMatchesPlayed,
            overallRating,
        };
    }
    catch (error) {
        console.error("Failed to retrieve users:", error);
        throw new Error(`Error retrieving users from the database: ${error.message}`);
    }
}
exports.getUserByInfo = getUserByInfo;
async function createAdminAccount(body) {
    const userExists = await db_1.prisma.user.findUnique({
        where: {
            email: body.email,
        },
    });
    if (userExists) {
        throw new errors_1.BadRequestError("Email already in use");
    }
    if (!body.bySocial) {
        if (!body.password) {
            throw new errors_1.BadRequestError("Password is missing");
        }
        const hashedPassword = (0, utils_2.hashPassword)(body.password);
        const otp = generateOTP();
        try {
            // const firebaseuser = await firebaseAdmin.auth().createUser({
            //   email: body.email,
            //   password: body.password,
            //   displayName: body.name, // Set user's display name
            // });
            const { userCards, firebaseToken, gamesPlayed, ...data } = body;
            const user = await db_1.prisma.user.create({
                data: {
                    ...data,
                    role: "ADMIN",
                    otp: otp,
                    password: hashedPassword,
                    isVerified: true,
                    gamesPlayed: gamesPlayed,
                },
                select: usersSchema_2.userOtpSelection,
            });
            return user;
        }
        catch (error) {
            throw error;
        }
    }
    else {
        try {
            if (!body.firebaseToken) {
                throw new errors_1.BadRequestError("firebaseToken missing");
            }
            const firebaseUid = await verifyIdToken(body.firebaseToken);
            const user = await createUserWithFirebaseUID(firebaseUid.uid, body, "ADMIN");
            // welcomeEmail({ to: body.email, otp: "1111", name: body.name });
            return user;
        }
        catch (error) {
            throw error;
        }
    }
}
exports.createAdminAccount = createAdminAccount;
function generateOTP(length = 4) {
    const digits = "0123456789";
    let otp = "";
    for (let i = 0; i < length; i++) {
        otp += digits[Math.floor(Math.random() * digits.length)];
    }
    return otp;
}
exports.generateOTP = generateOTP;
async function sendPhoneOtp({ phoneNumber }) {
    // Check if user exists
    const user = await db_1.prisma.user.findFirst({
        where: { phoneNumber },
    });
    if (!user) {
        throw new errors_1.BadRequestError("User with this phone number not found");
    }
    // Generate OTP
    const otp = generateOTP(); // e.g. returns 6-digit string
    // Update user with OTP and expiry (5 minutes)
    await db_1.prisma.user.update({
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
exports.sendPhoneOtp = sendPhoneOtp;
async function applyPhoneOtp({ phoneNumber, otp, }) {
    // Find user by phone number
    const user = await db_1.prisma.user.findFirst({
        where: { phoneNumber },
    });
    if (!user) {
        throw new errors_1.BadRequestError("User with this phone number not found");
    }
    if (!user.otp || !user.otpExpiresAt) {
        throw new errors_1.BadRequestError("No OTP has been requested for this number");
    }
    // Check if OTP is expired
    const now = new Date();
    if (user.otpExpiresAt < now) {
        throw new errors_1.BadRequestError("OTP has expired. Please request a new one.");
    }
    // Check if OTP matches
    if (user.otp !== otp) {
        throw new errors_1.BadRequestError("Incorrect OTP");
    }
    // OTP is valid → mark user as verified and clear OTP
    await db_1.prisma.user.update({
        where: { id: user.id },
        data: {
            isVerified: true,
            otp: null,
            otpExpiresAt: null,
        },
    });
    return { message: "OTP verified successfully" };
}
exports.applyPhoneOtp = applyPhoneOtp;
async function deleteUser(userId) {
    return await db_1.prisma.user.delete({
        where: {
            id: userId,
        },
    });
}
exports.deleteUser = deleteUser;
async function deactivateUser(userId) {
    return await db_1.prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            deactivated: true,
        },
    });
}
exports.deactivateUser = deactivateUser;
async function reactivateUser(userId) {
    return await db_1.prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            deactivated: false,
        },
    });
}
exports.reactivateUser = reactivateUser;
async function getUserPublicInfo(userId) {
    try {
        const user = await db_1.prisma.user.findUnique({
            where: { id: userId },
            select: usersSchema_2.publicUserSelection,
        });
        if (!user) {
            throw new errors_1.NotFoundError("User not found.");
        }
        const overallRating = await (0, ratingService_1.calculateUserOverallRating)(userId);
        return {
            ...user,
            overallRating,
        };
    }
    catch (error) {
        console.error("Failed to retrieve public user info:", error);
        throw new Error(`Error retrieving public user info from the database: ${error.message}`);
    }
}
exports.getUserPublicInfo = getUserPublicInfo;
