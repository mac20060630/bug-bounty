import multer from 'multer';
import path from 'path';

const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
  'application/json',
];

const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.pdf', '.txt', '.json'];

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  // Validate extension
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    const err = new Error(
      `Invalid file extension '${ext}'. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}`
    );
    err.statusCode = 400;
    return cb(err, false);
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    const err = new Error(
      `Invalid MIME type '${file.mimetype}'. Allowed types: images (PNG, JPEG, WebP, GIF), PDF, TXT, JSON`
    );
    err.statusCode = 400;
    return cb(err, false);
  }

  cb(null, true);
};

export const evidenceUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 Megabytes maximum
    files: 5, // Maximum 5 files per request
  },
  fileFilter,
});
