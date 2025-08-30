"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMatchPaymentIntent = void 0;
const stripe_1 = __importDefault(require("stripe"));
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-06-30.basil",
});
async function createMatchPaymentIntent({ userId, matchId, entryFee, }) {
    const paymentIntent = await stripe.paymentIntents.create({
        amount: entryFee * 100,
        currency: "usd",
        metadata: {
            userId,
            matchId,
        },
        automatic_payment_methods: {
            enabled: true, // enables Apple Pay, Google Pay, etc.
        },
    });
    return {
        clientSecret: paymentIntent.client_secret,
    };
}
exports.createMatchPaymentIntent = createMatchPaymentIntent;
