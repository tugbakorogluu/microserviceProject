export class PackageDeliveredEvent {
  barcode: string;
  status: string;
  deliveredAt: Date;
}

export class NotificationDto {
  barcode: string;
  messageContent: string;
  sentAt: Date;
  deliveryStatus: string;
}
