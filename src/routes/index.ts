import { Router } from 'express';
import queue from './queue';

const router = Router();

router.use('/queues', queue);

export default router;
