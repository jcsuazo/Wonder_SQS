import { Router } from 'express';
import auth from './auth';
import queue from './queue';

const router = Router();

router.use('/auth', auth);
router.use('/queues', queue);

export default router;
