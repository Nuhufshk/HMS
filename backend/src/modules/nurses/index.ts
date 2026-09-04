import { Router } from 'express';
import { listHandler, createHandler, updateHandler } from './nurses.controller';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(listHandler));
router.post('/', asyncHandler(createHandler));
router.patch('/:id', asyncHandler(updateHandler));

export default router;
