import axios, { AxiosRequestConfig } from "axios";
import { container, injectable } from 'tsyringe';
import * as URI from 'uri-js';

import AppError from "../../../shared/errors/AppError";
import DownloadMovieService from './DownloadMovieService';

interface IMovie {
    videoId: string
}
interface IITem {
    contentDetails: IMovie
}
const URL_API_YOUTUBE = process.env.URL_API_YOUTUBE || 'https://content-youtube.googleapis.com/youtube/v3';
const API_KEY = process.env.API_KEY || 'AIzaSyCEIJEjX_4y5Duqh9gz8HPDjFHkWL1GH6I';
const URL_YOUTUBE = process.env.URL_YOUTUBE || 'https://www.youtube.com/watch';
const MAX_RESULTS = process.env.MAX_RESULTS || 50;

@injectable()
class DownloadPlaylistService {
    public constructor() {
    }
    public async execute(urlMovie: string) {
        if (!urlMovie)
            throw new AppError('Informe a URL da playlist!');

        let urlParse = URI.parse(urlMovie);
        if (!urlParse.query)
            throw new AppError('Informe uma URL de playlist válida!');

        let playlist = urlParse.query.split("list=");
        if (playlist.length < 1)
            throw new AppError('Informe uma URL que contenha o parâmetro "list".');

        let movies = await this.getMoviesInPlaylist(playlist[1]);
        if (!movies)
            throw new AppError('Não foram encontrados vídeos na sua playlist!');

        console.log(`A playlist contém ${movies.length} músicas.`);

        
        return await this.downloadMovies(movies);
    }
    public async getMoviesInPlaylist(playlistId: string, pageToken?: string): Promise<IITem[]> {
        let items: IITem[] = [];

        let config = {
            params: {
                key: API_KEY,
                maxResults: MAX_RESULTS,
                playlistId: playlistId,
                part: "contentDetails",
                pageToken: pageToken
            }
        }

        let youtubeResponse = await axios.get(`${URL_API_YOUTUBE}/playlistItems`, config)
            .then((response) => {
                return response.data;
            }).catch(err => {
                console.error(err.response);
            });

        if (youtubeResponse)
            if (youtubeResponse.pageInfo) {
                pageToken = youtubeResponse.nextPageToken;
            }

        if (!!pageToken) {
            let responseItems = await this.getMoviesInPlaylist(playlistId, pageToken);
            responseItems.forEach((item: IITem) => items.push(item));
        }
        youtubeResponse.items.forEach((item: IITem) => items.push(item));

        return items;
    }
    public async downloadMovies(items: IITem[]) {
        const downloadMovieService = container.resolve(
            DownloadMovieService);
        let errors: any[] = [];
        let count = 0;
        await Promise.all(items.map(async (item: IITem) => {
            try{
                await downloadMovieService.execute(`${URL_YOUTUBE}?v=${item.contentDetails.videoId}`) 
                console.log(`Progresso - (${Math.round(count++*100/items.length)}%) | Músicas baixadas com sucesso- (${count-errors.length}/${items.length}) | Músicas com erro- (${errors.length}/${items.length})`);
            }catch(err){
                count++;
                err.message = `${err.message} - ${URL_YOUTUBE}?v=${item.contentDetails.videoId}`;
                errors.push(err.message);
                console.log(err.message);
            }
        }));
        console.log(`============================================`);
        console.log(`============DOWNLOAD FINALIZADO=============`);
        console.log(`Músicas com sucesso - (${count-errors.length}/${items.length})`);
        console.log(`Músicas com erros - (${errors.length})`);
        console.log(`============================================`);
        
        if(errors)
            throw new AppError(`Download de ${count-errors.length} músicas com sucesso`,
                                400,
                                errors);
        return 'Download feito com sucesso!';
    }
}
export default DownloadPlaylistService;

