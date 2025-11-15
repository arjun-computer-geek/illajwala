'use client';

import { FileUpload, useFileUpload, Button } from '@illajwala/ui';
import { Paperclip, Trash2 } from 'lucide-react';
import React from 'react';
import { doctorApiClient } from '../../../lib/api-client';

type AttachmentDraft = {
  id: string;
  key: string;
  name: string;
  url?: string;
  contentType?: string;
  sizeInBytes?: number;
};

type AttachmentsSectionProps = {
  attachments: AttachmentDraft[];
  onAttachmentsChange: (attachments: AttachmentDraft[]) => void;
  appointmentId: string;
};

export const AttachmentsSection = ({
  attachments,
  onAttachmentsChange,
  appointmentId,
}: AttachmentsSectionProps) => {
  const { uploadFiles, progress, isUploading, removeFile } = useFileUpload({
    apiClient: doctorApiClient,
    category: 'consultation-attachment',
    relatedEntityType: 'appointment',
    relatedEntityId: appointmentId,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ],
    onUploadComplete: (uploadedFile) => {
      if (uploadedFile) {
        // Check if file already exists to avoid duplicates
        const existingIds = new Set(attachments.map((att) => att.id));
        if (!existingIds.has(uploadedFile._id)) {
          const newAttachment: AttachmentDraft = {
            id: uploadedFile._id,
            key: uploadedFile.key,
            name: uploadedFile.metadata.originalName,
            url: uploadedFile.url,
            contentType: uploadedFile.metadata.mimeType,
            sizeInBytes: uploadedFile.metadata.sizeInBytes,
          };
          onAttachmentsChange([...attachments, newAttachment]);
        }
      }
    },
    onUploadError: (error) => {
      console.error('File upload error:', error);
    },
  });

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    await uploadFiles(files);
  };

  const handleRemoveAttachment = (id: string) => {
    // Remove from local state
    onAttachmentsChange(attachments.filter((att) => att.id !== id));
    // Remove from upload progress if still uploading
    removeFile(id);
  };

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-background/60 p-5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          <Paperclip className="h-4 w-4" />
          Attachments
        </span>
      </div>

      <FileUpload
        onFilesSelected={handleFilesSelected}
        progress={progress}
        isUploading={isUploading}
        maxFiles={10}
        maxSize={10 * 1024 * 1024} // 10MB
        accept={{
          'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
          'application/pdf': ['.pdf'],
          'application/msword': ['.doc'],
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
          'text/plain': ['.txt'],
        }}
        disabled={isUploading}
        className="w-full"
      />

      {attachments.length > 0 && (
        <div className="mt-4 space-y-3">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between rounded-xl border border-border/60 bg-background/80 p-4"
            >
              <div className="space-y-1 text-sm flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{attachment.name}</p>
                <p className="text-xs text-muted-foreground/80">
                  {attachment.contentType ?? 'application/octet-stream'}
                  {attachment.sizeInBytes
                    ? ` · ${(attachment.sizeInBytes / 1024).toFixed(1)} KB`
                    : ''}
                </p>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="text-destructive hover:text-destructive shrink-0"
                onClick={() => handleRemoveAttachment(attachment.id)}
                aria-label="Remove attachment"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
