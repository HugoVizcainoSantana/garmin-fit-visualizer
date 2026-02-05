// FIT file data types based on Garmin FIT SDK

export interface FitData {
  summary: ActivitySummary;
  availableDataTypes: string[];
  raw: RawFitData;
}

export interface ActivitySummary {
  // Basic activity info
  sport?: string;
  subSport?: string;
  startTime?: Date;
  totalElapsedTime?: number;
  movingTime?: number;
  
  // Distance and calories
  totalDistance?: number;
  totalCalories?: number;
  
  // Heart rate metrics
  avgHeartRate?: number;
  maxHeartRate?: number;
  minHeartRate?: number;
  
  // Speed and pace
  avgSpeed?: number;
  maxSpeed?: number;
  avgPace?: number;
  
  // Cadence metrics
  avgCadence?: number;
  maxCadence?: number;
  
  // Power metrics (cycling)
  avgPower?: number;
  maxPower?: number;
  normalizedPower?: number;
  tss?: number;
  intensityFactor?: number;
  
  // Elevation metrics
  totalAscent?: number;
  totalDescent?: number;
  avgAltitude?: number;
  
  // Respiration metrics
  avgRespirationRate?: number;
  maxRespirationRate?: number;
  minRespirationRate?: number;
  
  // Other metrics
  temperature?: number;
  trainingEffect?: number;
  anaerobicEffect?: number;
  
  // Data counts
  totalRecords?: number;
  totalLaps?: number;
  totalSessions?: number;
  
  // HRV metrics
  hrvRecords?: number;
  rmssd?: number;
  sdnn?: number;
  pnn50?: number;
  meanNN?: number;
}

export interface RawFitData {
  fileId: any[];
  activity: any[];
  session: any[];
  lap: any[];
  record: any[];
  event: any[];
  hrv: any[];
  hrvStatusSummary: any[];
  hrvValue: any[];
  respirationRate: any[];
  stressLevel: any[];
  deviceInfo: any[];
  userProfile: any[];
  trainingZones: any[];
  workout: any[];
  workoutStep: any[];
  lengths: any[];
  splits: any[];
  splitSummary: any[];
  monitoring: any[];
  gpsMetadata: any[];
  climbPro: any[];
  set: any[];
  jump: any[];
}

export interface HRVMetrics {
  rmssd: number;
  sdnn: number;
  pnn50: number;
  meanNN: number;
  rrIntervals: number[];
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  borderColor?: string;
  backgroundColor?: string;
  fill?: boolean;
  tension?: number;
}

// UI Component types
export interface ComponentProps {
  [key: string]: any;
}

export interface StateAction {
  type: string;
  payload?: any;
}

// File upload types
export interface FileUpload {
  file: File;
  name: string;
  size: number;
  type: string;
}