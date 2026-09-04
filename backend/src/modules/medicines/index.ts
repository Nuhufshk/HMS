import { Router } from 'express';
import { listHandler, createHandler, updateHandler, stockHandler } from './medicines.controller';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(listHandler));
router.post('/', asyncHandler(createHandler));
router.patch('/:id/stock', asyncHandler(stockHandler));
router.patch('/:id', asyncHandler(updateHandler));

export default router;
