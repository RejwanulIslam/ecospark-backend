import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { catchAsync } from "../../utils/catchAsync";
import { AppError } from "../../utils/AppError";
import { prisma } from "../../lib/prisma";

export const subscribe = catchAsync(async (req: Request, res: Response) => {
  const { email } = z.object({ email: z.string().email() }).parse(req.body);

  const existing = await prisma.newsletter.findUnique({ where: { email } });
  if (existing) throw new AppError("Email already subscribed", 409);

  await prisma.newsletter.create({
    data: { email, userId: req.user?.userId },
  });

  res.status(201).json({ message: "Successfully subscribed to newsletter!" });
});

export const unsubscribe = catchAsync(async (req: Request, res: Response) => {
  const { email } = z.object({ email: z.string().email() }).parse(req.body);
  await prisma.newsletter.delete({ where: { email } });
  res.json({ message: "Successfully unsubscribed" });
});
