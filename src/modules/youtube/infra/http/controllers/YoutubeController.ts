import { Request, Response } from 'express';
import DownloadPlaylistService from '../../../services/DownloadService';
import { container } from 'tsyringe';

import DownloadService from '../../../services/DownloadService';
import ZipDataService from '../../../providers/zip/ZipDataService';
import ListMoviesService, {IItem} from '../../../services/ListMoviesService';
interface IRequest extends Request{
  query :{list?:string;}
}
export default class ProfileController {
  public async playlist(request: Request, response: Response) {
    const { url } = request.body;
    const downloadPlaylistService = container.resolve(
      DownloadPlaylistService);

    let downloadPlaylist : string[] = [];
    for(let link of url)
      downloadPlaylist = downloadPlaylist.concat(await downloadPlaylistService.execute(link));

    const zipDataService = container.resolve(
      ZipDataService);
  await zipDataService.execute(downloadPlaylist);
    return response.status(200).json(downloadPlaylist);
  }
  public async movie(request: Request, response: Response) {
    const { url } = request.body;
    const downloadService = container.resolve(
      DownloadService);
    for(let link of url)
      await downloadService.execute(link);

    return response.status(200).json("Estamos baixando seu arquivo mp3.");
  }
  public async search(request: Request, response: Response) {
    const {url}  = request.body;
    const listMoviesService = container.resolve(
      ListMoviesService);
    let movies : IItem[] = [];
     movies = await listMoviesService.execute(`https://www.youtube.com/watch?list=${url}`);

    return response.status(200).json(movies);
  }
}
