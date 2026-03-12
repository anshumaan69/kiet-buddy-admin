import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import dbConnect from '../../../lib/mongodb';
import { uploadBufferToS3 } from '../../../lib/s3';
import { ExtractedData } from '../../../models/ExtractedData';
import pdfParse from 'pdf-parse';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Only Department Admins can upload data.' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as Blob;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Upload to S3 instead of local filesystem
    const fileName = `${Date.now()}-${(file as any).name || 'uploaded-file.pdf'}`;
    const s3Path = `uploads/${fileName}`;
    
    const s3Url = await uploadBufferToS3(buffer, s3Path, file.type || 'application/pdf');

    return NextResponse.json({ 
      message: 'File uploaded successfully to S3', 
      filePath: s3Url 
    });

  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Failed to upload PDF file' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return NextResponse.json({ message: 'GET method not used for uploads' }, { status: 405 });
}
