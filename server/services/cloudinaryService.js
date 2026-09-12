import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Cloudinary if credentials are present
const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  console.log('[Upload] Cloudinary configured successfully.');
} else {
  console.log('[Upload] Cloudinary credentials not detected; using secure local disk storage fallback.');
}

const LOCAL_UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'evidence');

// Ensure local fallback directory exists
if (!fs.existsSync(LOCAL_UPLOADS_DIR)) {
  fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
}

export const uploadEvidenceFile = async (file) => {
  if (!file) {
    throw new Error('No file provided for upload.');
  }

  const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.pdf', '.txt', '.json'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (!allowedExtensions.includes(ext)) {
    throw new Error(`Unsupported file type: ${ext}. Allowed types: ${allowedExtensions.join(', ')}`);
  }

  // Upload to Cloudinary if available
  if (isCloudinaryConfigured) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'bugbounty_evidence',
          resource_type: ext === '.pdf' || ext === '.txt' || ext === '.json' ? 'raw' : 'image',
          allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'gif', 'pdf', 'txt', 'json'],
        },
        (error, result) => {
          if (error) {
            return reject(new Error(`Cloudinary upload failed: ${error.message}`));
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            fileName: file.originalname,
            fileType: file.mimetype,
            fileSize: file.size,
          });
        }
      );
      uploadStream.end(file.buffer);
    });
  }

  // Local storage fallback for local development & testing
  const sanitizedOriginalName = path.basename(file.originalname).replace(/[^a-zA-Z0-9.-]/g, '_');
  const uniqueName = `evidence_${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${sanitizedOriginalName}`;
  const targetPath = path.join(LOCAL_UPLOADS_DIR, uniqueName);

  fs.writeFileSync(targetPath, file.buffer);

  return {
    url: `/uploads/evidence/${uniqueName}`,
    publicId: uniqueName,
    fileName: file.originalname,
    fileType: file.mimetype,
    fileSize: file.size,
  };
};
