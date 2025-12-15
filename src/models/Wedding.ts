import mongoose, { Schema, Document } from 'mongoose';

export interface IWedding extends Document {
  slug: string;
  groomName: string;
  brideName: string;
  groomFullName: string;
  brideFullName: string;
  weddingDate: Date;
  saveTheDateText: string;
  groomDescription: string;
  brideDescription: string;
  story?: {
    title: string;
    content: string;
    date?: string;
    image?: string;
  }[];
  events?: {
    title: string;
    time: string;
    date: string;
    location: string;
    address: string;
    mapLink?: string;
  }[];
  parents: {
    groom: {
      father: string;
      mother: string;
    };
    bride: {
      father: string;
      mother: string;
    };
  };
  closingMessage: string;
  bankAccounts?: {
    groom?: {
      bank: string;
      name: string;
      accountNumber: string;
    };
    bride?: {
      bank: string;
      name: string;
      accountNumber: string;
    };
  };
  musicUrl?: string;
  musicEnabled?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WeddingSchema: Schema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    groomName: { type: String, required: true },
    brideName: { type: String, required: true },
    groomFullName: { type: String, required: true },
    brideFullName: { type: String, required: true },
    weddingDate: { type: Date, required: true },
    saveTheDateText: { type: String, default: '' },
    groomDescription: { type: String, default: '' },
    brideDescription: { type: String, default: '' },
    story: {
      type: [{
        title: String,
        content: String,
        date: String,
        image: String
      }],
      default: []
    },
    events: {
      type: [{
        title: String,
        time: String,
        date: String,
        location: String,
        address: String,
        mapLink: String
      }],
      default: []
    },
    parents: {
      groom: {
        father: String,
        mother: String
      },
      bride: {
        father: String,
        mother: String
      }
    },
    closingMessage: { type: String, default: '' },
    bankAccounts: {
      groom: {
        bank: String,
        name: String,
        accountNumber: String
      },
      bride: {
        bank: String,
        name: String,
        accountNumber: String
      }
    },
    musicUrl: { type: String, default: '' },
    musicEnabled: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model<IWedding>('Wedding', WeddingSchema);
