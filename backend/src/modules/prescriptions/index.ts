import { Router } from 'express';
import { listHandler, getHandler, createHandler, statusUpdateHandler, dispenseHandler } from './prescriptions.controller';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(listHandler));
router.get('/:id', asyncHandler(getHandler));
router.post('/', asyncHandler(createHandler));
router.patch('/:id/status', asyncHandler(statusUpdateHandler));
router.post('/:id/dispense', asyncHandler(dispenseHandler));

export default router;
