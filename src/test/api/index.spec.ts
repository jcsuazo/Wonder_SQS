import { expect } from 'chai';
import request from 'supertest';
import { queue } from '../../lib/queue';
import createServer from '../../server';

const app = createServer();

describe('queue api core functionality', function () {
  describe('queue test', () => {
    it('/queue responds with 201', (done) => {
      request(app).post('/queues').expect(201, done);
    });

    it('should add a queue', async () => {
      const query = {
        MessageBody: 'test1',
      };
      const res = await request(app)
        .post('/queues')
        .send(query)
        .set('Accept', 'application/json');
      expect(res.body).to.have.all.keys('MessageId', 'MessageBody');
    });

    it('should return all queues values', async () => {
      const query = {
        MessageBody: 'test2',
      };
      await request(app)
        .post('/queues')
        .send(query)
        .set('Accept', 'application/json');

      const res = await request(app).get('/queues');
      let test = res.body.map(
        (message: { MessageBody: string; MessageId: string }) =>
          message.MessageBody,
      );
      expect(test).to.be.eql(['test1', 'test2']);
    });

    it('should return message upto messageMax', async () => {
      for (let i = 0; i < 20; i++) {
        await request(app)
          .post('/queues')
          .send({ MessageBody: `test # ${i}` })
          .set('Accept', 'application/json');
      }

      const res = await request(app).get('/queues');
      expect(res.body.length).to.be.eql(queue.messageMax);
    });
  });
});
