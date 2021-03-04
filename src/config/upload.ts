import path from 'path';
import multer from 'multer';
import crypto from 'crypto';

const tmpFolder = path.resolve(__dirname, '..', '..', 'tmp');
const uploadFolder = path.resolve(__dirname, '..', '..', 'tmp', 'upload');

export default {
  tmpFolder: tmpFolder,
  uploadFolder: uploadFolder,
  storage: multer.diskStorage({
    destination: path.resolve(__dirname, '..','..', 'tmp'),
    filename(request, file, callback){
       const fileHash = crypto.randomBytes(10).toString('hex');
       const fileName = `${fileHash}-${file.originalname}`;
       return callback(null, fileName);
    }
  })
};
