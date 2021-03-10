import axios from "axios";
import fs from 'fs';
import { container, injectable } from 'tsyringe';
import { stringify } from 'qs';
import axiosRetry from 'axios-retry';

import AppError from "../../../../shared/errors/AppError";
import NormalizeTitleService from "../utils/NormalizeTitleService";

interface IDownloadFormat {
    ftype: string,
    dlink: string,
    title: string,
    vid: number
}
interface IMovieDetail {
    title: string,
    kc: string,
    formatExt?: string,
    vid: string
}



@injectable()
class DownloadMovieService {
    private URL_API_YT1S = process.env.URL_API_YT1S || 'https://yt1s.com/api';
    private PATH_DOWNLOAD = process.env.PATH_DOWNLOAD;
    public constructor() {
        axiosRetry(axios, { retries: 3, retryDelay: (retryCount) => retryCount * 5 });
    }
    public async execute(urlMovie: string): Promise<string> {
        if (!urlMovie)
            throw new AppError('Informe a URL do vídeo!');

        let infoMovie = await this.getInfoMovie(urlMovie);
        if (!infoMovie.kc)
            throw new AppError('Não foi possível converter seu vídeo para o formato pedido.');

        let convert = await this.convert(infoMovie)
        if (!convert)
            throw new AppError('Não foi possível converter seu vídeo para o formato pedido.');

        return await this.downloadMp3(convert);
    }

    private async getInfoMovie(movieUrl: string, formatExt = 'mp3'): Promise<IMovieDetail> {
        let data = {
            q: movieUrl,
            vt: formatExt
        }
        let infoMovie = await axios.post(`${this.URL_API_YT1S}/ajaxSearch/index`, stringify(data), { headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' } })
            .then(response => {
                return response.data;
            }).catch(err => {
                console.error(err.response || err);
            });
        if (!infoMovie)
            throw new AppError('Não foi possível converter seu vídeo para o formato mp3.');

        return {
            title: infoMovie.title,
            kc: infoMovie.kc,
            vid: infoMovie.vid,
            formatExt: formatExt
        };
    }
    private async convert(movieDetail: IMovieDetail): Promise<IDownloadFormat> {
        let data = {
            vid: movieDetail.vid,
            k: movieDetail.kc
        }
        let convert = await axios.post(`${this.URL_API_YT1S}/ajaxConvert/convert`, stringify(data), { headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' } })
            .then(response => {
                return response.data;
            }).catch(err => {
                console.error(err.response || err);
            });
        return convert;
    }
    private async downloadMp3(downloadInfo: IDownloadFormat): Promise<string> {
        console.log(`Baixando a música ${downloadInfo.title}.`);

        let download = await axios.get(downloadInfo.dlink)
            .then((response) => {
                return response.data;
            }).catch(err => {
                console.error(err.response || err);
            });

        if (!download) {
            throw new AppError(`Não foi possível realizar o download do seu arquivo. - (${downloadInfo.title}.mp3)`);
        }
        console.log(`Salvando a música ${downloadInfo.title}.`);
        const normalizeTitle = container.resolve(
            NormalizeTitleService);
        let url = `${this.PATH_DOWNLOAD}/${normalizeTitle.execute(downloadInfo.title)}.${downloadInfo.ftype}`;
        await fs.writeFileSync(url, download);

        return url;
    }
}
export default DownloadMovieService;

