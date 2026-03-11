import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs/promises';
import mime from 'mime-types';
import path from 'path';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export const uploadFileToS3 = async (filePath: string, s3KeyPath: string): Promise<string> => {
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  if (!bucketName) throw new Error('AWS_S3_BUCKET_NAME is not configured');

  const folder = process.env.AWS_S3_FOLDER;
  const fullS3KeyPath = folder ? `${folder}/${s3KeyPath}`.replace(/\/+/g, '/') : s3KeyPath;

  const fileBuffer = await fs.readFile(filePath);
  const contentType = mime.lookup(filePath) || 'application/octet-stream';

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fullS3KeyPath,
    Body: fileBuffer,
    ContentType: contentType,
  });

  await s3Client.send(command);

  // Return the public URL
  return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fullS3KeyPath}`;
};
