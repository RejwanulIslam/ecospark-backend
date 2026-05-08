import { Request, Response } from "express";
import { v2 as cloudinary } from "cloudinary";
import { catchAsync } from "../../utils/catchAsync";
import { AppError } from "../../utils/AppError";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadImage = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) throw new AppError("No image provided", 400);

  const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: "ecospark", resource_type: "image", transformation: [{ width: 1200, crop: "limit" }] },
      (error, result) => {
        if (error) reject(error);
        else resolve(result as { secure_url: string; public_id: string });
      }
    ).end(req.file!.buffer);
  });

  res.json({ url: result.secure_url, publicId: result.public_id });
});
