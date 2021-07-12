const path = require('path');
import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import routes from './routes/index';
import cors from 'cors';

export default function createServer() {
  const app: Application = express();

  // Set security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          'script-src': ["'self'", "'unsafe-inline'", 'http://localhost:5000/'],
        },
      },
    }),
  );
  //Prevent XSS attacks
  // app.use(xss());

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 1000,
  });
  app.use(limiter);

  //Prevent http param pollution
  app.use(hpp());

  //Enable CORS
  app.use(cors());

  //Set static folder
  app.use(express.static(path.join(__dirname, 'public')));

  app.use(express.json());
  app.use(routes);
  return app;
}
