'use client';

import { Button } from '@illajwala/ui';
import { Paperclip, Plus, Trash2 } from 'lucide-react';
import React from 'react';

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
  onAdd: () => void;
  onRemove: (id: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileSelect: (files: FileList | null) => void;
};

export const AttachmentsSection = ({
  attachments,
  onAdd,
  onRemove,
  fileInputRef,
  onFileSelect,
}: AttachmentsSectionProps) => {
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-background/60 p-5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          <Paperclip className="h-4 w-4" />
          Attachments
        </span>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(event) => onFileSelect(event.target.files)}
          />
          <Button size="sm" variant="outline" className="rounded-full px-3 text-xs" onClick={onAdd}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add files
          </Button>
        </div>
      </div>
      {attachments.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/60 bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
          Upload lab orders, prescriptions, or consent forms. S3 uploads are stubbed in development;
          metadata is stored for QA.
        </p>
      ) : (
        <div className="space-y-3">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between rounded-xl border border-border/60 bg-background/80 p-4"
            >
              <div className="space-y-1 text-sm">
                <p className="font-medium text-foreground">{attachment.name}</p>
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
                className="text-destructive hover:text-destructive"
                onClick={() => onRemove(attachment.id)}
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
