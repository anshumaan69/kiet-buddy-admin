import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IScrapeRun extends Document {
  runDate: Date;
  departmentTriggeredBy: string;
  category?: string;
  heading: string;
  s3Url?: string;
  scrapedData: any;
  uploadedBy?: string; // User email
  fileName?: string;
}

const ScrapeRunSchema: Schema<IScrapeRun> = new Schema(
  {
    runDate: { type: Date, required: true, default: Date.now },
    departmentTriggeredBy: { type: String, required: true },
    category: { type: String },
    heading: { type: String, required: true },
    s3Url: { type: String },
    scrapedData: { type: Schema.Types.Mixed, required: true },
    uploadedBy: { type: String },
    fileName: { type: String },
  },
  { timestamps: true }
);

export const ScrapeRun: Model<IScrapeRun> =
  mongoose.models.ScrapeRun || mongoose.model<IScrapeRun>('ScrapeRun', ScrapeRunSchema);
