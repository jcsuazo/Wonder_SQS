import NodeQueue from './NodeQueue';
// interface ProcessingQueueInterface {
//   uuid(): ProcessingQueue;
// }
// let klk: uuid() = uuid();
// let obj: ProcessingQueueInterface = {
//   klk: new ProcessingQueue(),
// };
class ProcessingQueue {
  time: number;
  first: NodeQueue | null;
  last: NodeQueue | null;
  size: number;
  visibilityAllowTime: number;
  messageMax: Number;

  constructor(
    first: NodeQueue,
    last: NodeQueue,
    size: number,
    visibilityAllowTime: number = 10,
    messageMax: number = 10,
  ) {
    this.time = new Date().getTime();
    this.first = first;
    this.last = last;
    this.size = size;
    this.visibilityAllowTime = visibilityAllowTime;
    this.messageMax = messageMax;
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
      let count = 0;
      while (current && count < this.messageMax) {
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
              console.log(previous);
            }
            this.size--;
          }
          break;
        }
        previous = current;
        current = current.next;
        count++;
      }
      resolve(current);
    });
  }
}

export default ProcessingQueue;
