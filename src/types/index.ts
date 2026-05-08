import { Request } from "express";
import { Role } from "@prisma/client";

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  search?: string;
  category?: string;
  status?: string;
  sortBy?: string;
  order?: string;
  isPaid?: string;
  minVotes?: string;
}
