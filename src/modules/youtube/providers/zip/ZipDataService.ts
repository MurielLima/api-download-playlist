import { container, injectable } from 'tsyringe';
import {tar} from 'compressing';
import pump from 'pump';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

import AppError from "../../../../shared/errors/AppError";
@injectable()
class ZipDataService {
    private PATH_DOWNLOAD = process.env.PATH_DOWNLOAD;

    public constructor() {
    }
    public async execute(path: string[]): Promise<string> {
        if (!path)
            throw new AppError('Informe um path válido!');
        return await this.zip(path);
    }
    private async zip(path:string[]):Promise<string>{
        let pathZip:string = '';
        try{
            let zipper = new tar.Stream();
            path.map((file)=>{
                zipper.addEntry(file);
            })
            pathZip = `${this.PATH_DOWNLOAD}/${uuidv4()}_zipper.zip`;
            let destStream = fs.createWriteStream(pathZip);
            pump(zipper, destStream);
        }catch(err){
            console.error(err);
        }
        return pathZip;
    }

}
export default ZipDataService;

