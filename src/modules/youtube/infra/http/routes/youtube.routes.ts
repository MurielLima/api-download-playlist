import { Router } from 'express';
import YoutubeController from '../controllers/YoutubeController';

const youtubeController = new YoutubeController();
const youtubeRouter = Router();

youtubeRouter.post('/playlist', youtubeController.playlist);
youtubeRouter.post('/movie', youtubeController.movie);


export default youtubeRouter;
