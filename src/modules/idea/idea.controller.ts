import { Request, Response } from "express";
import { z } from "zod";
import { PrismaClient, IdeaStatus } from "@prisma/client";
import { catchAsync } from "../../utils/catchAsync";
import { AppError } from "../../utils/AppError";
import slugify from "../../utils/slugify";
import { prisma } from "../../lib/prisma";

const ideaSchema = z.object({
  title: z.string().min(5).max(200),
  problemStatement: z.string().min(20),
  proposedSolution: z.string().min(20),
  description: z.string().min(50),
  images: z.array(z.string().url()).max(5).optional().default([]),
  isPaid: z.boolean().optional().default(false),
  price: z.number().positive().optional().nullable(),
  categoryId: z.string().uuid(),
  status: z.enum(["DRAFT", "PENDING"]).optional().default("DRAFT"),
});

const ideaSelect = {
  id: true, title: true, slug: true, problemStatement: true, proposedSolution: true,
  description: true, images: true, isPaid: true, price: true, status: true,
  rejectionFeedback: true, viewCount: true, createdAt: true, updatedAt: true,
  author: { select: { id: true, name: true, avatar: true } },
  category: { select: { id: true, name: true, slug: true, icon: true, color: true } },
  _count: { select: { votes: true, comments: true } },
};

async function generateUniqueSlug(title: string): Promise<string> {
  let slug = slugify(title);
  let count = 0;
  while (true) {
    const currentSlug = count === 0 ? slug : `${slug}-${count}`;
    const existing = await prisma.idea.findUnique({ where: { slug: currentSlug } });
    if (!existing) return currentSlug;
    count++;
  }
}

export const getIdeas = catchAsync(async (req: Request, res: Response) => {
  const { page = "1", limit = "12", search, category, sortBy = "createdAt", order = "desc", isPaid } = req.query as any;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where: any = { status: IdeaStatus.APPROVED };
  if (search) where.OR = [{ title: { contains: search, mode: "insensitive" } }, { description: { contains: search, mode: "insensitive" } }];
  if (category) where.category = { slug: category };
  if (isPaid !== undefined) where.isPaid = isPaid === "true";

  let orderBy: any = { [sortBy]: order };
  if (sortBy === "votes") orderBy = { votes: { _count: order } };
  if (sortBy === "comments") orderBy = { comments: { _count: order } };

  const [ideas, total] = await Promise.all([
    prisma.idea.findMany({ where, select: { ...ideaSelect, votes: { select: { type: true } } }, orderBy, skip, take }),
    prisma.idea.count({ where }),
  ]);

  const formattedIdeas = ideas.map((idea: any) => ({
    ...idea,
    upvotes: idea.votes.filter((v: any) => v.type === "UPVOTE").length,
    downvotes: idea.votes.filter((v: any) => v.type === "DOWNVOTE").length,
    votes: undefined
  }));

  res.json({ ideas: formattedIdeas, pagination: { total, page: parseInt(page), limit: take, totalPages: Math.ceil(total / take) } });
});

export const getIdeaBySlug = catchAsync(async (req: Request, res: Response) => {
  const slug = req.params.slug as string;
  const idea = await prisma.idea.findUnique({
    where: { slug },
    include: { author: { select: { id: true, name: true, avatar: true, bio: true } }, category: true, _count: { select: { votes: true, comments: true } } },
  });

  if (!idea) throw new AppError("Idea not found", 404);

  const isAuthor = req.user?.userId === idea.authorId;
  const isAdmin = req.user?.role === "ADMIN";

  if (idea.status !== IdeaStatus.APPROVED && !isAuthor && !isAdmin) throw new AppError("Not authorized", 403);

  let responseData: any = { ...idea };
  if (idea.isPaid && !isAuthor && !isAdmin) {
    const purchase = req.user ? await prisma.purchase.findUnique({ where: { userId_ideaId: { userId: req.user.userId, ideaId: idea.id } } }) : null;
    if (!purchase) {
      responseData.description = idea.description.substring(0, 200) + "...";
      responseData.isPaidAndLocked = true;
    }
  }

  prisma.idea.update({ where: { id: idea.id }, data: { viewCount: { increment: 1 } } }).catch(() => { });

  const [upvotes, downvotes, userVote] = await Promise.all([
    prisma.vote.count({ where: { ideaId: idea.id, type: "UPVOTE" } }),
    prisma.vote.count({ where: { ideaId: idea.id, type: "DOWNVOTE" } }),
    req.user ? prisma.vote.findUnique({ where: { userId_ideaId: { userId: req.user.userId, ideaId: idea.id } } }) : null,
  ]);

  res.json({ idea: { ...responseData, upvotes, downvotes, userVote: userVote?.type || null } });
});

export const createIdea = catchAsync(async (req: Request, res: Response) => {
  const data = ideaSchema.parse(req.body);
  const slug = await generateUniqueSlug(data.title);
  const idea = await prisma.idea.create({
    data: { ...data, slug, authorId: req.user!.userId, status: data.status === "PENDING" ? IdeaStatus.UNDER_REVIEW : IdeaStatus.DRAFT },
    select: ideaSelect,
  });
  res.status(201).json({ idea });
});

export const updateIdea = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const idea = await prisma.idea.findUnique({ where: { id } });
  if (!idea || (idea.authorId !== req.user?.userId && req.user?.role !== "ADMIN")) throw new AppError("Not authorized or not found", 403);
  if (idea.status === IdeaStatus.APPROVED && req.user?.role !== "ADMIN") throw new AppError("Cannot edit approved ideas", 403);

  const data = ideaSchema.partial().parse(req.body);
  const updated = await prisma.idea.update({ where: { id }, data, select: ideaSelect });
  res.json({ idea: updated });
});

export const deleteIdea = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const idea = await prisma.idea.findUnique({ where: { id } });
  if (!idea || (idea.authorId !== req.user?.userId && req.user?.role !== "ADMIN")) throw new AppError("Not authorized or not found", 403);

  await prisma.idea.delete({ where: { id } });
  res.json({ message: "Idea deleted successfully" });
});

export const submitForReview = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const idea = await prisma.idea.findUnique({ where: { id } });
  if (!idea || idea.authorId !== req.user?.userId) throw new AppError("Not authorized", 403);
  
  const updated = await prisma.idea.update({
    where: { id },
    data: { status: IdeaStatus.UNDER_REVIEW }
  });
  res.json({ idea: updated });
});

export const getMyIdeas = catchAsync(async (req: Request, res: Response) => {
  const ideas = await prisma.idea.findMany({
    where: { authorId: req.user!.userId },
    orderBy: { createdAt: "desc" },
  });
  res.json({ ideas });
});

export const getTopIdeas = catchAsync(async (req: Request, res: Response) => {
  const ideas = await prisma.idea.findMany({
    where: { status: IdeaStatus.APPROVED },
    orderBy: { votes: { _count: "desc" } },
    take: 10,
  });
  res.json({ ideas });
});
