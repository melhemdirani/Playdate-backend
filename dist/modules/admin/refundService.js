"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRefundEligibility = exports.getRefundAnalytics = exports.processPaymentRefund = void 0;
const stripe_1 = __importDefault(require("stripe"));
const db_1 = require("../../db/db");
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-06-30.basil",
});
/**
 * Process a refund for a payment
 * This function will be implemented when Prisma client is regenerated
 */
async function processPaymentRefund(paymentId, refundData, adminId) {
    // TODO: Implement when Payment model is available
    throw new Error("Refund processing temporarily disabled - pending Prisma regeneration");
    /*
    Future implementation will include:
    
    // 1. Find the payment
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });
  
    if (!payment) {
      throw new NotFoundError("Payment not found");
    }
  
    if (!payment.stripePaymentId) {
      throw new BadRequestError("Cannot refund payment without Stripe payment ID");
    }
  
    // 2. Validate refund amount
    const currentRefunded = payment.refundAmount || 0;
    const maxRefundable = payment.amount - currentRefunded;
    
    if (refundData.amount > maxRefundable) {
      throw new BadRequestError(`Cannot refund ${refundData.amount}. Maximum refundable amount is ${maxRefundable}`);
    }
  
    try {
      // 3. Process refund with Stripe
      const stripeRefund = await stripe.refunds.create({
        payment_intent: payment.stripePaymentId,
        amount: Math.round(refundData.amount * 100), // Convert to cents
        reason: "requested_by_customer",
        metadata: {
          adminId,
          originalPaymentId: paymentId,
          refundReason: refundData.reason,
        },
      });
  
      // 4. Update payment record
      const newRefundAmount = currentRefunded + refundData.amount;
      const newStatus = newRefundAmount >= payment.amount ? "REFUNDED" : "PARTIALLY_REFUNDED";
  
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          refundAmount: newRefundAmount,
          refundReason: refundData.reason,
          refundedAt: new Date(),
          status: newStatus,
        },
      });
  
      // 5. Log the refund activity
      await prisma.userActivity.create({
        data: {
          userId: adminId,
          activity: "REFUND_PROCESSED",
          details: JSON.stringify({
            paymentId,
            refundAmount: refundData.amount,
            reason: refundData.reason,
            stripeRefundId: stripeRefund.id,
          }),
        },
      });
  
      return {
        refundId: stripeRefund.id,
        amount: refundData.amount,
        status: stripeRefund.status,
        paymentId,
        stripeRefundId: stripeRefund.id,
      };
  
    } catch (stripeError: any) {
      console.error("Stripe refund error:", stripeError);
      throw new BadRequestError(`Refund failed: ${stripeError.message}`);
    }
    */
}
exports.processPaymentRefund = processPaymentRefund;
/**
 * Get refund analytics and statistics
 */
async function getRefundAnalytics(startDate, endDate) {
    let dateFilter = {};
    if (startDate || endDate) {
        dateFilter.refundedAt = {};
        if (startDate)
            dateFilter.refundedAt.gte = new Date(startDate);
        if (endDate)
            dateFilter.refundedAt.lte = new Date(endDate);
    }
    const [totalRefunds, totalRefundAmount, partialRefunds, fullRefunds] = await Promise.all([
        db_1.prisma.payment.count({
            where: {
                status: { in: ["REFUNDED", "PARTIALLY_REFUNDED"] },
                ...dateFilter,
            },
        }),
        db_1.prisma.payment.aggregate({
            where: {
                status: { in: ["REFUNDED", "PARTIALLY_REFUNDED"] },
                ...dateFilter,
            },
            _sum: { refundAmount: true },
        }),
        db_1.prisma.payment.count({
            where: { status: "PARTIALLY_REFUNDED", ...dateFilter },
        }),
        db_1.prisma.payment.count({
            where: { status: "REFUNDED", ...dateFilter },
        }),
    ]);
    return {
        totalRefunds,
        totalRefundAmount: totalRefundAmount._sum.refundAmount || 0,
        partialRefunds,
        fullRefunds,
    };
}
exports.getRefundAnalytics = getRefundAnalytics;
/**
 * Validate if a payment can be refunded
 */
async function validateRefundEligibility(paymentId) {
    const payment = await db_1.prisma.payment.findUnique({
        where: { id: paymentId },
        include: { match: true },
    });
    if (!payment) {
        return { eligible: false, reason: "Payment not found" };
    }
    if (payment.status !== "COMPLETED") {
        return {
            eligible: false,
            reason: "Only completed payments can be refunded",
        };
    }
    if (!payment.stripePaymentId) {
        return { eligible: false, reason: "Payment missing Stripe reference" };
    }
    const currentRefunded = payment.refundAmount || 0;
    const maxRefundable = payment.amount - currentRefunded;
    if (maxRefundable <= 0) {
        return { eligible: false, reason: "Payment already fully refunded" };
    }
    // Check if match has already occurred (you might want different rules)
    const now = new Date();
    if (payment.match && payment.match.scheduledAt < now) {
        // Maybe allow partial refunds for completed matches
        return {
            eligible: true,
            maxRefundable: maxRefundable * 0.5,
            reason: "Partial refund available for completed matches",
        };
    }
    return {
        eligible: true,
        maxRefundable,
        reason: "Full refund available",
    };
}
exports.validateRefundEligibility = validateRefundEligibility;
