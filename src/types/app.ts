// Application state and UI types

export interface AppState {
  currentData: FitData | null;
  isLoading: boolean;
  error: string | null;
  selectedLanguage: string;
  activeTab: string;
  comparisonData: FitData[];
  uploadedFiles: FileUpload[];
}

export interface TabConfig {
  id: string;
  label: string;
  icon: string;
  panel: string;
  enabled: boolean;
}

export interface SummaryCard {
  label: string;
  value: string;
  unit?: string;
  icon: string;
  tooltip: string;
  enabled: boolean;
}

export interface DataSection {
  id: string;
  title: string;
  data: Record<string, any>;
  expanded: boolean;
  type: 'table' | 'chart' | 'json';
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'scatter' | 'polar';
  title: string;
  data: ChartData;
  options: ChartOptions;
}

export interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  plugins: {
    legend: boolean;
    tooltip: boolean;
    title: boolean;
  };
  scales?: {
    x?: ScaleConfig;
    y?: ScaleConfig;
  };
}

export interface ScaleConfig {
  type: 'linear' | 'category' | 'time';
  title: string;
  min?: number;
  max?: number;
  grid: boolean;
}

// Language and localization types
export interface Language {
  code: string;
  name: string;
  flag: string;
}

export interface TranslationKeys {
  // Header
  appTitle: string;
  appSubtitle: string;
  
  // Upload
  dropFileHere: string;
  orClickToBrowse: string;
  uploadAnotherFile: string;
  
  // Loading and errors
  parsingFile: string;
  pleaseUploadFitFile: string;
  errorParsingFile: string;
  
  // Tabs
  overview: string;
  hrvAnalysis: string;
  rawJson: string;
  
  // Metrics
  duration: string;
  distance: string;
  calories: string;
  avgHeartRate: string;
  maxHeartRate: string;
  minHeartRate: string;
  avgPace: string;
  avgSpeed: string;
  maxSpeed: string;
  avgCadence: string;
  maxCadence: string;
  avgPower: string;
  maxPower: string;
  elevationGain: string;
  avgRespiration: string;
  hrvRecords: string;
  
  // Units
  kilometers: string;
  calories: string;
  beatsPerMinute: string;
  minutesPerKilometer: string;
  stepsPerMinute: string;
  watts: string;
  meters: string;
  breathsPerMinute: string;
  celsius: string;
  
  // Messages
  noDataAvailable: string;
  noHrvDataAvailable: string;
  showingFirstNOfM: string;
  
  // Tooltips (will be extensive)
  [key: string]: string;
}