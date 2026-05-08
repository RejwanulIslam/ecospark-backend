import { Request, Response } from "express";
import { z } from "zod";
import { AuthService } from "./auth.service";
import { catchAsync } from "../../utils/catchAsync";

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain uppercase, lowercase, and number"
  ),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const googleLoginSchema = z.object({
  idToken: z.string().min(1, "Google ID Token is required"),
});

export const register = catchAsync(async (req: Request, res: Response) => {
  const data = registerSchema.parse(req.body);
  const result = await AuthService.register(data);
  res.status(201).json(result);
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const data = loginSchema.parse(req.body);
  const result = await AuthService.login(data);
  res.json(result);
});

export const googleLogin = catchAsync(async (req: Request, res: Response) => {
  const { idToken } = googleLoginSchema.parse(req.body);
  const result = await AuthService.googleLogin(idToken);
  res.json(result);
});

export const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = await AuthService.getMe(req.user!.userId);
  res.json({ user });
});

export const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const schema = z.object({
    name: z.string().min(2).max(100).optional(),
    bio: z.string().max(500).optional(),
    avatar: z.string().url().optional(),
  });
  const data = schema.parse(req.body);
  const user = await AuthService.updateProfile(req.user!.userId, data);
  res.json({ user });
});

export const changePassword = catchAsync(async (req: Request, res: Response) => {
  const schema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  });
  const data = schema.parse(req.body);
  const result = await AuthService.changePassword(req.user!.userId, data);
  res.json(result);
});
