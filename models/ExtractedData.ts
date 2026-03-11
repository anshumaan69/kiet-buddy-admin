import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IExtractedData extends Document {
  department: string;
  category: string;
  key: string;
  value: string;
}

const ExtractedDataSchema: Schema<IExtractedData> = new Schema(
  {
    department: { type: String, required: true, index: true },
    category: { type: String, required: true },
    key: { type: String, required: true },
    value: { type: String, required: true },
  },
  { timestamps: true }
);

export const ExtractedData: Model<IExtractedData> =
  mongoose.models.ExtractedData || mongoose.model<IExtractedData>('ExtractedData', ExtractedDataSchema);
