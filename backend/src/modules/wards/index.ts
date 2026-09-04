import { Router } from 'express';
import { listHandler, createHandler } from './wards.controller';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(listHandler));
router.post('/', asyncHandler(createHandler));

export default router;
