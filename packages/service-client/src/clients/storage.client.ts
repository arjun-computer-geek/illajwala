import { ServiceClient, type ServiceClientOptions } from '../client';
import { serviceConfig } from '../config';

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

export interface StorageServiceClient {
  generatePresignedUrl(data: {
    fileName: string;
    mimeType: string;
    category: string;
    expiresIn?: number;
    relatedEntityType?: 'appointment' | 'doctor' | 'clinic' | 'patient';
    relatedEntityId?: string;
  }): Promise<PresignedUrlResult>;
  confirmFileUpload(fileId: string, sizeInBytes: number): Promise<FileDocument>;
  getFile(fileId: string): Promise<{ file: FileDocument; downloadUrl?: string }>;
  listFiles(params?: {
    category?: string;
    relatedEntityType?: 'appointment' | 'doctor' | 'clinic' | 'patient';
    relatedEntityId?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ files: FileDocument[]; total: number; page: number; totalPages: number }>;
  deleteFile(fileId: string): Promise<void>;
}

export class StorageServiceClientImpl implements StorageServiceClient {
  private client: ServiceClient;

  constructor(options?: Partial<ServiceClientOptions>) {
    this.client = new ServiceClient(
      {
        baseURL: serviceConfig.storageServiceUrl,
        ...options,
      },
      serviceConfig,
    );
  }

  async generatePresignedUrl(data: {
    fileName: string;
    mimeType: string;
    category: string;
    expiresIn?: number;
    relatedEntityType?: 'appointment' | 'doctor' | 'clinic' | 'patient';
    relatedEntityId?: string;
  }): Promise<PresignedUrlResult> {
    const response = await this.client.post<{ data: PresignedUrlResult; message?: string }>(
      '/api/files/presigned-url',
      data,
    );
    return response.data;
  }

  async confirmFileUpload(fileId: string, sizeInBytes: number): Promise<FileDocument> {
    const response = await this.client.post<{ data: FileDocument; message?: string }>(
      `/api/files/${fileId}/confirm`,
      { sizeInBytes },
    );
    return response.data;
  }

  async getFile(fileId: string): Promise<{ file: FileDocument; downloadUrl?: string }> {
    const response = await this.client.get<{
      data: { file: FileDocument; downloadUrl?: string };
      message?: string;
    }>(`/api/files/${fileId}`);
    return response.data;
  }

  async listFiles(params?: {
    category?: string;
    relatedEntityType?: 'appointment' | 'doctor' | 'clinic' | 'patient';
    relatedEntityId?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ files: FileDocument[]; total: number; page: number; totalPages: number }> {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.relatedEntityType)
      queryParams.append('relatedEntityType', params.relatedEntityType);
    if (params?.relatedEntityId) queryParams.append('relatedEntityId', params.relatedEntityId);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());

    const url = `/api/files${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await this.client.get<{
      data: FileDocument[];
      meta: { total: number; page: number; pageSize: number; totalPages: number };
    }>(url);
    return {
      files: response.data,
      total: response.meta.total,
      page: response.meta.page,
      totalPages: response.meta.totalPages,
    };
  }

  async deleteFile(fileId: string): Promise<void> {
    await this.client.delete(`/api/files/${fileId}`);
  }
}

export function createStorageServiceClient(
  options?: Partial<ServiceClientOptions>,
): StorageServiceClient {
  return new StorageServiceClientImpl(options);
}
