import { Router } from 'express';
import {
  listHandler,
  getHandler,
  createHandler,
  maintenanceHandler,
  updateHandler,
  deleteHandler,
  historyHandler,
  assignHandler,
  transferHandler,
  dischargeHandler,
} from './beds.controller';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(listHandler));
router.post('/', asyncHandler(createHandler));
router.patch('/:id/maintenance', asyncHandler(maintenanceHandler));
router.patch('/:id', asyncHandler(updateHandler));
router.delete('/:id', asyncHandler(deleteHandler));
router.get('/:id/history', asyncHandler(historyHandler));
router.post('/:id/assign', asyncHandler(assignHandler));
router.post('/:id/transfer', asyncHandler(transferHandler));
router.post('/:id/discharge', asyncHandler(dischargeHandler));
router.get('/:id', asyncHandler(getHandler));

export default router;
