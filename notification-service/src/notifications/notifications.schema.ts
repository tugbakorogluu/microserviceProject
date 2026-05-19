import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({
  collection: 'notifications',
  timestamps: true,
})
export class Notification {
  @Prop({
    type: String,
    required: true,
    index: true,
  })
  barcode: string;

  @Prop({
    type: String,
    required: true,
  })
  messageContent: string;

  @Prop({
    type: Date,
    default: Date.now,
  })
  sentAt: Date;

  @Prop({
    type: String,
    enum: ['Sent', 'Pending', 'Failed'],
    default: 'Sent',
  })
  deliveryStatus: string;

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

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Create index on barcode
NotificationSchema.index({ barcode: 1 });
// Create index on sentAt for efficient queries
NotificationSchema.index({ sentAt: 1 });
