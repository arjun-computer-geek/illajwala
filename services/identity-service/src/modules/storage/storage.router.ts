import { Router } from 'express';
import { requireAuth, validateRequest } from '../../middlewares';
import {
  handleGeneratePresignedUrl,
  handleConfirmUpload,
  handleGetFile,
  handleListFiles,
  handleDeleteFile,
} from './storage.controller';

export const storageRouter: Router = Router();

// Generate presigned URL for upload
storageRouter.post(
  '/presigned-url',
  requireAuth(['patient', 'doctor', 'admin']),
  handleGeneratePresignedUrl,
);

// Confirm file upload (after client uploads to R2)
storageRouter.post(
  '/:fileId/confirm',
  requireAuth(['patient', 'doctor', 'admin']),
  handleConfirmUpload,
);

// Get file details and download URL
storageRouter.get('/:fileId', requireAuth(['patient', 'doctor', 'admin']), handleGetFile);

// List files
storageRouter.get('/', requireAuth(['patient', 'doctor', 'admin']), handleListFiles);

// Delete file
storageRouter.delete('/:fileId', requireAuth(['patient', 'doctor', 'admin']), handleDeleteFile);
