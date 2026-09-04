import { Router } from 'express';
import {
  listHandler,
  trendHandler,
  createHandler,
  statusUpdateHandler,
  updateHandler,
} from './appointments.controller';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.get('/trend', asyncHandler(trendHandler));
router.get('/', asyncHandler(listHandler));
router.post('/', asyncHandler(createHandler));
router.patch('/:id/status', asyncHandler(statusUpdateHandler));
router.patch('/:id', asyncHandler(updateHandler));

export default router;
