import axios from "axios";
import fs from 'fs';
import { container, injectable } from 'tsyringe';
import * as URI from 'uri-js';
import axiosRetry from 'axios-retry';

import AppError from "../../../../shared/errors/AppError";
import NormalizeTitleService from "../utils/NormalizeTitleService";

interface IDownloadFormat {
    formatExt: string,
    formatAlias: string,
    partList: any[],
    tag: number
}
interface IMovieDetail {
    title: string,
    urlMp3: string,
    formatExt?: string,
    formatAlias?: string,
    tag: number,
    metaKey: string,
    thumbnail?: string,
    downloadInfoList: IDownloadFormat[],
}
interface IMovie {
    videoInfo: IMovieDetail
}

@injectable()
class DownloadMovieService {
    private URL_API_SNAPPEA = process.env.URL_API_SNAPPEA || 'https://api.snappea.com/v1/video';
    private PATH_DOWNLOAD = process.env.PATH_DOWNLOAD;
    public constructor() {
        axiosRetry(axios, { retries: 3, retryDelay: (retryCount) => retryCount * 5 });
    }
    public async execute(urlMovie: string): Promise<string> {
        if (!urlMovie)
            throw new AppError('Informe a URL do vídeo!');

        let movie = await this.searchMovie(urlMovie);
        if (!movie)
            throw new AppError('Não foi possível encontrar seu vídeo para a conversão.');

        let infoMovie = await this.getInfoMovie(movie);
        if (!infoMovie)
            throw new AppError('Não foi possível converter seu vídeo para o formato pedido.');

        let convert = await this.convert(infoMovie)
        if (!convert)
            throw new AppError('Não foi possível converter seu vídeo para o formato pedido.');

        return await this.downloadMp3(convert, infoMovie);
    }
    private async searchMovie(urlMovie: string): Promise<IMovie> {
        let config = {
            params: {
                url: urlMovie
            }
        }
        let movie = await axios.get(`${this.URL_API_SNAPPEA}/details`, config)
            .then((response) => {
                return response.data;
            }).catch(err => {
                console.error(err.response || err);
            });

        return movie;
    }
    private async getInfoMovie(movie: IMovie, formatExt = 'mp3'): Promise<IMovieDetail> {
        let movieDetail = movie.videoInfo;
        if (!movieDetail)
            throw new AppError('Não foi possível encontrar os dados do seu vídeo.');
        let movies = await movieDetail.downloadInfoList.filter((movie: IDownloadFormat) => {
            if (movie.formatExt === formatExt)
                return movie;
        });
        if (!movies)
            throw new AppError(`Não foi possível converter seu vídeo para o formato ${formatExt}.`);
        movies = movies.sort((a, b) => {

            if (parseInt(a.formatAlias) < parseInt(b.formatAlias))
                return 1;
            if (parseInt(a.formatAlias) > parseInt(b.formatAlias))
                return -1;
            return 0;
        });
        if (!movies[0])
            throw new AppError('Não foi possível encontrar os dados do seu vídeo.');
        return {
            title: movieDetail.title,
            urlMp3: movies[0].partList[0].urlList[0],
            tag: movies[0].tag,
            metaKey: movieDetail.metaKey,
            downloadInfoList: movies,
            formatExt
        };
    }
    private async convert(movieDetail: IMovieDetail): Promise<string> {
        let data = {
            tagId: movieDetail.tag,
            url: movieDetail.urlMp3
        }
        let convert = await axios.post(`${this.URL_API_SNAPPEA}/convert?videoKey=${movieDetail.metaKey}`, JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } })
            .then(response => {
                return response.data.downloadUrl;
            }).catch(err => {
                console.error(err.response || err);
            });
        return URI.serialize(URI.parse(convert));
    }
    private async downloadMp3(urlDownload: string, movieDetail: IMovieDetail): Promise<string> {
        console.log(`Baixando a música ${movieDetail.title}.`);
        let download = await axios.get(urlDownload, { responseType: "arraybuffer" })
            .then((response) => {
                return response.data;
            }).catch(err => {
                console.error(err.response || err);
            });
        if (!download) {
            throw new AppError(`Não foi possível realizar o download do seu arquivo. - (${movieDetail.title}.mp3)`);
        }
        console.log(`Salvando a música ${movieDetail.title}.`);
        const normalizeTitle = container.resolve(
            NormalizeTitleService);
        let url = `${this.PATH_DOWNLOAD}/${normalizeTitle.execute(movieDetail.title)}.${movieDetail.formatExt}`;
        fs.writeFileSync(url, download);

        return url;
    }
}
export default DownloadMovieService;

