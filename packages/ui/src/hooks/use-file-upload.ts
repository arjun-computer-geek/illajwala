'use client';

import { useState, useCallback } from 'react';
import type { AxiosInstance } from 'axios';
import { createStorageApi, type StorageApi } from '@illajwala/api-client';

export interface FileUploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  file?: File;
  uploadedFile?: {
    _id: string;
    url?: string;
    key: string;
    metadata: {
      originalName: string;
      mimeType: string;
      sizeInBytes: number;
      category: string;
    };
  };
}

export interface UseFileUploadOptions {
  apiClient: AxiosInstance;
  category: string;
  onUploadComplete?: (file: FileUploadProgress['uploadedFile']) => void;
  onUploadError?: (error: Error, file: FileUploadProgress) => void;
  maxFileSize?: number; // in bytes
  allowedMimeTypes?: string[];
  expiresIn?: number; // presigned URL expiration in seconds
  relatedEntityType?: 'appointment' | 'doctor' | 'clinic' | 'patient';
  relatedEntityId?: string;
}

export interface UseFileUploadReturn {
  uploadFile: (file: File) => Promise<FileUploadProgress['uploadedFile'] | null>;
  uploadFiles: (files: File[]) => Promise<FileUploadProgress['uploadedFile'][]>;
  progress: Map<string, FileUploadProgress>;
  isUploading: boolean;
  clearProgress: () => void;
  removeFile: (fileId: string) => void;
}

export const useFileUpload = (options: UseFileUploadOptions): UseFileUploadReturn => {
  const {
    apiClient,
    category,
    onUploadComplete,
    onUploadError,
    maxFileSize,
    allowedMimeTypes,
    expiresIn,
    relatedEntityType,
    relatedEntityId,
  } = options;

  const [progress, setProgress] = useState<Map<string, FileUploadProgress>>(new Map());
  const [isUploading, setIsUploading] = useState(false);

  const storageApi: StorageApi = createStorageApi(apiClient);

  const updateProgress = useCallback((fileId: string, update: Partial<FileUploadProgress>) => {
    setProgress((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(fileId) || {
        fileId,
        fileName: '',
        progress: 0,
        status: 'pending' as const,
      };
      newMap.set(fileId, { ...current, ...update });
      return newMap;
    });
  }, []);

  const validateFile = useCallback(
    (file: File): void => {
      if (maxFileSize && file.size > maxFileSize) {
        throw new Error(`File size exceeds maximum allowed size of ${maxFileSize / 1024 / 1024}MB`);
      }

      if (allowedMimeTypes && !allowedMimeTypes.includes(file.type)) {
        throw new Error(
          `File type ${file.type} is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`,
        );
      }
    },
    [maxFileSize, allowedMimeTypes],
  );

  const uploadFile = useCallback(
    async (file: File): Promise<FileUploadProgress['uploadedFile'] | null> => {
      try {
        // Validate file
        validateFile(file);

        // Generate presigned URL
        const presignedUrlParams: {
          fileName: string;
          mimeType: string;
          category: string;
          expiresIn?: number;
          relatedEntityType?: 'appointment' | 'doctor' | 'clinic' | 'patient';
          relatedEntityId?: string;
        } = {
          fileName: file.name,
          mimeType: file.type,
          category,
        };
        if (expiresIn) presignedUrlParams.expiresIn = expiresIn;
        if (relatedEntityType) presignedUrlParams.relatedEntityType = relatedEntityType;
        if (relatedEntityId) presignedUrlParams.relatedEntityId = relatedEntityId;

        const { uploadUrl, fileId } = await storageApi.generatePresignedUrl(presignedUrlParams);

        // Update progress
        updateProgress(fileId, {
          fileName: file.name,
          status: 'uploading',
          progress: 0,
          file,
        });
        setIsUploading(true);

        // Upload file to R2 using presigned URL
        const xhr = new XMLHttpRequest();

        return new Promise<FileUploadProgress['uploadedFile'] | null>((resolve, reject) => {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const progressPercent = Math.round((e.loaded / e.total) * 100);
              updateProgress(fileId, { progress: progressPercent });
            }
          });

          xhr.addEventListener('load', async () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                // Confirm upload
                const uploadedFile = await storageApi.confirmUpload({
                  fileId,
                  sizeInBytes: file.size,
                });

                updateProgress(fileId, {
                  status: 'success',
                  progress: 100,
                  uploadedFile: {
                    _id: uploadedFile._id,
                    url: uploadedFile.url,
                    key: uploadedFile.key,
                    metadata: uploadedFile.metadata,
                  },
                });

                setIsUploading(false);
                onUploadComplete?.(uploadedFile);
                resolve(uploadedFile);
              } catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                updateProgress(fileId, {
                  status: 'error',
                  error: err.message,
                });
                setIsUploading(false);
                onUploadError?.(err, progress.get(fileId)!);
                reject(err);
              }
            } else {
              const error = new Error(`Upload failed with status ${xhr.status}`);
              updateProgress(fileId, {
                status: 'error',
                error: error.message,
              });
              setIsUploading(false);
              onUploadError?.(error, progress.get(fileId)!);
              reject(error);
            }
          });

          xhr.addEventListener('error', () => {
            const error = new Error('Upload failed due to network error');
            updateProgress(fileId, {
              status: 'error',
              error: error.message,
            });
            setIsUploading(false);
            onUploadError?.(error, progress.get(fileId)!);
            reject(error);
          });

          xhr.addEventListener('abort', () => {
            const error = new Error('Upload aborted');
            updateProgress(fileId, {
              status: 'error',
              error: error.message,
            });
            setIsUploading(false);
            reject(error);
          });

          // Start upload
          xhr.open('PUT', uploadUrl);
          xhr.setRequestHeader('Content-Type', file.type);
          xhr.send(file);
        });
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setIsUploading(false);
        onUploadError?.(err, {
          fileId: '',
          fileName: file.name,
          progress: 0,
          status: 'error',
          error: err.message,
          file,
        });
        return null;
      }
    },
    [
      storageApi,
      category,
      expiresIn,
      relatedEntityType,
      relatedEntityId,
      validateFile,
      updateProgress,
      onUploadComplete,
      onUploadError,
    ],
  );

  const uploadFiles = useCallback(
    async (files: File[]): Promise<FileUploadProgress['uploadedFile'][]> => {
      setIsUploading(true);
      try {
        const results = await Promise.allSettled(files.map((file) => uploadFile(file)));
        setIsUploading(false);

        const uploadedFiles: FileUploadProgress['uploadedFile'][] = [];
        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) {
            uploadedFiles.push(result.value);
          }
        });

        return uploadedFiles;
      } catch (error) {
        setIsUploading(false);
        throw error;
      }
    },
    [uploadFile],
  );

  const clearProgress = useCallback(() => {
    setProgress(new Map());
    setIsUploading(false);
  }, []);

  const removeFile = useCallback((fileId: string) => {
    setProgress((prev) => {
      const newMap = new Map(prev);
      newMap.delete(fileId);
      return newMap;
    });
  }, []);

  return {
    uploadFile,
    uploadFiles,
    progress,
    isUploading,
    clearProgress,
    removeFile,
  };
};
