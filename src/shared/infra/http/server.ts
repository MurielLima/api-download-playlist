import 'reflect-metadata';
import { Router } from 'express';
import express from 'express';
import AppError from '../../errors/AppError';
import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import 'express-async-errors';
import * as dotenv from 'dotenv';
import youtubeRouter from '../../../modules/youtube/infra/http/routes/youtube.routes';

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

app.use('/youtube', youtubeRouter);
app.listen(3030, () => {
  console.log('Server started on port 3030!');
});
app.get('/', (request: Request, response: Response) => {
  return response.json({ message: 'Hello World' });
});
app.use(
  (err: Error, request: Request, response: Response, next: NextFunction) => {
    if (err instanceof AppError) {
      return response.status(err.statusCode).json({
        status: 'error',
        message: err.message,
        detail: err.detail
      });
    }

    return response.status(500).json({
      status: 'error',
      message: 'Internal Server Error.',
    });
  },
);
