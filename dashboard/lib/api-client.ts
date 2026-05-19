import axios, { AxiosInstance } from 'axios';

const PACKAGE_SERVICE_URL =
  process.env.NEXT_PUBLIC_PACKAGE_SERVICE_URL || 'http://localhost:3001';
const TRACKING_SERVICE_URL =
  process.env.NEXT_PUBLIC_TRACKING_SERVICE_URL || 'http://localhost:3002';
const NOTIFICATION_SERVICE_URL =
  process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL || 'http://localhost:3003';

export const packageServiceClient: AxiosInstance = axios.create({
  baseURL: PACKAGE_SERVICE_URL,
  timeout: 5000,
});

export const trackingServiceClient: AxiosInstance = axios.create({
  baseURL: TRACKING_SERVICE_URL,
  timeout: 5000,
});

export const notificationServiceClient: AxiosInstance = axios.create({
  baseURL: NOTIFICATION_SERVICE_URL,
  timeout: 5000,
});

// Package Service APIs
export const packageAPI = {
  createPackage: (sender: string, receiver: string) =>
    packageServiceClient.post('/packages', { sender, receiver }),
  getPackage: (barcode: string) => packageServiceClient.get(`/packages/${barcode}`),
  getAllPackages: () => packageServiceClient.get('/packages'),
  getHealth: () => packageServiceClient.get('/packages/health/check'),
};

// Tracking Service APIs
export const trackingAPI = {
  getTracking: (barcode: string) => trackingServiceClient.get(`/trackings/${barcode}`),
  getAllTrackings: () => trackingServiceClient.get('/trackings'),
  getTrackingsByStatus: (status: string) =>
    trackingServiceClient.get(`/trackings/status/${status}`),
  getHealth: () => trackingServiceClient.get('/trackings/health/check'),
};

// Notification Service APIs
export const notificationAPI = {
  getNotificationsByBarcode: (barcode: string) =>
    notificationServiceClient.get(`/notifications/barcode/${barcode}`),
  getAllNotifications: () => notificationServiceClient.get('/notifications'),
  getNotificationsByStatus: (status: string) =>
    notificationServiceClient.get(`/notifications/status/${status}`),
  getStatistics: () => notificationServiceClient.get('/notifications/stats/all'),
  getHealth: () => notificationServiceClient.get('/notifications/health/check'),
};
