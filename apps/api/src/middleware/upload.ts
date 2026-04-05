import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AppError } from './errorHandler.js';

const resolvedUploadDir = process.env.UPLOAD_DIR?.trim();
export const UPLOAD_DIR = resolvedUploadDir
  ? path.resolve(resolvedUploadDir)
  : path.join(process.cwd(), 'uploads');
const PANORAMA_DIR = path.join(UPLOAD_DIR, 'panoramas');

// Ensure upload directories exist
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(PANORAMA_DIR)) {
  fs.mkdirSync(PANORAMA_DIR, { recursive: true });
}

const panoramaStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, PANORAMA_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `panorama-${uniqueSuffix}${ext}`);
  },
});

const imageFileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(400, 'Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
  }
};

export const uploadPanorama = multer({
  storage: panoramaStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
}).single('image');

export const PANORAMA_URL_PREFIX = '/uploads/panoramas';
