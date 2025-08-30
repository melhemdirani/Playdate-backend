import Stripe from "stripe";
import { Request, Response } from "express";
import { prisma } from "../../db/db";
import { awardAchievement } from "../../modules/match/matchService";
import { createNotification } from "../../modules/notification/notificationService";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-06-30.basil",
});

// TODO: check webhook not working
export const stripeWebhookHandler = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
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
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const userId = paymentIntent.metadata.userId;
      const matchId = paymentIntent.metadata.matchId;

      try {
        // ✅ Create Payment record in database
        const payment = await prisma.payment.create({
          data: {
            stripePaymentId: paymentIntent.id,
            amount: paymentIntent.amount / 100, // Convert from cents to dollars
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
        await prisma.matchParticipant.updateMany({
          where: { userId, matchId },
          data: { status: "CONFIRMED" },
        });

        // ✅ Award Achievement (moved from joinMatch)
        await awardAchievement(userId, "Joined First Game");

        console.log(
          `[stripeWebhook] Payment ${payment.id} created and participant confirmed for user ${userId} on match ${matchId}.`
        );
      } catch (error) {
        console.error(
          `[stripeWebhook] Error processing payment for user ${userId} on match ${matchId}:`,
          error
        );
        // Consider adding retry logic or error notification
      }

      break;
    }
    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const userId = paymentIntent.metadata.userId;
      const matchId = paymentIntent.metadata.matchId;

      try {
        // ✅ Create Payment record for failed payment
        const payment = await prisma.payment.create({
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
              failureReason:
                paymentIntent.last_payment_error?.message || "Unknown error",
            },
          },
        });

        // ✅ Update participant status to PAYMENT_FAILED
        await prisma.matchParticipant.updateMany({
          where: { userId, matchId },
          data: { status: "PAYMENT_FAILED" },
        });

        // ✅ Send urgent payment failed notification
        const match = await prisma.match.findUnique({
          where: { id: matchId },
          include: { game: true, location: true },
        });

        if (match) {
          await createNotification({
            userId: userId,
            type: "payment_failed",
            data: {
              game: match.game,
              match: match,
              location: match.location?.name,
              paymentId: payment.id,
              failureReason: paymentIntent.last_payment_error?.message,
            },
          });
        }

        console.log(
          `[stripeWebhook] Payment ${payment.id} failed for user ${userId} on match ${matchId}.`
        );
      } catch (error) {
        console.error(
          `[stripeWebhook] Error processing failed payment for user ${userId} on match ${matchId}:`,
          error
        );
      }

      break;
    }
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};
