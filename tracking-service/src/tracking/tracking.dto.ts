export class PackageCreatedEvent {
  barcode: string;
  sender: string;
  receiver: string;
  status: string;
  createdAt: Date;
}

export class PackageDeliveredEvent {
  barcode: string;
  status: string;
  deliveredAt: Date;
}

export class TrackingDto {
  barcode: string;
  currentStatus: string;
  updatedAt: Date;
}
