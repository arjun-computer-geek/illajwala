import type { AxiosInstance } from 'axios';
import type { ApiResponse } from '@illajwala/types';

export interface FileDocument {
  _id: string;
  tenantId: string;
  key: string;
  url?: string;
  status: 'uploading' | 'uploaded' | 'deleted';
  metadata: {
    originalName: string;
    mimeType: string;
    sizeInBytes: number;
    category: string;
  };
  uploadedBy: string;
  uploadedAt?: string;
  deletedAt?: string;
  relatedEntityType?: 'appointment' | 'doctor' | 'clinic' | 'patient';
  relatedEntityId?: string;
}

export interface PresignedUrlResult {
  uploadUrl: string;
  fileId: string;
  key: string;
}

export interface GeneratePresignedUrlInput {
  fileName: string;
  mimeType: string;
  category: string;
  expiresIn?: number;
  relatedEntityType?: 'appointment' | 'doctor' | 'clinic' | 'patient';
  relatedEntityId?: string;
}

export interface ConfirmUploadInput {
  fileId: string;
  sizeInBytes: number;
}

export interface ListFilesParams {
  category?: string;
  relatedEntityType?: 'appointment' | 'doctor' | 'clinic' | 'patient';
  relatedEntityId?: string;
  page?: number;
  pageSize?: number;
}

export interface ListFilesResponse {
  files: FileDocument[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type StorageApi = {
  generatePresignedUrl: (input: GeneratePresignedUrlInput) => Promise<PresignedUrlResult>;
  confirmUpload: (input: ConfirmUploadInput) => Promise<FileDocument>;
  getFile: (fileId: string) => Promise<{ file: FileDocument; downloadUrl?: string }>;
  listFiles: (params?: ListFilesParams) => Promise<ListFilesResponse>;
  deleteFile: (fileId: string) => Promise<void>;
};

export const createStorageApi = (client: AxiosInstance): StorageApi => ({
  async generatePresignedUrl(input) {
    const response = await client.post<ApiResponse<PresignedUrlResult>>(
      '/api/storage/presigned-url',
      input,
    );
    return response.data.data;
  },

  async confirmUpload(input) {
    const response = await client.post<ApiResponse<FileDocument>>(
      `/api/storage/${input.fileId}/confirm`,
      { sizeInBytes: input.sizeInBytes },
    );
    return response.data.data;
  },

  async getFile(fileId: string) {
    const response = await client.get<ApiResponse<{ file: FileDocument; downloadUrl?: string }>>(
      `/api/storage/${fileId}`,
    );
    return response.data.data;
  },

  async listFiles(params) {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.relatedEntityType)
      queryParams.append('relatedEntityType', params.relatedEntityType);
    if (params?.relatedEntityId) queryParams.append('relatedEntityId', params.relatedEntityId);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());

    const url = `/api/storage${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await client.get<ApiResponse<FileDocument[]>>(url);

    // Extract meta from response if available
    const responseData = response.data as ApiResponse<FileDocument[]> & {
      meta?: { total: number; page: number; pageSize: number; totalPages: number };
    };
    const meta = responseData.meta || {
      total: responseData.data?.length || 0,
      page: params?.page || 1,
      pageSize: params?.pageSize || 20,
      totalPages: 1,
    };

    return {
      files: response.data.data || [],
      total: meta.total,
      page: meta.page,
      pageSize: meta.pageSize,
      totalPages: meta.totalPages,
    };
  },

  async deleteFile(fileId: string) {
    await client.delete(`/api/storage/${fileId}`);
  },
});
