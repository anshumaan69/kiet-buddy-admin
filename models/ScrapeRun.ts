import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IScrapeRun extends Document {
  runDate: Date;
  departmentTriggeredBy: string;
  category?: string;
  heading: string;
  scrapedData: any;
}

const ScrapeRunSchema: Schema<IScrapeRun> = new Schema(
  {
    runDate: { type: Date, required: true, default: Date.now },
    departmentTriggeredBy: { type: String, required: true },
    category: { type: String },
    heading: { type: String, required: true },
    scrapedData: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

export const ScrapeRun: Model<IScrapeRun> =
  mongoose.models.ScrapeRun || mongoose.model<IScrapeRun>('ScrapeRun', ScrapeRunSchema);
