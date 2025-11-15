'use client';

import { useCallback, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CircleAlert, FileText, Trash2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { storageApi } from '@/lib/api/storage';
import { queryKeys } from '@/lib/query-keys';
import { FileUpload, useFileUpload, Button, Badge } from '@illajwala/ui';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api-client';

export const DocumentsList = () => {
  const { isAuthenticated, hydrated, patient } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.patientDocuments(),
    queryFn: async () => {
      const result = await storageApi.listFiles({
        relatedEntityType: 'patient',
        relatedEntityId: patient?._id,
        page: 1,
        pageSize: 100,
      });
      return result;
    },
    enabled: hydrated && isAuthenticated && Boolean(patient?._id),
    staleTime: 60_000,
  });

  const { uploadFiles, progress, isUploading } = useFileUpload({
    apiClient: apiClient,
    category: 'patient-document',
    relatedEntityType: 'patient',
    relatedEntityId: patient?._id,
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
    onUploadComplete: () => {
      toast.success('Document uploaded successfully');
      void queryClient.invalidateQueries({ queryKey: queryKeys.patientDocuments() });
    },
    onUploadError: (error) => {
      toast.error(`Failed to upload document: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      await storageApi.deleteFile(fileId);
    },
    onSuccess: () => {
      toast.success('Document deleted successfully');
      void queryClient.invalidateQueries({ queryKey: queryKeys.patientDocuments() });
    },
    onError: () => {
      toast.error("We couldn't delete the document. Please try again.");
    },
  });

  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      await uploadFiles(files);
    },
    [uploadFiles],
  );

  const handleDelete = useCallback(
    (fileId: string) => {
      if (confirm('Are you sure you want to delete this document?')) {
        deleteMutation.mutate(fileId);
      }
    },
    [deleteMutation],
  );

  if (!hydrated) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-3xl bg-muted/40 p-10 text-center shadow-[0_20px_46px_-30px_rgba(15,23,42,0.55)] dark:bg-card/80 dark:text-muted-foreground/90 dark:shadow-[0_28px_62px_-30px_rgba(2,6,23,0.85)] dark:ring-1 dark:ring-primary/20">
        <h3 className="text-lg font-semibold text-foreground">Sign in to manage your documents</h3>
        <p className="mt-3 text-sm text-muted-foreground">
          Upload and manage your medical documents, prescriptions, and lab results.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-4 rounded-3xl bg-destructive/5 p-6 text-sm text-muted-foreground shadow-[0_20px_48px_-28px_rgba(220,38,38,0.45)] md:flex-row md:items-center md:justify-between dark:bg-destructive/10 dark:text-muted-foreground/90 dark:shadow-[0_26px_58px_-30px_rgba(248,113,113,0.35)] dark:ring-1 dark:ring-destructive/40">
        <div className="flex items-center gap-3">
          <CircleAlert className="h-5 w-5 text-destructive" />
          <span>
            We couldn&apos;t load your documents. Please refresh the page or try again later.
          </span>
        </div>
        <Button variant="secondary" size="sm" className="rounded-full" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const documents = data?.files ?? [];
  const filteredDocuments =
    selectedCategory === 'all'
      ? documents
      : documents.filter((doc) => doc.metadata.category === selectedCategory);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">My Documents</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload and manage your medical documents, prescriptions, and lab results.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-background/60 p-6">
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
      </div>

      {documents.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              className="rounded-full"
              onClick={() => setSelectedCategory('all')}
            >
              All
            </Button>
            <Button
              variant={selectedCategory === 'patient-document' ? 'default' : 'outline'}
              size="sm"
              className="rounded-full"
              onClick={() => setSelectedCategory('patient-document')}
            >
              Documents
            </Button>
            <Button
              variant={selectedCategory === 'prescription' ? 'default' : 'outline'}
              size="sm"
              className="rounded-full"
              onClick={() => setSelectedCategory('prescription')}
            >
              Prescriptions
            </Button>
          </div>

          {filteredDocuments.length === 0 ? (
            <div className="rounded-2xl bg-muted/30 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No documents found in this category. Upload documents to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDocuments.map((document) => (
                <div
                  key={document._id}
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-background/80 p-4 transition-colors hover:bg-background"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="rounded-lg bg-primary/10 p-3">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {document.metadata.originalName}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {document.metadata.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {document.metadata.mimeType}
                          {document.metadata.sizeInBytes
                            ? ` · ${(document.metadata.sizeInBytes / 1024).toFixed(1)} KB`
                            : ''}
                        </span>
                        {document.uploadedAt && (
                          <span className="text-xs text-muted-foreground">
                            · {new Date(document.uploadedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {document.url && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                        onClick={() => window.open(document.url, '_blank')}
                        aria-label="Download document"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full text-destructive hover:text-destructive"
                      onClick={() => handleDelete(document._id)}
                      disabled={deleteMutation.isPending}
                      aria-label="Delete document"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {documents.length === 0 && !isUploading && (
        <div className="rounded-2xl bg-muted/30 p-8 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-sm font-medium text-foreground mb-2">No documents yet</p>
          <p className="text-xs text-muted-foreground">
            Upload your medical documents, prescriptions, or lab results to get started.
          </p>
        </div>
      )}
    </div>
  );
};
