import { Router } from 'express';
import { listHandler, getHandler, createHandler, statusUpdateHandler, resultHandler } from './laboratory.controller';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(listHandler));
router.get('/:id', asyncHandler(getHandler));
router.post('/', asyncHandler(createHandler));
router.patch('/:id/status', asyncHandler(statusUpdateHandler));
router.patch('/:id/result', asyncHandler(resultHandler));

export default router;
