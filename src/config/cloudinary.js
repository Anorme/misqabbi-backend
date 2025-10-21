import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import env from "../config/env.js";
import multer from "multer";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export const productUploads = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "misqabbi/products",
    },
  }),
});

export { cloudinary };
