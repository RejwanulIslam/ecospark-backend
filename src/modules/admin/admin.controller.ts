import { Request, Response } from "express";
import { PrismaClient, IdeaStatus } from "@prisma/client";
import { z } from "zod";
import { catchAsync } from "../../utils/catchAsync";
import { AppError } from "../../utils/AppError";
import { prisma } from "../../lib/prisma";

export const getAllIdeasAdmin = catchAsync(async (req: Request, res: Response) => {
  const { page = "1", limit = "10", status, search } = req.query as any;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where: any = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { author: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [ideas, total] = await Promise.all([
    prisma.idea.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, email: true, avatar: true } },
        category: true,
        _count: { select: { votes: true, comments: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.idea.count({ where }),
  ]);

  res.json({ ideas, pagination: { total, page: parseInt(page), limit: take, totalPages: Math.ceil(total / take) } });
});

export const approveIdea = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const idea = await prisma.idea.findUnique({ where: { id } });
  if (!idea) throw new AppError("Idea not found", 404);

  const updated = await prisma.idea.update({
    where: { id },
    data: { status: IdeaStatus.APPROVED, rejectionFeedback: null },
  });

  res.json({ idea: updated, message: "Idea approved successfully" });
});

export const rejectIdea = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { feedback } = z.object({ feedback: z.string().min(10) }).parse(req.body);

  const idea = await prisma.idea.findUnique({ where: { id } });
  if (!idea) throw new AppError("Idea not found", 404);

  const updated = await prisma.idea.update({
    where: { id },
    data: { status: IdeaStatus.REJECTED, rejectionFeedback: feedback },
  });

  res.json({ idea: updated, message: "Idea rejected" });
});

export const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const { page = "1", limit = "10", search } = req.query as any;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, role: true,
        isActive: true, avatar: true, createdAt: true,
        _count: { select: { ideas: true, votes: true, comments: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.user.count({ where }),
  ]);

  res.json({ users, pagination: { total, page: parseInt(page), limit: take, totalPages: Math.ceil(total / take) } });
});

export const toggleUserStatus = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  if (id === req.user!.userId) throw new AppError("Cannot deactivate your own account", 400);

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError("User not found", 404);

  const updated = await prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive },
    select: { id: true, name: true, email: true, isActive: true },
  });

  res.json({ user: updated, message: `User ${updated.isActive ? "activated" : "deactivated"} successfully` });
});

export const updateUserRole = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { role } = z.object({ role: z.enum(["MEMBER", "ADMIN"]) }).parse(req.body);

  const updated = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, name: true, email: true, role: true },
  });

  res.json({ user: updated });
});

export const getDashboardStats = catchAsync(async (_req: Request, res: Response) => {
  const [totalUsers, totalIdeas, totalVotes, totalComments, ideasByStatus, recentIdeas] = await Promise.all([
    prisma.user.count(),
    prisma.idea.count(),
    prisma.vote.count(),
    prisma.comment.count(),
    prisma.idea.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.idea.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { author: { select: { name: true } }, category: true },
    }),
  ]);

  res.json({
    stats: { totalUsers, totalIdeas, totalVotes, totalComments },
    ideasByStatus: ideasByStatus.reduce((acc: any, item: any) => {
      acc[item.status] = item._count._all;
      return acc;
    }, {} as Record<string, number>),
    recentIdeas,
  });
});
