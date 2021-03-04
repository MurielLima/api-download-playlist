import { Router } from 'express';
import youtubeRouter from '@modules/youtube/infra/http/routes/youtube.routes';

const routes = Router();
routes.use('/youtube', youtubeRouter);

export default routes;
