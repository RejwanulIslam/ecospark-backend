import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import slugify from "../../utils/slugify";
import { catchAsync } from "../../utils/catchAsync";
import { prisma } from "../../lib/prisma";

export const getCategories = catchAsync(async (_req: Request, res: Response) => {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { ideas: true } } },
    orderBy: { name: "asc" },
  });
  res.json({ categories });
});

export const createCategory = catchAsync(async (req: Request, res: Response) => {
  const schema = z.object({
    name: z.string().min(2).max(50),
    description: z.string().optional(),
    icon: z.string().optional(),
    color: z.string().optional(),
  });

  const data = schema.parse(req.body);
  const slug = slugify(data.name);

  const category = await prisma.category.create({
    data: { ...data, slug },
  });

  res.status(201).json({ category });
});

export const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const schema = z.object({
    name: z.string().min(2).max(50).optional(),
    description: z.string().optional(),
    icon: z.string().optional(),
    color: z.string().optional(),
  });

  const data = schema.parse(req.body);
  const updated = await prisma.category.update({
    where: { id },
    data: { ...data, ...(data.name && { slug: slugify(data.name) }) },
  });

  res.json({ category: updated });
});

export const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await prisma.category.delete({ where: { id } });
  res.json({ message: "Category deleted" });
});
