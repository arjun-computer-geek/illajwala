import { Router } from 'express';
import { storageRouter } from '../storage/storage.router';
import { apiRateLimit } from '../../middlewares';

export const rootRouter: Router = Router();

// Apply general API rate limiting to all routes
rootRouter.use(apiRateLimit);

rootRouter.use('/files', storageRouter);
