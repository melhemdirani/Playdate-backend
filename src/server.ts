import express from "express";
import { prisma } from "./db/db";
import morgan from "morgan";
import pino from "pino";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import "pino-pretty";
import path from "path";
import userRouter from "./modules/user/usersRouter";
import adminRouter from "./modules/admin/adminRoutes";
import imageRouter from "./modules/variants/image/imageRoute";
import gameRouter from "./modules/game/gameRoutes";
import matchRouter from "./modules/match/matchRoutes";
import notificationRouter from "./modules/notification/notificationRoutes";
import ratingRouter from "./modules/rating/ratingRoutes";
import chatRouter from "./modules/chat/chatRoutes";
import { createAdminAccount } from "./modules/user/usersService";
import { userSelection } from "./modules/user/usersSchema";
import { stripeWebhookHandler } from "./payment/stripe/stripeController";

import { createServer } from "http";
import { Server } from "socket.io";
// cron jobs

import cron from "node-cron";
import { updateMatchStatuses } from "./modules/match/matchService";
import { setupChatEvents } from "./modules/chat/chatEvents";
require("express-async-errors");

import { IToken } from "./utils";

dotenv.config();
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Adjust this to your frontend URL in production
    methods: ["GET", "POST"],
  },
});
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhookHandler
);

app.use(express.json());
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser(process.env.JWT_ACCESS));
app.use(express.urlencoded({ extended: true }));
const staticImagesPath = path.join(__dirname, "../uploads");
app.use("/uploads", express.static(staticImagesPath));

if (process.env.NODE_ENV !== "production") [app.use(morgan("dev"))];

const port = 4000;
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user: IToken;
      log: pino.Logger;
    }
  }
}
// import admin from "firebase-admin";

// const serviceAccount = {
//   type: "service_account",
//   project_id: "",
//   private_key_id: "",
//   private_key:
//     "",
//   client_id: "115471291454814869177",
//   auth_uri: "https://accounts.google.com/o/oauth2/auth",
//   token_uri: "https://oauth2.googleapis.com/token",
//   auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
//   client_x509_cert_url:
//     "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-vfu4t%40nfc360-67b60.iam.gserviceaccount.com",
//   universe_domain: "googleapis.com",
// };

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
// });
app.get("/", async (req, res) => {
  const users = await prisma.user.findMany({
    select: userSelection,
  });
  res.json(users);
});

app.use("/chats", chatRouter);
app.use("/users", userRouter);
app.use("/admin", adminRouter);
app.use("/images", imageRouter);
app.use("/games", gameRouter);
app.use("/matches", matchRouter);
app.use("/notifications", notificationRouter);
app.use("/ratings", ratingRouter);

app.get("/assign-admin-role/:email", async (req, res) => {
  const email = req.params.email;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
  await assignAdminRole(email);
  res.status(200).json({ message: "Admin role assigned successfully" });
});
httpServer.listen(port, async () => {
  // await prisma.matchParticipant.deleteMany({
  //   where: {
  //     status: "PENDING_PAYMENT",
  //   },
  // });
  // await prisma.matchRequest.deleteMany();
  console.log(`Server is running on port ${port}`);
  setupChatEvents(io);
  await insertAdminAccount();
});

const assignAdminRole = async (email: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (user && user.role !== "ADMIN") {
      await prisma.user.update({
        where: { email },
        data: { role: "ADMIN" },
      });
      console.log(`User with email ${email} has been assigned the ADMIN role.`);
    } else {
      console.log(
        `User with email ${email} is already an ADMIN or does not exist.`
      );
    }
  } catch (error) {
    console.error("Error assigning admin role:", error);
  }
};
const insertAdminAccount = async () => {
  try {
    let admin = await prisma.user.findUnique({
      where: {
        email: process.env.ADMIN_EMAIL as string,
      },
    });
    if (!admin?.id) {
      await createAdminAccount({
        name: "Admin",
        email: process.env.ADMIN_EMAIL as string,
        password: "Admin1234",
        role: "ADMIN",
      });
      console.log("Admin User Created");
    } else {
      console.log("Admin User Exists");
    }
  } catch (e) {
    console.error(e);
  }
};

cron.schedule("*/1 * * * *", async () => {
  console.log("Running match status cron job...");
  await updateMatchStatuses();
});

import {
  notifyUpcomingMatches,
  notifyRatingDeadlines,
  closeExpiredRatingWindows,
} from "./modules/notification/notifyMatchesCron";

import { processCompletedMatchScores } from "./modules/match/scoringCron";

cron.schedule("*/1 * * * *", async () => {
  console.log("Running match notifications cron job...");
  await notifyUpcomingMatches();
  await notifyRatingDeadlines();
  await closeExpiredRatingWindows();
});

// Start the 24-hour scoring cron job
processCompletedMatchScores();
