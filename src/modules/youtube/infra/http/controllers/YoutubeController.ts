import { Request, Response } from 'express';
import DownloadMovieService from '../../../../youtube/services/DownloadMovieService';
import DownloadPlaylistService from '../../../../youtube/services/DownloadPlaylistService';
import { container } from 'tsyringe';

export default class ProfileController {
  public async playlist(request: Request, response: Response) {
    const { url } = request.body;
    const downloadPlaylistService = container.resolve(
      DownloadPlaylistService);

    let downloadPlaylist = await downloadPlaylistService.execute(url);
    return response.status(200).json(downloadPlaylist);
  }
  public async movie(request: Request, response: Response) {
    const { url } = request.body;
    const downloadMovieService = container.resolve(
      DownloadMovieService);
      
    await downloadMovieService.execute(url);
    return response.status(200).json("Estamos baixando seu arquivo mp3.");
  }
}
