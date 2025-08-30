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
//   project_id: "nfc360-67b60",
//   private_key_id: "b86f53bf20fbbab3f5eea7038428bb59d69d22d5",
//   private_key:
//     "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC0zy8JkXG+Fa1V\nb/W/zi1faMMlb8FXvD4C5rKzXJ1sna2mMuBXJKgDZEmnnpSp2lm/t5+cc7O7a34L\nW1qZgrNCJ2oBqoB0lBsshs24s8yH/7qIRRjEvxQlwjMV5jjc9wpDZp6p0K/+lEy8\npzmWjw+APESxDC0lkqevjTvaftqW5v1znhY+I94jyDoXzxNcxf6NoW8SlxiemCh1\n6V6dwNVw5ILuHGFeTxWBJEFSDDLpbp9znY+dL/2fH79Alilo2fY6dcn/f9IB8+Ff\nyzC7Cfrb+r99Zf2JwEjjH431CY6dB3aNF7ouimOW/lTBTP+lgKXkfhxfqFBuVdo6\n0uR1BCcZAgMBAAECggEACW3fmFplKeJUBIde88aDD711Jdvm45YtzrVsvtVW4V30\nuxzenbTL7Uda3vqyaow4T3r6QCy5hA3mSB3WwvgxtIK9MMKNSecaZq9OBbKcuT/x\nIJ+n28TSPmjbBKqZrw5UEvFEV3tKXlaqDNGUu4EQ8CFUfL4zkYjNJWbSZwHkEOf6\nvyDONT61WGp8M07aKI2IME+4AAzNcWmFTynODX7/AfA9Nt/S2uiBt6YmfCZg2tps\nZwl/QopMLdTYmGdhX+A3yp496l5wPbykyzg9AriNT/a2BlvHR9lpZWhnm+xCOErI\nQA6C7uDB+utzcYEVCRIgZPsID63DMepbM+T+KmEPbQKBgQD6d9GQClqphS14VaAB\npwcbGWkuN88Dcx7Q94hLHsbUtDu86juBAy2oWNfS5UMG+izwLvR5CYH/XFvBJOO7\nzW3n0vCOgh0G5tY4INl1Z6BeZVhLcuXOTljI38Q9LiLAipfxJ4Q/IqHihmEpfp1K\nAJZMKdubv5XntA2I1rvqsgAUzQKBgQC4zYFCR7dox70vUdzdlaKrXQG4IujHRfR3\nQeyCwr3RZzHycWJF43IgA6mB0jI0QA5gJ5/VihtCqAhdqnICZtCB6s3nkkHiS0S4\nhIISSpaIJRA5f8HrlcKtGXyb0vPApE8o506u1OCrL0EkX22yv7zBf83P4C705TxO\nTRk8qOn7fQKBgE3E+GfOHzp1pJmxlH4O27D5YeQ85eU/UHk38rTIeJpA4C+XVySG\n1R1pgJH2J6q58UweeEBAyIF+ruq4xpFghtitcY3+Ln8fG7LP2FWQ+IV22ESNB3fY\ncc7lU+xfL+Ey51y0lWZ5HWTVrsOQkcwRhJlfgdXJVgVcrbsoWa7U2BudAoGAGnYS\nlBMAyBgRlrz6CyBp8m+W127oNeBmaM0fuHl6BInqNPTXRXqT1NGxa81VMvYZGNuT\nn1fvH1RAHmlRedaO9ItSgF4I4QY2CNWwaj4T39quwAzzD3CaN372wLkr/eGJFCpK\nse35XYmeoj6nznh15p8OMT3Ae4B3ah7QBkeJeWECgYBQWH4KtzeESaeYzkqy2l/l\nJXNcrOSSgt+lI0JlqSBuB5wbO5HfuEI0w3SkgEoASlt725qNs3ko2k2JIr0rMB+s\nVtKLW5d4rBjYwnZx4v31wKOpgj2YP0KVTXhiH2zy+fFLhkmfdYZjH4ylTgccAbSt\n1+4DFl0Tg8p5oA+L0+ZycQ==\n-----END PRIVATE KEY-----\n",
//   client_email: "firebase-adminsdk-vfu4t@nfc360-67b60.iam.gserviceaccount.com",
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
