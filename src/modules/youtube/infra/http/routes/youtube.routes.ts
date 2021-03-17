import { Router } from 'express';
import YoutubeController from '../controllers/YoutubeController';

const youtubeController = new YoutubeController();
const youtubeRouter = Router();

youtubeRouter.post('/download/playlist', youtubeController.playlist);
youtubeRouter.post('/download/movie', youtubeController.movie);
youtubeRouter.post('/search', youtubeController.search);


export default youtubeRouter;
