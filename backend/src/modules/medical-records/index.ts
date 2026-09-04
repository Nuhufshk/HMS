import { Router } from 'express';
import { listHandler, listPatientsHandler, createHandler } from './medical-records.controller';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.get('/patients', asyncHandler(listPatientsHandler));
router.get('/', asyncHandler(listHandler));
router.post('/', asyncHandler(createHandler));

export default router;
