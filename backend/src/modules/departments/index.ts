import { Router } from 'express';
import { listHandler, getHandler, staffHandler } from './departments.controller';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(listHandler));
router.get('/:id/staff', asyncHandler(staffHandler));
router.get('/:id', asyncHandler(getHandler));

export default router;
