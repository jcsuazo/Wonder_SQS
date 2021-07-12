import { expect } from 'chai';
import Queue from '../../lib/queue';

import createServer from '../../server';

const app = createServer();

describe('queue core functionality', function () {
  this.timeout(35000);
  it('should be of class Queue', () => {
    const myQueue = new Queue();
    expect(myQueue).to.be.instanceOf(Queue);
  });

  it('should add a message to the queue', async () => {
    let MessageBody = 'test2';
    const myQueue = new Queue();
    const queueMessage = myQueue.enqueue(MessageBody);
    const messages = await myQueue.getQueueMessageBodies();
    expect(messages[0].MessageBody).to.equal(MessageBody);
  });

  it('should return only the allow amount of messages', async () => {
    const myQueue = new Queue();
    for (let i = 0; i < 250; i++) {
      myQueue.enqueue(`test# ${i}`);
    }
    const messages = await myQueue.getQueueMessageBodies();
    expect(messages.length).to.equal(myQueue.messageMax);
  });

  it('should send different message to multiple consumers', async () => {
    const myQueue = new Queue();
    for (let i = 0; i < 15; i++) {
      myQueue.enqueue(`test# ${i}`);
    }
    const consumer1Messages = await myQueue.getQueueMessageBodies();
    const consumer2Messages = await myQueue.getQueueMessageBodies();
    expect(consumer1Messages.length).to.equal(10);
    expect(consumer2Messages.length).to.equal(5);
    expect(consumer1Messages.length).to.not.equal(consumer2Messages.length);
  });

  it('should give a consumer all the message if another consumer did not process the transaction of those messages on the allow time', function (done) {
    const myQueue = new Queue(15, 1); //first arg max number of message and second arg is the visibility allow time
    for (let i = 0; i < 15; i++) {
      myQueue.enqueue(`test# ${i}`);
    }
    myQueue.getQueueMessageBodies().then(() => {
      setTimeout(function () {
        myQueue
          .getQueueMessageBodies()
          .then((consumer2Messages) => {
            expect(consumer2Messages.length).to.equal(15);
            done(); // success: call done with no parameter to indicate that it() is done()
          })
          .catch((e) => done(e));
      }, 2000);
    });
  });

  it('should dequeue a message', async () => {
    const myQueue = new Queue();
    for (let i = 0; i < 15; i++) {
      myQueue.enqueue(`test# ${i}`);
    }
    const consumerMessages = await myQueue.getQueueMessageBodies();
    const message = consumerMessages[5];
    const ReceiptHandle = message.ReceiptHandle;
    const deletedMessage: any = await myQueue.dequeue(ReceiptHandle);
    expect(message.MessageBody).to.equal(deletedMessage?.MessageBody);
  });

  it('should receive return false if the allow time to process a message has pass', (done) => {
    const myQueue2 = new Queue(15, 1);
    for (let i = 0; i < 15; i++) {
      myQueue2.enqueue(`test# ${i}`);
    }
    myQueue2.getQueueMessageBodies().then((consumerMessages) => {
      setTimeout(function () {
        const message = consumerMessages[5];
        const ReceiptHandle = message.ReceiptHandle;
        myQueue2
          .dequeue(ReceiptHandle)
          .then((deletedMessage) => {
            expect(deletedMessage).to.equal(false);
            done(); // success: call done with no parameter to indicate that it() is done()
          })
          .catch((e) => done(e));
      }, 2000);
    });
  });

  it('should send back to the queue all the messages that were not process in the allow time', (done) => {
    const myQueue2 = new Queue(15, 1);
    for (let i = 0; i < 15; i++) {
      myQueue2.enqueue(`test# ${i}`);
    }
    myQueue2.getQueueMessageBodies().then((consumerMessages) => {
      const message = consumerMessages[5];
      const ReceiptHandle = message.ReceiptHandle;
      myQueue2.dequeue(ReceiptHandle).then(() => {
        setTimeout(function () {
          myQueue2
            .getQueueMessageBodies()
            .then((consumer2Messages) => {
              expect(consumer2Messages.length).to.equal(14);
              done(); // success: call done with no parameter to indicate that it() is done()
            })
            .catch((e) => done(e));
        }, 2000);
        //
      });
    });
  });

  it('should allow to delete all messages received ', (done) => {
    const myQueue = new Queue(15, 10);
    for (let i = 0; i < 15; i++) {
      myQueue.enqueue(`test# ${i}`);
    }
    let results: string[] = [];

    myQueue
      .getQueueMessageBodies()
      .then((consumerMessages) => {
        for (let i = 0; i < consumerMessages.length; i++) {
          const message = consumerMessages[i];
          const ReceiptHandle = message.ReceiptHandle;
          myQueue
            .dequeue(ReceiptHandle)
            .then((deletedMessage: any) => {
              results.push(deletedMessage.MessageBody);
              if (i === consumerMessages.length - 1) {
                expect(results.length).to.equal(15);
                myQueue
                  .getQueueMessageBodies()
                  .then((consumerMessages) => {
                    expect(consumerMessages.length).to.equal(0);
                    done(); // success: call done with no parameter to indicate that it() is done()
                  })
                  .catch((e) => done(e));
              }
            })
            .catch((e) => done(e));
        }
      })
      .catch((e) => done(e));
  });
});
