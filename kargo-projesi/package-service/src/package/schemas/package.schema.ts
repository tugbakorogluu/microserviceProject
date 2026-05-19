import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PackageDocument = Package & Document;

@Schema({ timestamps: true })
export class Package {
  @Prop({ unique: true })
  id: string;

  @Prop({ required: true })
  sender: string;

  @Prop({ required: true })
  receiver: string;

  @Prop({ required: true, default: 'Hazırlanıyor' })
  status: string; // "Hazırlanıyor", "Yolda", "Dağıtımda", "Teslim Edildi"
}

export const PackageSchema = SchemaFactory.createForClass(Package);

// Auto-generate 'KP-XXXX' id before saving
PackageSchema.pre('save', async function (next) {
  if (this.isNew) {
    // A simple unique ID generator: KP- + Random 4 digit number or timestamp part
    // For a real production app, we would use a more robust counter sequence from DB.
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    this.id = `KP-${randomNum}`;
  }
  next();
});
