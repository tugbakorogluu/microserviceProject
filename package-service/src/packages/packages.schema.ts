import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PackageDocument = HydratedDocument<Package>;

@Schema({
  collection: 'packages',
  timestamps: true,
})
export class Package {
  @Prop({
    type: String,
    required: true,
    unique: true,
    index: true,
  })
  barcode: string;

  @Prop({
    type: String,
    required: true,
  })
  sender: string;

  @Prop({
    type: String,
    required: true,
  })
  receiver: string;

  @Prop({
    type: String,
    default: 'Hazırlanıyor',
  })
  status: string;

  @Prop({
    type: Date,
    default: Date.now,
  })
  createdAt: Date;

  @Prop({
    type: Date,
    default: Date.now,
  })
  updatedAt: Date;
}

export const PackageSchema = SchemaFactory.createForClass(Package);

// Create unique index on barcode
PackageSchema.index({ barcode: 1 }, { unique: true });
