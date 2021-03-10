import { container, injectable } from 'tsyringe';

import AppError from "../../../shared/errors/AppError";
import DownloadMovieSnappeaService from './snappea/DownloadMovieService';
import DownloadMovieYt1sService from './yt1s/DownloadMovieService';

@injectable()
class DownloadService {
    public constructor() {
    }
    public async execute(urlMovie: string) : Promise<string> {
        const downloadMovieSnappeaService = container.resolve(
            DownloadMovieSnappeaService);
        const downloadMovieYt1sService = container.resolve(
            DownloadMovieYt1sService);
        try{
            return await downloadMovieSnappeaService.execute(urlMovie);
        }catch(err){
            return await downloadMovieYt1sService.execute(urlMovie); 
        }
    }
}
export default DownloadService;

