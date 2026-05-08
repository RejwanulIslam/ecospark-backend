import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { catchAsync } from "../../utils/catchAsync";
import { prisma } from "../../lib/prisma";

export const getUserStats = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const [ideas, votes, comments, purchases] = await Promise.all([
    prisma.idea.groupBy({ by: ["status"], where: { authorId: userId }, _count: { _all: true } }),
    prisma.vote.count({ where: { userId } }),
    prisma.comment.count({ where: { userId } }),
    prisma.purchase.count({ where: { userId } }),
  ]);

  const ideasByStatus = ideas.reduce((acc: any, i: any) => {
    acc[i.status] = i._count._all;
    return acc;
  }, {} as Record<string, number>);

  res.json({ ideasByStatus, totalVotes: votes, totalComments: comments, totalPurchases: purchases });
});
