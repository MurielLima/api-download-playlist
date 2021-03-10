import axios, { AxiosRequestConfig } from "axios";
import { container, injectable } from 'tsyringe';
import * as URI from 'uri-js';
import _ from 'lodash';

import AppError from "../../../shared/errors/AppError";
import DownloadService from './DownloadService';

interface IUrlYoutube{
    [key:string]:string
}
interface IMovie {
    videoId: string
}
interface IItem {
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
    public async execute(urlMovie: string) : Promise<string[]> {
        if (!urlMovie)
            throw new AppError('Informe a URL da playlist!');

        let urlParse = URI.parse(urlMovie);
        if (!urlParse.query)
            throw new AppError('Informe uma URL de playlist válida!');

        let playlist = urlParse.query.replace(/\&/g,',').replace(/\=/g,':');
        let playlistYoutube = this.convertInObject(playlist);

        if (!playlistYoutube['list'])
            throw new AppError('Informe uma URL que contenha o parâmetro "list".');

        let movies = await this.getMoviesInPlaylist(playlistYoutube['list']);
        if (!movies)
            throw new AppError('Não foram encontrados vídeos na sua playlist!');
        movies = _.uniqBy(movies, 'id');
        console.log(`A playlist contém ${movies.length} músicas.`);

        
        return await this.downloadMovies(movies);
    }
    public async getMoviesInPlaylist(playlistId: string, pageToken?: string): Promise<IItem[]> {
        let items: IItem[] = [];

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
            responseItems.forEach((item: IItem) => items.push(item));
        }
        youtubeResponse.items.forEach((item: IItem) => items.push(item));
        return items;
    }
    public async downloadMovies(items: IItem[]) : Promise<string[]> {
        const downloadService = container.resolve(
            DownloadService);
        let errors: any[] = [];
        let count = 0;
        let downloads : string[] = [];
        await Promise.all(items.map(async (item: IItem) => {
            try{
                downloads.push(await downloadService.execute(`${URL_YOUTUBE}?v=${item.contentDetails.videoId}`)); 
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
        console.log(`Músicas com erros - (${errors.length}/${items.length})`);
        console.log(`Taxa de acerto - (${Math.round(count*100/items.length)}%)`);
        console.log(`============================================`);
        
        if(errors.length)
            throw new AppError(`Download de ${count-errors.length} músicas com sucesso`,
                                400,
                                errors);
        return downloads;
    }
    private convertInObject(string:string) : IUrlYoutube {
        var pass = string.replace(/\,/g,':');
        var arr = pass.split(':');
        var object : IUrlYoutube = {};
        arr.forEach(function(el,i){
        var b = i + 1, c = b/2, e = c.toString();
            if(e.indexOf('.') != -1 ) {
                object[el] = arr[i+1];
        } 
        }); 
        return object;
    }
}
export default DownloadPlaylistService;

