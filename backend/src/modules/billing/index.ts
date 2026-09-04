import { Router } from 'express';
import { listHandler, getHandler, createHandler, paymentHandler } from './billing.controller';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(listHandler));
router.post('/', asyncHandler(createHandler));
router.get('/:id', asyncHandler(getHandler));
router.post('/:id/payments', asyncHandler(paymentHandler));

export default router;
