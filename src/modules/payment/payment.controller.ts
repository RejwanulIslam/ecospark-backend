import { Request, Response } from "express";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { catchAsync } from "../../utils/catchAsync";
import { AppError } from "../../utils/AppError";
import { prisma } from "../../lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const createPaymentIntent = catchAsync(async (req: Request, res: Response) => {
  const { ideaId } = z.object({ ideaId: z.string().uuid() }).parse(req.body);

  const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
  if (!idea) throw new AppError("Idea not found", 404);
  if (!idea.isPaid || !idea.price) throw new AppError("This idea is free", 400);

  const existing = await prisma.purchase.findUnique({
    where: { userId_ideaId: { userId: req.user!.userId, ideaId } },
  });

  if (existing) throw new AppError("You already have access to this idea", 400);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(idea.price * 100),
    currency: "usd",
    metadata: { ideaId, userId: req.user!.userId, ideaTitle: idea.title },
  });

  res.json({
    clientSecret: paymentIntent.client_secret,
    amount: idea.price,
    ideaTitle: idea.title,
  });
});

export const confirmPayment = catchAsync(async (req: Request, res: Response) => {
  const { paymentIntentId, ideaId } = z.object({
    paymentIntentId: z.string(),
    ideaId: z.string().uuid(),
  }).parse(req.body);

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status !== "succeeded") throw new AppError("Payment not completed", 400);

  const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
  if (!idea || !idea.price) throw new AppError("Idea not found", 404);

  const purchase = await prisma.purchase.create({
    data: {
      userId: req.user!.userId,
      ideaId,
      amount: idea.price,
      stripePaymentId: paymentIntentId,
      status: "completed",
    },
  });

  res.json({ purchase, message: "Payment confirmed! You now have access to this idea." });
});

export const stripeWebhook = catchAsync(async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;

  const event = stripe.webhooks.constructEvent(
    req.body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const { ideaId, userId } = paymentIntent.metadata;

    if (ideaId && userId) {
      const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
      if (idea && idea.price) {
        await prisma.purchase.upsert({
          where: { userId_ideaId: { userId, ideaId } },
          update: {},
          create: {
            userId,
            ideaId,
            amount: idea.price,
            stripePaymentId: paymentIntent.id,
            status: "completed",
          },
        });
      }
    }
  }

  res.json({ received: true });
});

export const checkPurchase = catchAsync(async (req: Request, res: Response) => {
  const ideaId = req.params.ideaId as string;
  const purchase = await prisma.purchase.findUnique({
    where: { userId_ideaId: { userId: req.user!.userId, ideaId } },
  });
  res.json({ hasPurchased: !!purchase });
});

export const getMyPurchases = catchAsync(async (req: Request, res: Response) => {
  const purchases = await prisma.purchase.findMany({
    where: { userId: req.user!.userId },
    include: { idea: { include: { category: true, author: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  res.json({ purchases });
});
