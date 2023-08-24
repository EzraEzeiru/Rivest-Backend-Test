import multer from 'multer';
import { s3, S3_BUCKET_NAME } from './s3config';
import multerS3 from 'multer-s3';

const s3Storage = multerS3({
  s3: s3 as any, // Cast s3 to S3 type
  bucket: S3_BUCKET_NAME!,
  metadata: (req, file, cb) => {
    cb(null, { fieldName: file.fieldname });
  },
  key: (req, file, cb) => {
    cb(null, Date.now().toString());
  },
});

const upload = multer({ storage: s3Storage });

export default upload;
