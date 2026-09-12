import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Image as ImageIcon, X, CheckCircle, AlertCircle } from 'lucide-react';
import Spinner from './Spinner';
import { uploadEvidenceFiles } from '../../services/uploadService';

export const FileUpload = ({ onFilesUploaded, uploadedFiles = [], maxFiles = 5 }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.pdf', '.txt', '.json'];

  const handleFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    setError(null);

    const filesArray = Array.from(fileList);

    // Validate count
    if (uploadedFiles.length + filesArray.length > maxFiles) {
      setError(`You can attach up to ${maxFiles} evidence files total.`);
      return;
    }

    // Validate types & sizes
    for (const file of filesArray) {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        setError(`File '${file.name}' has an unsupported extension. Allowed: ${allowedExtensions.join(', ')}`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(`File '${file.name}' exceeds the 5MB file size limit.`);
        return;
      }
    }

    // Perform upload
    setIsUploading(true);
    try {
      const response = await uploadEvidenceFiles(filesArray);
      if (response.success && response.data?.files) {
        onFilesUploaded([...uploadedFiles, ...response.data.files]);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'File upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleRemove = (indexToRemove) => {
    const updated = uploadedFiles.filter((_, idx) => idx !== indexToRemove);
    onFilesUploaded(updated);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-3">
      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-150 ${
          isDragging
            ? 'border-cyan-400 bg-cyan-950/20'
            : 'border-slate-700/80 hover:border-cyan-500/50 hover:bg-slate-900/40 bg-slate-900/20'
        } ${isUploading ? 'opacity-60 pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".png,.jpg,.jpeg,.webp,.gif,.pdf,.txt,.json"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {isUploading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-2">
            <Spinner size="md" className="text-cyan-400" />
            <p className="text-xs font-mono text-cyan-400">Uploading and validating evidence...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">
                Click to browse or drag & drop proof-of-concept files
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                PNG, JPG, WebP, GIF, PDF, TXT, JSON (Max 5MB each, up to {maxFiles} files)
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/30 border border-red-900/40 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2 pt-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Attached Evidence ({uploadedFiles.length}/{maxFiles}):
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {uploadedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="p-1.5 rounded bg-cyan-500/10 text-cyan-400 shrink-0">
                    {file.fileType?.startsWith('image') ? (
                      <ImageIcon className="h-4 w-4" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-slate-200 font-medium truncate max-w-[170px]" title={file.fileName}>
                      {file.fileName}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {formatFileSize(file.fileSize)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                  title="Remove file"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
