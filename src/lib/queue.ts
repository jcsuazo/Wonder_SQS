import { uuid } from 'uuidv4';
// import NodeQueue from './NodeQueue';
// const { uuui } = require('uuidv4');

class NodeQueue {
  MessageBody: string;
  MessageId: string;
  next: NodeQueue | null;
  ReceiptHandle: string;
  constructor(MessageBody: string) {
    this.MessageBody = MessageBody;
    this.MessageId = uuid();
    this.next = null;
    this.ReceiptHandle = '';
  }
}
class ProcessingQueue {
  // time: number;
  first: NodeQueue | null;
  last: NodeQueue | null;
  size: number;
  // visibilityAllowTime: number;
  // messageMax: Number;

  constructor(
    first: NodeQueue,
    last: NodeQueue,
    size: number,
    // visibilityAllowTime: number = 1,
    // messageMax: number = 10,
  ) {
    // this.time = new Date().getTime();
    this.first = first;
    this.last = last;
    this.size = size;
    // this.visibilityAllowTime = visibilityAllowTime;
    // this.messageMax = messageMax;
  }

  dequeue(): NodeQueue | null {
    if (this.size === 0) return null;
    let removeNode = this.first;
    if (this.first === this.last) {
      this.last = null;
    }
    if (removeNode !== null) {
      this.first = removeNode.next;
      removeNode.next = null;
      this.size--;
      return removeNode;
    } else {
      return null;
    }
  }

  dequeueByReceiptHandle(
    ReceiptHandle: string,
  ): Promise<NodeQueue | undefined | null> {
    return new Promise((resolve, rej) => {
      let current = this.first;
      let previous = this.first;
      // let count = 0;
      while (current) {
        if (current.ReceiptHandle === ReceiptHandle) {
          if (current.MessageId === this.first?.MessageId) {
            this.dequeue();
          } else {
            if (previous && current.next == null) {
              previous.next = null;
              this.last = previous;
            } else {
              let next = current.next;
              current.next = null;

              if (previous) previous.next = next;
              // console.log(previous);
            }
            this.size--;
          }
          break;
        }
        previous = current;
        current = current.next;
        // count++;
      }
      resolve(current);
    });
  }
}

class Queue {
  first: NodeQueue | null;
  last: NodeQueue | null;
  size: number;
  // time: number;
  // queueVisibility: boolean;
  messageMax: number;
  visibilityAllowTime: number;
  processingQueues: any;
  constructor(max: number = 10, visibilityAllowTime: number = 40) {
    this.first = null;
    this.last = null;
    this.size = 0;
    // this.time = new Date().getTime();
    this.messageMax = max;
    // this.queueVisibility = true;
    this.visibilityAllowTime = visibilityAllowTime;
    this.processingQueues = {};
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
      // console.log('enter1');
      return false;
    }
    let decodeReceiptHandle = ReceiptHandle.split('&');
    let priorityQueueUUID = `${decodeReceiptHandle[0]}&${decodeReceiptHandle[1]}`;
    // let time = decodeReceiptHandle[1];
    // console.log(time);
    // console.log(priorityQueueUUID);
    let processingQueue = this.processingQueues[priorityQueueUUID];
    // console.log(processingQueue);
    let deletedMessage = await processingQueue.dequeueByReceiptHandle(
      ReceiptHandle,
    );
    return deletedMessage;
    // console.log(deletedMessage);
  }

  getQueueMessageBodies(): Promise<
    { MessageId: string; MessageBody: string; ReceiptHandle: string }[]
  > {
    this.checkVisibilityTimeAndUpdateQueue();
    let currentTime = new Date().getTime();
    let priorityQueueUUID = `${uuid()}&${currentTime}`;

    return new Promise((resolve, rej) => {
      // console.log('hello');
      let current = this.first;
      let queueMessageBodies = [];
      let count = 0;
      while (current && count < this.messageMax) {
        let ReceiptHandle = `${priorityQueueUUID}&${uuid()}`;
        current.ReceiptHandle = ReceiptHandle;
        // this.time = new Date().getTime();
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

      // let time: number = Number(decodeReceiptHandle[1]);
      // let currentTime = new Date().getTime();
      // if ((currentTime - time) / 1000 > this.visibilityAllowTime) {
      //   let processingQueue = this.processingQueues[priorityQueueUUID];
      //   let currentFirst = this.first;
      //   processingQueue.last.next = currentFirst;
      //   processingQueue.last = this.last;
      //   this.first = processingQueue.first;
      //   delete this.processingQueues[priorityQueueUUID];
      //   return false;
      // }
    } else {
      let priorityQueueUUIDS = Object.keys(this.processingQueues);
      priorityQueueUUIDS.forEach((priorityQueueUUID) => {
        this.checkPriorityQueueAndReset(priorityQueueUUID);
        // let time: number = Number(key.split('&')[1]);
        // let currentTime = new Date().getTime();
        // if ((currentTime - time) / 1000 > this.visibilityAllowTime) {
        //   let processingQueue = this.processingQueues[key];
        //   let currentFirst = this.first;
        //   processingQueue.last.next = currentFirst;
        //   processingQueue.last = this.last;
        //   this.first = processingQueue.first;
        //   delete this.processingQueues[key];
        // }
        // console.log(time);
      });
      // let current = this.first;
      // let count = 0;
      // while (current && count < 1000) {
      //   // console.log(current.MessageBody);
      //   current = current.next;
      //   count++;
      // }
      // console.log(this.processingQueues);
      return true;
      // console.log(keys);
      // let current = this.first;
    }
    // return true;
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
    let processingQueues = this.processingQueues;
    while (current) {
      // console.log(current.MessageBody);
      currentQueue.push(current.MessageBody);
      current = current.next;
    }
    for (const key in this.processingQueues) {
      const element = this.processingQueues[key];
      let current = element.first;
      while (current) {
        // console.log(current.MessageBody);
        current = current.next;
      }
    }
    return {
      currentQueue,
      processingQueues,
      visibilityAllowTime,
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
// for (let i = 0; i < 250; i++) {
//   queue.enqueue(`${i}`);
// }
// queue.enqueue('2');
// queue.enqueue('3');
// queue.enqueue('4');
// queue.enqueue('5');
// queue.enqueue('6');
// queue.enqueue('7');
// async function deleteQueue() {
//   let currentQueues = await queue.getQueueMessageBodies();
//   if (currentQueues) {
//   }
//   console.log(currentQueues.length);
//   for (let i = 0; i < currentQueues.length; i++) {
//     const currentNode = currentQueues[i];
//     console.log(currentNode);
//     let rec = currentNode.ReceiptHandle;
//     queue.dequeueByReceiptHandle(rec);
//   }
//   //   let rc = currentQueues[2].ReceiptHandle;
//   //   console.log(rc);
//   //   queue.dequeueByReceiptHandle(rc);
//   let updatedQue = await queue.getQueueMessageBodies();
//   console.log(queue.size);
//   console.log(updatedQue);
// }
// deleteQueue();
// async function deleteQueue() {
//   const consumer1 = await queue.getQueueMessageBodies();
//   setTimeout(async () => {
//     console.log('enter1111');
//     let message = consumer1[4];
//     console.log(message);
//     let ReceiptHandle = message.ReceiptHandle;
//     let deleteMessage = queue.dequeue(ReceiptHandle);
//     console.log(queue.processingQueues);
//     queue.show();

//     // const consumer2 = await queue.getQueueMessageBodies();
//   }, 10000);
//   // console.log(allQueues);
// }
// // deleteQueue();
// console.log(queue.processingQueues);
// console.log(queue);
// console.log('showig-------');
