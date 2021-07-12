import { expect } from 'chai';
// import createServer from '../../src/server';
import createServer from '../../../src/server';

import request from 'supertest';
const app = createServer();

// describe('server checks', () => {
//   it('server is created without errors', (done) => {
//     request(app).get('/').expect(200, done);
//   });
// });
