import { Router } from 'express';
import { listHandler, getHandler, createHandler, updateHandler } from './patients.controller';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(listHandler));
router.get('/:id', asyncHandler(getHandler));
router.post('/', asyncHandler(createHandler));
router.patch('/:id', asyncHandler(updateHandler));

export default router;
