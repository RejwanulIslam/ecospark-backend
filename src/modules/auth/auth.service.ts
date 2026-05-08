import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { AppError } from "../../utils/AppError";
import { prisma } from "../../lib/prisma";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const generateToken = (userId: string, email: string, role: string) => {
  return jwt.sign(
    { userId, email, role },
    process.env.JWT_SECRET as string,
    { expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as jwt.SignOptions["expiresIn"] }
  );
};

export class AuthService {
  static async register(data: any) {
    const { name, email, password } = data;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError("Email already registered", 409);

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      },
      select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true },
    });

    const token = generateToken(user.id, user.email, user.role);
    return { token, user };
  }

  static async login(data: any) {
    const { email, password } = data;
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user || !user.password) throw new AppError("Invalid credentials", 401);
    if (!user.isActive) throw new AppError("Account is deactivated. Please contact support.", 403);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new AppError("Invalid credentials", 401);

    const token = generateToken(user.id, user.email, user.role);
    const { password: _, ...userWithoutPassword } = user;
    return { token, user: userWithoutPassword };
  }

  static async googleLogin(idToken: string) {
    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (error) {
      throw new AppError("Invalid Google token", 401);
    }

    const payload = ticket.getPayload() as any;
    if (!payload || !payload.email) throw new AppError("Invalid Google payload", 400);

    const { email, name, picture, sub: googleId } = payload;

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || "Google User",
          googleId,
          authProvider: "google",
          avatar: picture || `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(name || email)}`,
        },
      });
    } else {
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId, authProvider: "google" },
        });
      }
      if (!user.isActive) throw new AppError("Account is deactivated. Please contact support.", 403);
    }

    const token = generateToken(user.id, user.email, user.role);
    const { password: _, ...userWithoutPassword } = user;
    return { token, user: userWithoutPassword };
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, email: true, role: true,
        avatar: true, bio: true, isActive: true, createdAt: true,
        _count: { select: { ideas: true, votes: true, comments: true } },
      },
    });
    if (!user) throw new AppError("User not found", 404);
    return user;
  }

  static async updateProfile(userId: string, data: any) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, name: true, email: true, role: true, avatar: true, bio: true },
    });
  }

  static async changePassword(userId: string, data: any) {
    const { currentPassword, newPassword } = data;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError("User not found", 404);
    if (!user.password) throw new AppError("Password cannot be changed for Google accounts", 400);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new AppError("Current password is incorrect", 400);

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
    return { message: "Password changed successfully" };
  }
}
