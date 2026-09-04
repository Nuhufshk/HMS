import { Router } from 'express';
import { loginHandler, logoutHandler, meHandler, requireAuthHandler } from './auth.controller';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.post('/login', asyncHandler(loginHandler));
router.post('/logout', logoutHandler);
router.get('/me', asyncHandler(requireAuthHandler), meHandler);

export { requireAuthHandler as requireAuth };
export { publicUser } from './auth.service';
export { issueToken, parseToken } from './auth.service';
export default router;
