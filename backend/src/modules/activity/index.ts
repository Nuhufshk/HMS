import { Router } from 'express';
import { listHandler } from './activity.controller';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(listHandler));

export default router;
