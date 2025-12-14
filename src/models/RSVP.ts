import mongoose, { Schema, Document } from 'mongoose';

export interface IRSVP extends Document {
  weddingId: mongoose.Types.ObjectId;
  guestName: string;
  email?: string;
  phone?: string;
  attending: boolean;
  numberOfGuests: number;
  message?: string;
  createdAt: Date;
}

const RSVPSchema: Schema = new Schema(
  {
    weddingId: { type: Schema.Types.ObjectId, ref: 'Wedding', required: true },
    guestName: { type: String, required: true },
    email: String,
    phone: String,
    attending: { type: Boolean, required: true },
    numberOfGuests: { type: Number, default: 1 },
    message: String
  },
  { timestamps: true }
);

export default mongoose.model<IRSVP>('RSVP', RSVPSchema);
