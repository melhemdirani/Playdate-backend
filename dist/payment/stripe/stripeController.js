"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhookHandler = void 0;
const stripe_1 = __importDefault(require("stripe"));
const db_1 = require("../../db/db");
const matchService_1 = require("../../modules/match/matchService");
const notificationService_1 = require("../../modules/notification/notificationService");
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-06-30.basil",
});
// TODO: check webhook not working
const stripeWebhookHandler = async (req, res) => {
    var _a, _b, _c;
    const sig = req.headers["stripe-signature"];
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    }
    catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    // Handle the event
    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object;
            // TODO: fulfill the purchase, update DB, etc.
            break;
        }
        case "payment_intent.succeeded": {
            const paymentIntent = event.data.object;
            const userId = paymentIntent.metadata.userId;
            const matchId = paymentIntent.metadata.matchId;
            try {
                // ✅ Create Payment record in database
                const payment = await db_1.prisma.payment.create({
                    data: {
                        stripePaymentId: paymentIntent.id,
                        amount: paymentIntent.amount / 100,
                        currency: paymentIntent.currency,
                        status: "COMPLETED",
                        userId: userId,
                        matchId: matchId,
                        paymentMethod: paymentIntent.payment_method_types[0] || "card",
                        description: `Payment for match ${matchId}`,
                        metadata: {
                            stripePaymentIntent: paymentIntent.id,
                            paymentMethodTypes: paymentIntent.payment_method_types,
                        },
                    },
                });
                // ✅ Update participant status to CONFIRMED
                await db_1.prisma.matchParticipant.updateMany({
                    where: { userId, matchId },
                    data: { status: "CONFIRMED" },
                });
                // ✅ Award Achievement (moved from joinMatch)
                await (0, matchService_1.awardAchievement)(userId, "Joined First Game");
                console.log(`[stripeWebhook] Payment ${payment.id} created and participant confirmed for user ${userId} on match ${matchId}.`);
            }
            catch (error) {
                console.error(`[stripeWebhook] Error processing payment for user ${userId} on match ${matchId}:`, error);
                // Consider adding retry logic or error notification
            }
            break;
        }
        case "payment_intent.payment_failed": {
            const paymentIntent = event.data.object;
            const userId = paymentIntent.metadata.userId;
            const matchId = paymentIntent.metadata.matchId;
            try {
                // ✅ Create Payment record for failed payment
                const payment = await db_1.prisma.payment.create({
                    data: {
                        stripePaymentId: paymentIntent.id,
                        amount: paymentIntent.amount / 100,
                        currency: paymentIntent.currency,
                        status: "FAILED",
                        userId: userId,
                        matchId: matchId,
                        paymentMethod: paymentIntent.payment_method_types[0] || "card",
                        description: `Failed payment for match ${matchId}`,
                        metadata: {
                            stripePaymentIntent: paymentIntent.id,
                            failureReason: ((_a = paymentIntent.last_payment_error) === null || _a === void 0 ? void 0 : _a.message) || "Unknown error",
                        },
                    },
                });
                // ✅ Update participant status to PAYMENT_FAILED
                await db_1.prisma.matchParticipant.updateMany({
                    where: { userId, matchId },
                    data: { status: "PAYMENT_FAILED" },
                });
                // ✅ Send urgent payment failed notification
                const match = await db_1.prisma.match.findUnique({
                    where: { id: matchId },
                    include: { game: true, location: true },
                });
                if (match) {
                    await (0, notificationService_1.createNotification)({
                        userId: userId,
                        type: "payment_failed",
                        data: {
                            game: match.game,
                            match: match,
                            location: (_b = match.location) === null || _b === void 0 ? void 0 : _b.name,
                            paymentId: payment.id,
                            failureReason: (_c = paymentIntent.last_payment_error) === null || _c === void 0 ? void 0 : _c.message,
                        },
                    });
                }
                console.log(`[stripeWebhook] Payment ${payment.id} failed for user ${userId} on match ${matchId}.`);
            }
            catch (error) {
                console.error(`[stripeWebhook] Error processing failed payment for user ${userId} on match ${matchId}:`, error);
            }
            break;
        }
        // ... handle other event types
        default:
            console.log(`Unhandled event type ${event.type}`);
    }
    res.json({ received: true });
};
exports.stripeWebhookHandler = stripeWebhookHandler;
