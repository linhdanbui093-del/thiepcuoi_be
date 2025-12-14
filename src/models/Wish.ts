import mongoose, { Schema, Document } from 'mongoose';

export interface IWish extends Document {
  weddingId: mongoose.Types.ObjectId;
  guestName: string;
  message: string;
  createdAt: Date;
}

const WishSchema: Schema = new Schema(
  {
    weddingId: { type: Schema.Types.ObjectId, ref: 'Wedding', required: true },
    guestName: { type: String, required: true },
    message: { type: String, required: true }
  },
  { timestamps: true }
);

export default mongoose.model<IWish>('Wish', WishSchema);
