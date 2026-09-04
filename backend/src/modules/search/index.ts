import { Router } from 'express';
import { searchHandler } from './search.controller';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(searchHandler));

export default router;
