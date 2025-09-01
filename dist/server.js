"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("./db/db");
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
require("pino-pretty");
const path_1 = __importDefault(require("path"));
const usersRouter_1 = __importDefault(require("./modules/user/usersRouter"));
const adminRoutes_1 = __importDefault(require("./modules/admin/adminRoutes"));
const imageRoute_1 = __importDefault(require("./modules/variants/image/imageRoute"));
const gameRoutes_1 = __importDefault(require("./modules/game/gameRoutes"));
const matchRoutes_1 = __importDefault(require("./modules/match/matchRoutes"));
const notificationRoutes_1 = __importDefault(require("./modules/notification/notificationRoutes"));
const ratingRoutes_1 = __importDefault(require("./modules/rating/ratingRoutes"));
const chatRoutes_1 = __importDefault(require("./modules/chat/chatRoutes"));
const usersService_1 = require("./modules/user/usersService");
const usersSchema_1 = require("./modules/user/usersSchema");
const stripeController_1 = require("./payment/stripe/stripeController");
const http_1 = require("http");
const socket_io_1 = require("socket.io");
// cron jobs
const node_cron_1 = __importDefault(require("node-cron"));
const matchService_1 = require("./modules/match/matchService");
const chatEvents_1 = require("./modules/chat/chatEvents");
require("express-async-errors");
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});
app.post("/api/stripe/webhook", express_1.default.raw({ type: "application/json" }), stripeController_1.stripeWebhookHandler);
app.use(express_1.default.json());
app.use((0, cors_1.default)({ origin: true, credentials: true }));
app.use((0, cookie_parser_1.default)(process.env.JWT_ACCESS));
app.use(express_1.default.urlencoded({ extended: true }));
const staticImagesPath = path_1.default.join(__dirname, "../uploads");
app.use("/uploads", express_1.default.static(staticImagesPath));
if (process.env.NODE_ENV !== "production")
    [app.use((0, morgan_1.default)("dev"))];
const port = 4000;
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
    const users = await db_1.prisma.user.findMany({
        select: usersSchema_1.userSelection,
    });
    res.json(users);
});
app.use("/chats", chatRoutes_1.default);
app.use("/users", usersRouter_1.default);
app.use("/admin", adminRoutes_1.default);
app.use("/images", imageRoute_1.default);
app.use("/games", gameRoutes_1.default);
app.use("/matches", matchRoutes_1.default);
app.use("/notifications", notificationRoutes_1.default);
app.use("/ratings", ratingRoutes_1.default);
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
    (0, chatEvents_1.setupChatEvents)(io);
    await insertAdminAccount();
});
const assignAdminRole = async (email) => {
    try {
        const user = await db_1.prisma.user.findUnique({
            where: { email },
        });
        if (user && user.role !== "ADMIN") {
            await db_1.prisma.user.update({
                where: { email },
                data: { role: "ADMIN" },
            });
            console.log(`User with email ${email} has been assigned the ADMIN role.`);
        }
        else {
            console.log(`User with email ${email} is already an ADMIN or does not exist.`);
        }
    }
    catch (error) {
        console.error("Error assigning admin role:", error);
    }
};
const insertAdminAccount = async () => {
    try {
        let admin = await db_1.prisma.user.findUnique({
            where: {
                email: process.env.ADMIN_EMAIL,
            },
        });
        if (!(admin === null || admin === void 0 ? void 0 : admin.id)) {
            await (0, usersService_1.createAdminAccount)({
                name: "Admin",
                email: process.env.ADMIN_EMAIL,
                password: "Admin1234",
                role: "ADMIN",
            });
            console.log("Admin User Created");
        }
        else {
            console.log("Admin User Exists");
        }
    }
    catch (e) {
        console.error(e);
    }
};
node_cron_1.default.schedule("*/1 * * * *", async () => {
    console.log("Running match status cron job...");
    await (0, matchService_1.updateMatchStatuses)();
});
const notifyMatchesCron_1 = require("./modules/notification/notifyMatchesCron");
const scoringCron_1 = require("./modules/match/scoringCron");
node_cron_1.default.schedule("*/1 * * * *", async () => {
    console.log("Running match notifications cron job...");
    await (0, notifyMatchesCron_1.notifyUpcomingMatches)();
    await (0, notifyMatchesCron_1.notifyRatingDeadlines)();
    await (0, notifyMatchesCron_1.closeExpiredRatingWindows)();
});
// Start the 24-hour scoring cron job
(0, scoringCron_1.processCompletedMatchScores)();
