'use client';

import { apiClient } from '../api-client';
import { createStorageApi } from '@illajwala/api-client';

export const storageApi = createStorageApi(apiClient);
