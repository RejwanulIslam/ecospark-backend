import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { catchAsync } from "../../utils/catchAsync";
import { AppError } from "../../utils/AppError";
import { prisma } from "../../lib/prisma";

const commentSelect = {
  id: true,
  content: true,
  createdAt: true,
  updatedAt: true,
  parentId: true,
  user: { select: { id: true, name: true, avatar: true } },
  replies: {
    select: {
      id: true, content: true, createdAt: true, updatedAt: true, parentId: true,
      user: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { createdAt: "asc" as const },
  },
};

export const getComments = catchAsync(async (req: Request, res: Response) => {
  const ideaId = req.params.ideaId as string;

  const comments = await prisma.comment.findMany({
    where: { ideaId, parentId: null },
    select: commentSelect,
    orderBy: { createdAt: "desc" },
  });

  res.json({ comments });
});

export const createComment = catchAsync(async (req: Request, res: Response) => {
  const ideaId = req.params.ideaId as string;
  const { content, parentId } = z.object({
    content: z.string().min(1).max(2000),
    parentId: z.string().uuid().optional(),
  }).parse(req.body);

  const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
  if (!idea) throw new AppError("Idea not found", 404);

  const comment = await prisma.comment.create({
    data: { content, userId: req.user!.userId, ideaId, parentId },
    select: {
      id: true, content: true, createdAt: true, parentId: true,
      user: { select: { id: true, name: true, avatar: true } },
      replies: { select: { id: true } },
    },
  });

  res.status(201).json({ comment });
});

export const deleteComment = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const comment = await prisma.comment.findUnique({ where: { id } });

  if (!comment) throw new AppError("Comment not found", 404);
  if (comment.userId !== req.user!.userId && req.user!.role !== "ADMIN") {
    throw new AppError("Not authorized", 403);
  }

  await prisma.comment.delete({ where: { id } });
  res.json({ message: "Comment deleted" });
});
