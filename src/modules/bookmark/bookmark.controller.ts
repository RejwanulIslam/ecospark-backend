import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { AppError } from "../../utils/AppError";
import { prisma } from "../../lib/prisma";

// Toggle bookmark (add/remove)
export const toggleBookmark = catchAsync(async (req: Request, res: Response) => {
  const ideaId = req.params.ideaId as string;

  const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
  if (!idea) throw new AppError("Idea not found", 404);

  const existing = await prisma.bookmark.findUnique({
    where: { userId_ideaId: { userId: req.user!.userId, ideaId } },
  });

  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
    res.json({ bookmarked: false, message: "Removed from wishlist" });
  } else {
    await prisma.bookmark.create({
      data: { userId: req.user!.userId, ideaId },
    });
    res.json({ bookmarked: true, message: "Added to wishlist" });
  }
});

// Get all bookmarks for current user
export const getMyBookmarks = catchAsync(async (req: Request, res: Response) => {
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: req.user!.userId },
    include: {
      idea: {
        include: {
          category: true,
          author: { select: { id: true, name: true, avatar: true } },
          _count: { select: { votes: true, comments: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({ bookmarks });
});

// Check if an idea is bookmarked
export const checkBookmark = catchAsync(async (req: Request, res: Response) => {
  const ideaId = req.params.ideaId as string;

  const bookmark = await prisma.bookmark.findUnique({
    where: { userId_ideaId: { userId: req.user!.userId, ideaId } },
  });

  res.json({ bookmarked: !!bookmark });
});

// Get all bookmarked idea IDs for current user (lightweight)
export const getBookmarkedIds = catchAsync(async (req: Request, res: Response) => {
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: req.user!.userId },
    select: { ideaId: true },
  });

  res.json({ ideaIds: bookmarks.map((b) => b.ideaId) });
});
