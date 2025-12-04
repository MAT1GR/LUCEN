import { Router } from 'express';
import { logEvent, getFunnelMetrics } from '../controllers/analyticsController.js';

const router = Router();

router.post('/log', logEvent);
router.get('/funnel', getFunnelMetrics);

export default router;
