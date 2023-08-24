import AWS from 'aws-sdk';
import dotenv from 'dotenv';
import S3 from 'aws-sdk/clients/s3';

dotenv.config();

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;
const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY;
const AWS_SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_REGION = 'us-east-1';

const s3 = new AWS.S3({
  accessKeyId: AWS_ACCESS_KEY,
  secretAccessKey: AWS_SECRET_KEY,
  region: AWS_REGION,
});

export { s3, S3_BUCKET_NAME };


