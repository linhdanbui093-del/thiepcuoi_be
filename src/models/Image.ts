import mongoose, { Schema, Document } from 'mongoose';

export interface IImage extends Document {
  weddingId: mongoose.Types.ObjectId;
  filename: string;
  originalName: string;
  path: string;
  category: 'album' | 'groom' | 'bride' | 'couple' | 'qr-groom' | 'qr-bride' | 'story';
  order: number;
  createdAt: Date;
}

const ImageSchema: Schema = new Schema(
  {
    weddingId: { type: Schema.Types.ObjectId, ref: 'Wedding', required: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    path: { type: String, required: true },
    category: { type: String, enum: ['album', 'groom', 'bride', 'couple', 'qr-groom', 'qr-bride', 'story'], default: 'album' },
    order: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.model<IImage>('Image', ImageSchema);
