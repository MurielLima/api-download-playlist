import axios, { AxiosRequestConfig } from "axios";
import { container, injectable } from 'tsyringe';
import * as URI from 'uri-js';
import _ from 'lodash';

import AppError from "../../../shared/errors/AppError";
import DownloadService from './DownloadService';
import ListMoviesService from "./ListMoviesService";

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
    public async execute(urlPlaylist: string) : Promise<string[]> {
        const listMoviesService = container.resolve(
            ListMoviesService);
        let movies = await listMoviesService.execute(urlPlaylist);        
    
        return await this.downloadMovies(movies);
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
}
export default DownloadPlaylistService;

