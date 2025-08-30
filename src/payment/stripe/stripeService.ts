import Stripe from "stripe";
import { Request, Response } from "express";
import { Prisma } from "@prisma/client";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-06-30.basil",
});
export async function createMatchPaymentIntent({
  userId,
  matchId,
  entryFee,
}: {
  userId: string;
  matchId: string;
  entryFee: number;
}) {
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
