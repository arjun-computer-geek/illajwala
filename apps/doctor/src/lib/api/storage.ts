'use client';

import { doctorApiClient } from '../api-client';
import { createStorageApi } from '@illajwala/api-client';

export const storageApi = createStorageApi(doctorApiClient);
