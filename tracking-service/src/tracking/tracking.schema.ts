import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TrackingDocument = HydratedDocument<Tracking>;

@Schema({
  collection: 'trackings',
  timestamps: true,
})
export class Tracking {
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
    enum: ['Hazırlanıyor', 'Yolda', 'Dağıtımda', 'Teslim Edildi'],
    default: 'Hazırlanıyor',
  })
  currentStatus: string;

  @Prop({
    type: String,
  })
  sender: string;

  @Prop({
    type: String,
  })
  receiver: string;

  @Prop({
    type: Date,
  })
  deliveredAt: Date;

  @Prop({
    type: Date,
    default: Date.now,
  })
  updatedAt: Date;

  @Prop({
    type: Date,
    default: Date.now,
  })
  createdAt: Date;

  @Prop({
    type: Boolean,
    default: false,
  })
  deliveryEventPublished: boolean;
}

export const TrackingSchema = SchemaFactory.createForClass(Tracking);

// Create index on barcode
TrackingSchema.index({ barcode: 1 }, { unique: true });
// Create index on currentStatus for efficient queries
TrackingSchema.index({ currentStatus: 1 });
