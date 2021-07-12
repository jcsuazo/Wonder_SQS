import { uuid } from 'uuidv4';
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

export default NodeQueue;
