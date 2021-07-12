import express, { Application, Request, Response, NextFunction } from 'express';
// import Queue from './lib/queue';
import routes from './routes/index';

export default function createServer() {
  const app: Application = express();
  app.get('/', (req: Request, res: Response, next: NextFunction) => {
    res.send('hello world!');
  });
  app.use(express.json());
  app.use(routes);
  return app;
}

// export const queue = new Queue();
