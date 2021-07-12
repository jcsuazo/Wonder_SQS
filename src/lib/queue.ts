import { uuid } from 'uuidv4';
import NodeQueue from './NodeQueue';
import ProcessingQueue from './processingQueue';

class Queue {
  first: NodeQueue | null;
  last: NodeQueue | null;
  size: number;
  messageMax: number;
  visibilityAllowTime: number;
  processingQueues: any;
  constructor(max: number = 10, visibilityAllowTime: number = 40) {
    this.first = null;
    this.last = null;
    this.size = 0;
    this.messageMax = max;
    this.visibilityAllowTime = visibilityAllowTime;
    this.processingQueues = {};
  }
  changeSettings(messageMax: number, visibilityAllowTime: number) {
    this.messageMax = messageMax;
    this.visibilityAllowTime = visibilityAllowTime;
  }
  enqueue(MessageBody: string): NodeQueue | undefined {
    if (!this.testMessageBody(MessageBody)) return undefined;
    const newNode = new NodeQueue(MessageBody);
    if (this.size === 0) {
      this.first = newNode;
      this.last = newNode;
    } else {
      let prevLastNode = this.last;
      if (prevLastNode !== null) prevLastNode.next = newNode;
      this.last = newNode;
    }
    ++this.size;
    return newNode;
  }

  async dequeue(ReceiptHandle: string): Promise<boolean | NodeQueue> {
    let visibilityTime = this.checkVisibilityTimeAndUpdateQueue(ReceiptHandle);
    if (!visibilityTime) {
      return false;
    }
    let decodeReceiptHandle = ReceiptHandle.split('&');
    let priorityQueueUUID = `${decodeReceiptHandle[0]}&${decodeReceiptHandle[1]}`;
    let processingQueue = this.processingQueues[priorityQueueUUID];
    if (!processingQueue) {
      return false;
    }
    let deletedMessage = await processingQueue.dequeueByReceiptHandle(
      ReceiptHandle,
    );

    if (processingQueue.size === 0) {
      delete this.processingQueues[priorityQueueUUID];
    }
    return deletedMessage;
  }

  showProcessingQueue() {
    return this.processingQueues;
  }

  getQueueMessageBodies(): Promise<
    { MessageId: string; MessageBody: string; ReceiptHandle: string }[]
  > {
    this.checkVisibilityTimeAndUpdateQueue();
    let currentTime = new Date().getTime();
    let priorityQueueUUID = `${uuid()}&${currentTime}`;

    return new Promise((resolve, rej) => {
      let current = this.first;
      let queueMessageBodies = [];
      let count = 0;
      while (current && count < this.messageMax) {
        let ReceiptHandle = `${priorityQueueUUID}&${uuid()}`;
        current.ReceiptHandle = ReceiptHandle;
        queueMessageBodies.push({
          MessageId: current.MessageId,
          MessageBody: current.MessageBody,
          ReceiptHandle: current.ReceiptHandle,
        });
        count++;
        if (count >= this.messageMax) {
          if (this.first) {
            this.processingQueues[priorityQueueUUID] = new ProcessingQueue(
              this.first,
              current,
              count,
            );
          }
          this.first = current.next;
          this.size = this.size - count;
        }
        current = current.next;
      }
      resolve(queueMessageBodies);
    });
  }

  checkVisibilityTimeAndUpdateQueue(ReceiptHandle: string = ''): boolean {
    if (ReceiptHandle.length > 0) {
      let decodeReceiptHandle = ReceiptHandle.split('&');
      let priorityQueueUUID = `${decodeReceiptHandle[0]}&${decodeReceiptHandle[1]}`;
      return this.checkPriorityQueueAndReset(priorityQueueUUID);
    } else {
      let priorityQueueUUIDS = Object.keys(this.processingQueues);
      priorityQueueUUIDS.forEach((priorityQueueUUID) => {
        this.checkPriorityQueueAndReset(priorityQueueUUID);
      });
      return true;
    }
  }

  checkPriorityQueueAndReset(priorityQueueUUID: string): boolean {
    let time: number = Number(priorityQueueUUID.split('&')[1]);
    let currentTime = new Date().getTime();
    if ((currentTime - time) / 1000 > this.visibilityAllowTime) {
      let processingQueue = this.processingQueues[priorityQueueUUID];
      let currentFirst = this.first;
      processingQueue.last.next = currentFirst;
      processingQueue.last = this.last;
      this.first = processingQueue.first;
      this.size = this.size + processingQueue.size;
      delete this.processingQueues[priorityQueueUUID];
      return false;
    }
    return true;
  }

  show(): any {
    let current = this.first;
    let currentQueue = [];
    let visibilityAllowTime = this.visibilityAllowTime;
    let messageMax = this.messageMax;
    let processingQueues = this.processingQueues;
    while (current) {
      currentQueue.push(current.MessageBody);
      current = current.next;
    }
    for (const key in this.processingQueues) {
      const element = this.processingQueues[key];
      let current = element.first;
      while (current) {
        current = current.next;
      }
    }
    return {
      visibilityAllowTime,
      messageMax,
      currentQueue,
      processingQueues,
    };
  }

  testMessageBody(MessageBody: string): boolean {
    if (MessageBody === undefined || MessageBody === null) {
      return false;
    } else {
      return true;
    }
  }
}
export const queue = new Queue();
export default Queue;
