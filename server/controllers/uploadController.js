import { uploadEvidenceFile } from '../services/cloudinaryService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const uploadEvidence = async (req, res, next) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);

    if (!files || files.length === 0) {
      return sendError(res, 400, 'Please select at least one file to upload as evidence.');
    }

    const uploadPromises = files.map((file) => uploadEvidenceFile(file));
    const uploadedFiles = await Promise.all(uploadPromises);

    return sendSuccess(res, 201, 'Evidence files uploaded successfully', {
      files: uploadedFiles,
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.statusCode, error.message);
    }
    next(error);
  }
};
