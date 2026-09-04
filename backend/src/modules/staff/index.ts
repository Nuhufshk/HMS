import { Router } from 'express';
import { listHandler, createHandler, updateHandler, statusUpdateHandler } from './staff.controller';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(listHandler));
router.post('/', asyncHandler(createHandler));
router.patch('/:id/status', asyncHandler(statusUpdateHandler));
router.patch('/:id', asyncHandler(updateHandler));

export default router;
