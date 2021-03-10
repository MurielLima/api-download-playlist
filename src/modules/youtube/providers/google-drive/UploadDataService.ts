import axios from "axios";
import fs from 'fs';
import { container, injectable } from 'tsyringe';
import * as URI from 'uri-js';
import axiosRetry from 'axios-retry';

import AppError from "../../../../shared/errors/AppError";
import NormalizeTitleService from "../../services/utils/NormalizeTitleService";

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

const URL_API_YT1S = process.env.URL_API_YT1S || 'https://yt1s.com/api';
@injectable()
class DownloadMovieService {
    public constructor() {
        axiosRetry(axios, { retries: 3, retryDelay: (retryCount) => retryCount * 5 });
    }
    public async execute(urlMovie: string): Promise<void> {
        if (!urlMovie)
            throw new AppError('Informe a URL do vídeo!');

        let infoMovie = await this.getInfoMovie(urlMovie);
        if (!infoMovie.kc)
            throw new AppError('Não foi possível converter seu vídeo para o formato pedido.');

        let convert = await this.convert(infoMovie)
        if (!convert)
            throw new AppError('Não foi possível converter seu vídeo para o formato pedido.');
        await this.downloadMp3(convert);
    }

    private async getInfoMovie(movieUrl: string, formatExt = 'mp3'): Promise<IMovieDetail> {
        let data = {
            q: movieUrl,
            vt: formatExt
        }
        let infoMovie = await axios.post(`${URL_API_YT1S}/ajaxSearch/index`, JSON.stringify(data), { headers: { 'Content-Type': 'application/x-www-form-urlencoded;' } })
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
        let convert = await axios.post(`${URL_API_YT1S}/ajaxConvert/convert`, JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } })
            .then(response => {
                return response.data.downloadUrl;
            }).catch(err => {
                console.error(err.response || err);
            });
        return convert;
    }
    private async downloadMp3(downloadInfo: IDownloadFormat): Promise<void> {
        let download = await axios.get(downloadInfo.dlink, { responseType: "arraybuffer" })
            .then((response) => {
                return response.data;
            }).catch(err => {
                console.error(err.response || err);
            });

        if (!download) {
            throw new AppError(`Não foi possível realizar o download do seu arquivo. - (${downloadInfo.title}.mp3)`);
        }
        const normalizeTitle = container.resolve(
            NormalizeTitleService);
        fs.writeFileSync(`C:/Data/mp3/${normalizeTitle.execute(downloadInfo.title)}.mp3`, download);

        console.log(`Salvando a música ${downloadInfo.title}.`);
    }
}
export default DownloadMovieService;

