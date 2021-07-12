import { Router, Request, Response } from 'express';
import { uuid } from 'uuidv4';
import { queue } from '../lib/queue';

const router = Router();

//@route POST /
//@desc Add a message to the queue
//@access PUBLIC
router.post('/', (req: Request, res: Response) => {
  const MessageBody = queue.enqueue(req.body.MessageBody);
  res.status(201).json({
    MessageId: MessageBody?.MessageId,
    MessageBody: MessageBody?.MessageBody,
  });
  //   res.status(201).json({ id: '1', value: 'hello' });
});

//@route GET /
//@desc Send messages to a consumer default 10
//@access PUBLIC
router.get('/', async (req: Request, res: Response) => {
  // if (!queue.queueVisibility) {
  //   let currentTime = new Date().getTime();
  //   if ((currentTime - queue.time) / 1000 > queue.visibilityAllowTime) {
  //     queue.queueVisibility = true;
  //   } else {
  //     return res.status(200).json({ errorId: uuid() });
  //   }
  // }
  // res.send(klk);
  const queueValues = await queue.getQueueMessageBodies();
  if (queueValues.length === 0) {
    return res.status(200).json({ message: 'the queue is empty' });
  }
  res.status(200).json(queueValues);
});

//@route DELETE /dequeue
//@desc DELETE  message from the queue
//@access PUBLIC
router.delete('/dequeue', async (req: Request, res: Response) => {
  const ReceiptHandle = req.body.ReceiptHandle;
  const queueDeleted = await queue.dequeue(ReceiptHandle);
  if (!queueDeleted) {
    res.json({ ErrorId: uuid() });
  } else {
    res.status(202).json(queueDeleted);
    // res.json({ MessageId: queueDeleted.MessageId, MessageBody: queueDeleted.MessageBody });
    // res.json({ MessageId: queueDeleted });
  }
});

//@route GET /migrate
//@desc Store 250 messages for testing purposes
//@access PUBLIC
router.get('/migrate', async (req: Request, res: Response) => {
  for (let i = 0; i < 250; i++) {
    queue.enqueue(`message #${i}`);
  }
  res.status(201).json({ migrate: 'done' });
});

//@route DELETE /queue
//@desc Add a message to the queue
//@access PUBLIC
router.get('/show', async (req: Request, res: Response) => {
  let data = queue.show();
  res.send(data);
});
export default router;
