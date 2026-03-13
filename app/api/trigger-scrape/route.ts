import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import dbConnect from '../../../lib/mongodb';
import { ScrapeRun } from '../../../models/ScrapeRun';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import pdfParse from 'pdf-parse';

async function parseS3Pdf(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch PDF from S3: ${response.statusText}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  const data = await pdfParse(buffer);
  return data.text;
}

// Helper to wrap the callback-based spawn block
function runScraper(scraperDir: string, filePath?: string): Promise<{code: number | null, logs: string}> {
  return new Promise((resolve) => {
    const args = ['scraper.py'];
    if (filePath) {
      args.push('--file', filePath);
    }

    const pythonProcess = spawn(process.env.PYTHON_EXECUTABLE || 'py', args, {
      cwd: scraperDir,
    });

    let logs = '';


    pythonProcess.stdout.on('data', (data) => {
      logs += data.toString();
      process.stdout.write(data.toString());
    });

    pythonProcess.stderr.on('data', (data) => {
      logs += data.toString();
      process.stderr.write(data.toString());
    });

    pythonProcess.on('close', (code) => {
      resolve({ code, logs });
    });
  });
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { filePath, category, customFileName } = await req.json().catch(() => ({}));

    const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL;

    if (filePath) {
      // MANUAL PDF PROCESSING (S3-based, works on Vercel)
      console.log(`Processing manual S3 upload: ${filePath}`);
      const extractedText = await parseS3Pdf(filePath);
      
      const fileName = path.basename(filePath);
      const jsonData = [{
        url: filePath,
        page_title: fileName,
        heading: category || "Manual PDF Document",
        main_content: [extractedText],
        pdf_content: { [fileName]: extractedText }
      }];

      await dbConnect();
      const newRun = await ScrapeRun.create({
        departmentTriggeredBy: session.user.departments?.[0] || session.user.role,
        category: category || 'Manual Upload',
        heading: category || "Manual PDF Document",
        s3Url: filePath,
        scrapedData: jsonData,
        runDate: new Date(),
        uploadedBy: session.user.email,
        fileName: customFileName || path.basename(filePath),
      });

      return NextResponse.json({ 
        message: 'Manual PDF processed and stored in DB successfully', 
        run: newRun 
      });
    }

    // FULL WEB SCRAPE (Requires local Python environment)
    if (isVercel) {
      return NextResponse.json({ 
        error: 'Full Web Scrape is not available on Vercel. Please use Manual PDF Upload.' 
      }, { status: 400 });
    }

    const scraperDir = path.join(process.cwd(), '..', 'kiet-scraper');
    const scraperScript = path.join(scraperDir, 'scraper.py');

    try {
      await fs.access(scraperScript);
    } catch {
      return NextResponse.json({ error: 'Scraper script not found at expected location' }, { status: 500 });
    }

    console.log(`Starting scrape using python script: ${scraperScript}`);

    const { code, logs } = await runScraper(scraperDir);
    console.log(`Python scraper finished with code ${code}`);

    if (code !== 0) {
      return NextResponse.json({ error: 'Scraper script failed', logs }, { status: 500 });
    }

    try {
      // Scrape succeeded, read the main JSON
      const jsonPath = path.join(scraperDir, 'kiet_university_data.json');
      const jsonDataRaw = await fs.readFile(jsonPath, 'utf-8');
      const jsonData = JSON.parse(jsonDataRaw);

      // Extract heading if available
      let heading = 'Automated Scrape';
      if (Array.isArray(jsonData) && jsonData.length > 0 && jsonData[0].heading) {
        heading = jsonData[0].heading;
      }

      await dbConnect();

      // Create the history run document
      const newRun = await ScrapeRun.create({
        departmentTriggeredBy: session.user.departments?.[0] || session.user.role,
        category: category || 'Automated Scrape',
        heading: heading,
        scrapedData: jsonData,
        runDate: new Date(),
        uploadedBy: session.user.email,
      });

      return NextResponse.json({ 
        message: 'Scrape completed and data stored in DB successfully', 
        run: newRun 
      });

    } catch (postError: any) {
      console.error('Failed to store scrape results in DB:', postError);
      return NextResponse.json({ error: 'Failed to store outputs in DB', details: postError.message }, { status: 500 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const history = await ScrapeRun.find({}).sort({ runDate: -1 });

    return NextResponse.json(history);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
