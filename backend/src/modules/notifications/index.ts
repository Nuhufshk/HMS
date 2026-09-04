import { Router } from 'express';
import { listHandler, readHandler, readAllHandler } from './notifications.controller';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(listHandler));
router.post('/read-all', asyncHandler(readAllHandler));
router.post('/:id/read', asyncHandler(readHandler));

export default router;
