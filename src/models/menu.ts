import mongoose, { Schema, Document, Types } from "mongoose";

export interface IMenu extends Document {
  _id: Types.ObjectId;
  title: string;
  path: string;
  icon: string;
  roles: string[];
  status: boolean;
  createdAt: Date;
  order: number;
}

export const MenuSchema = new Schema<IMenu>({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  path: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  icon: {
    type: String,
    required: true,
    trim: true,
  },
  roles: {
    type: [String],
    required: true,
    default: [],
  },
  status: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  order: {
    type: Number,
    default: 0,
  },
});

// Exportar schema para usar en connections.ts
// El modelo se creará en connections.ts con la conexión específica
