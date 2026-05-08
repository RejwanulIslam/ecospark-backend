import { Request, Response } from "express";
import { PrismaClient, VoteType } from "@prisma/client";
import { z } from "zod";
import { catchAsync } from "../../utils/catchAsync";
import { AppError } from "../../utils/AppError";
import { prisma } from "../../lib/prisma";

async function getCounts(ideaId: string) {
  return Promise.all([
    prisma.vote.count({ where: { ideaId, type: "UPVOTE" } }),
    prisma.vote.count({ where: { ideaId, type: "DOWNVOTE" } }),
  ]);
}

export const voteOnIdea = catchAsync(async (req: Request, res: Response) => {
  const ideaId = req.params.ideaId as string;
  const { type } = z.object({ type: z.enum(["UPVOTE", "DOWNVOTE"]) }).parse(req.body);

  const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
  if (!idea) throw new AppError("Idea not found", 404);

  const existing = await prisma.vote.findUnique({
    where: { userId_ideaId: { userId: req.user!.userId, ideaId } },
  });

  if (existing) {
    if (existing.type === type) {
      await prisma.vote.delete({ where: { id: existing.id } });
      const [upvotes, downvotes] = await getCounts(ideaId);
      res.json({ message: "Vote removed", userVote: null, upvotes, downvotes });
      return;
    }
    await prisma.vote.update({ where: { id: existing.id }, data: { type: type as VoteType } });
  } else {
    await prisma.vote.create({
      data: { userId: req.user!.userId, ideaId, type: type as VoteType },
    });
  }

  const [upvotes, downvotes] = await getCounts(ideaId);
  res.json({ message: "Vote recorded", userVote: type, upvotes, downvotes });
});
