import { Request, Response } from 'express';
import DownloadPlaylistService from '../../../../youtube/services/DownloadPlaylistService';
import { container } from 'tsyringe';

import DownloadService from '../../../services/DownloadService';
import ZipDataService from '../../../providers/zip/ZipDataService';

export default class ProfileController {
  public async playlist(request: Request, response: Response) {
    const { url } = request.body;
    const downloadPlaylistService = container.resolve(
      DownloadPlaylistService);

    let downloadPlaylist = await downloadPlaylistService.execute(url);
    const zipDataService = container.resolve(
      ZipDataService);
  await zipDataService.execute(downloadPlaylist);
    return response.status(200).json(downloadPlaylist);
  }
  public async movie(request: Request, response: Response) {
    const { url } = request.body;
    const downloadService = container.resolve(
      DownloadService);

    let buffer = await downloadService.execute(url)

    return response.status(200).json("Estamos baixando seu arquivo mp3.");
  }
}
