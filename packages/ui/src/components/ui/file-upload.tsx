'use client';

import * as React from 'react';
import { useDropzone, type DropzoneOptions } from 'react-dropzone';
import { Upload, File as FileIcon, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './button';
import type { FileUploadProgress } from '../../hooks/use-file-upload';

export interface FileUploadProps extends Omit<DropzoneOptions, 'onDrop'> {
  onFilesSelected?: (files: File[]) => void;
  onFileUploaded?: (file: FileUploadProgress['uploadedFile']) => void;
  onFileError?: (error: Error, file: FileUploadProgress) => void;
  progress?: Map<string, FileUploadProgress>;
  isUploading?: boolean;
  maxFiles?: number;
  className?: string;
  disabled?: boolean;
  accept?: Record<string, string[]>;
  maxSize?: number;
  children?: React.ReactNode;
}

export const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(
  (
    {
      onFilesSelected,
      onFileUploaded,
      onFileError,
      progress = new Map(),
      isUploading = false,
      maxFiles,
      className,
      disabled,
      accept,
      maxSize,
      children,
      ...dropzoneOptions
    },
    ref,
  ) => {
    const [dragActive, setDragActive] = React.useState(false);

    const onDrop = React.useCallback(
      (acceptedFiles: File[]) => {
        if (maxFiles && acceptedFiles.length > maxFiles) {
          console.warn(`Maximum ${maxFiles} file(s) allowed`);
          return;
        }
        onFilesSelected?.(acceptedFiles);
      },
      [onFilesSelected, maxFiles],
    );

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
      onDrop,
      disabled,
      accept: accept as DropzoneOptions['accept'],
      maxSize,
      noClick: !!children,
      noKeyboard: !!children,
      ...dropzoneOptions,
    });

    React.useEffect(() => {
      setDragActive(isDragActive);
    }, [isDragActive]);

    const progressArray = Array.from(progress.values()) as FileUploadProgress[];

    return (
      <div ref={ref} className={cn('w-full', className)}>
        <div
          {...getRootProps()}
          className={cn(
            'relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg transition-colors',
            dragActive && !disabled ? 'border-primary bg-primary/5' : 'border-border bg-background',
            disabled && 'opacity-50 cursor-not-allowed',
            !disabled && 'cursor-pointer hover:border-primary/50',
          )}
        >
          <input {...getInputProps()} />
          {children || (
            <>
              <Upload
                className={cn(
                  'w-12 h-12 mb-4',
                  dragActive ? 'text-primary' : 'text-muted-foreground',
                )}
              />
              <p className="text-sm font-medium text-center mb-1">
                {dragActive ? 'Drop files here' : 'Drag and drop files here, or click to select'}
              </p>
              <p className="text-xs text-center text-muted-foreground">
                {accept && Object.keys(accept).length > 0
                  ? `Accepted types: ${Object.values(accept).flat().join(', ')}`
                  : 'Any file type'}
                {maxSize && ` • Max size: ${(maxSize / 1024 / 1024).toFixed(2)}MB`}
                {maxFiles && ` • Max files: ${maxFiles}`}
              </p>
            </>
          )}
        </div>

        {progressArray.length > 0 && (
          <div className="mt-4 space-y-2">
            {progressArray.map((fileProgress) => (
              <div
                key={fileProgress.fileId}
                className="flex items-center gap-3 p-3 border rounded-lg bg-background"
              >
                <FileIcon className="w-5 h-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{fileProgress.fileName}</p>
                  {fileProgress.status === 'uploading' && (
                    <div className="mt-1">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${fileProgress.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {fileProgress.progress}% uploaded
                      </p>
                    </div>
                  )}
                  {fileProgress.status === 'error' && fileProgress.error && (
                    <p className="text-xs text-destructive mt-1">{fileProgress.error}</p>
                  )}
                </div>
                <div className="shrink-0">
                  {fileProgress.status === 'uploading' && (
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  )}
                  {fileProgress.status === 'success' && (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  )}
                  {fileProgress.status === 'error' && (
                    <AlertCircle className="w-5 h-5 text-destructive" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {children && !disabled && (
          <Button
            type="button"
            onClick={open}
            disabled={isUploading}
            className="mt-4"
            variant="outline"
          >
            <Upload className="w-4 h-4 mr-2" />
            {isUploading ? 'Uploading...' : 'Select Files'}
          </Button>
        )}
      </div>
    );
  },
);

FileUpload.displayName = 'FileUpload';
