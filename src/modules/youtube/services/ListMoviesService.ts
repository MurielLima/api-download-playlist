import axios, { AxiosRequestConfig } from "axios";
import { container, injectable } from 'tsyringe';
import * as URI from 'uri-js';
import _ from 'lodash';

import AppError from "../../../shared/errors/AppError";

interface IUrlYoutube {
    [key: string]: string
}
interface IContentDetails {
    videoId: string
}
export interface IMovie {
    id: string,
    title: string;
    channelTitle: string;
    url: string;
    thumbnail: {
        url: string,
        width: number,
        height: number
    }
}
interface ISnnipet {
    title: string;
    channelTitle: string;
    thumbnails: {
        standard: {
            url: string,
            width: number,
            height: number
        },
        default: {
            url: string,
            width: number,
            height: number
        }
    }
}
interface IItem {
    contentDetails: IContentDetails;
    snippet: ISnnipet;
}
export interface IResponseYoutube {
    pageInfo: string;
    nextPageToken: string;
    items: IItem[];
}
const URL_YOUTUBE = process.env.URL_YOUTUBE || 'https://www.youtube.com/watch';
const URL_API_YOUTUBE = process.env.URL_API_YOUTUBE || 'https://content-youtube.googleapis.com/youtube/v3';
const API_KEY = process.env.API_KEY || 'AIzaSyCEIJEjX_4y5Duqh9gz8HPDjFHkWL1GH6I';
const MAX_RESULTS_API_YOUTUBE = process.env.MAX_RESULTS_API_YOUTUBE || 50;

@injectable()
class ListMoviesService {
    public constructor() {
    }
    public async execute(urlMovie: string): Promise<IMovie[]> {
        if (!urlMovie)
            throw new AppError('Informe a URL da playlist!');

        let urlParse = URI.parse(urlMovie);
        if (!urlParse.query)
            throw new AppError('Informe uma URL de playlist válida!');

        let playlist = urlParse.query.replace(/\&/g, ',').replace(/\=/g, ':');
        let playlistYoutube = this.convertInObject(playlist);

        if (!playlistYoutube['list'])
            throw new AppError('Informe uma URL que contenha o parâmetro "list".');

        let movies = await this.getMoviesInPlaylist(playlistYoutube['list']);
        if (!movies)
            throw new AppError('Não foram encontrados vídeos na sua playlist!');
        movies = _.uniqBy(movies, 'id');
        console.log(`A playlist contém ${movies.length} músicas.`);

        return movies;
    }
    public async getMoviesInPlaylist(playlistId: string, pageToken?: string): Promise<IMovie[]> {
        let items: IMovie[] = [];

        let config = {
            params: {
                key: API_KEY,
                maxResults: MAX_RESULTS_API_YOUTUBE,
                playlistId: playlistId,
                part: "contentDetails,snippet",
                pageToken: pageToken
            }
        }

        let youtubeResponse = await axios.get<IResponseYoutube>(`${URL_API_YOUTUBE}/playlistItems`, config)
            .then((response) => {
                return response.data;
            }).catch(err => {
                console.error(err.response);
            });

        if (!youtubeResponse)
            throw new AppError('Não foi possível obter os dados do Youtube Data - API');

        if (youtubeResponse.pageInfo) {
            pageToken = youtubeResponse.nextPageToken;
        }

        if (!!pageToken) {
            let responseItems = await this.getMoviesInPlaylist(playlistId, pageToken);
            responseItems.forEach((item: IMovie) => items
                .push({
                    channelTitle: item.channelTitle,
                    thumbnail: item.thumbnail,
                    title: item.title,
                    url: item.url,
                    id: item.id
                }));
        }
        youtubeResponse.items = youtubeResponse.items.filter(
            (item: IItem) => ["Deleted video", "Private video"].every(
                (text: string) => !item.snippet.title.includes(text)));

        youtubeResponse.items.forEach((item: IItem) =>
            items.push({
                channelTitle: item.snippet.channelTitle,
                thumbnail: {
                    url: item.snippet.thumbnails.standard?.url || item.snippet.thumbnails.default.url,
                    height: item.snippet.thumbnails.standard?.height || item.snippet.thumbnails.default.height,
                    width: item.snippet.thumbnails.standard?.width || item.snippet.thumbnails.default.width
                },
                title: item.snippet.title,
                url: `${URL_YOUTUBE}?v=${item.contentDetails.videoId}`,
                id: item.contentDetails.videoId
            })
        );

        return items;
    }
    private convertInObject(string: string): IUrlYoutube {
        var pass = string.replace(/\,/g, ':');
        var arr = pass.split(':');
        var object: IUrlYoutube = {};
        arr.forEach(function (el, i) {
            var b = i + 1, c = b / 2, e = c.toString();
            if (e.indexOf('.') != -1) {
                object[el] = arr[i + 1];
            }
        });
        return object;
    }
}
export default ListMoviesService;

