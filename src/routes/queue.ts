import { Router, Request, Response } from 'express';
import { uuid } from 'uuidv4';
import { queue } from '../lib/queue';

const router = Router();

//@route POST /queue
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

//@route POST /queue
//@desc Add a message to the queue
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
  res.status(200).json(queueValues);
});

//@route DELETE /queue
//@desc Add a message to the queue
//@access PUBLIC
router.delete('/dequeue', async (req: Request, res: Response) => {
  const ReceiptHandle = req.body.ReceiptHandle;
  const queueDeleted = await queue.dequeue(ReceiptHandle);
  if (!queueDeleted) {
    res.json({ ErrorId: uuid() });
  } else {
    res.json(queueDeleted);
    // res.json({ MessageId: queueDeleted.MessageId, MessageBody: queueDeleted.MessageBody });
    // res.json({ MessageId: queueDeleted });
  }
});

//@route DELETE /queue
//@desc Add a message to the queue
//@access PUBLIC
router.get('/migrate', async (req: Request, res: Response) => {
  for (let i = 0; i < 20; i++) {
    queue.enqueue(`message #${i}`);
  }
  res.send('done');
});

//@route DELETE /queue
//@desc Add a message to the queue
//@access PUBLIC
router.get('/show', async (req: Request, res: Response) => {
  let data = queue.show();
  res.send(data);
});
export default router;
