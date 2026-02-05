// Application constants and configuration

export const APP_CONFIG = {
  name: 'Garmin FIT Viewer',
  version: '2.0.0',
  maxFileSize: 50 * 1024 * 1024, // 50MB
  supportedFileTypes: ['.fit'],
  defaultLanguage: 'en',
  availableLanguages: ['en', 'es'],
  maxRecordsToDisplay: 1000,
  chartAnimationDuration: 1000,
  debounceDelay: 300
} as const;

// Chart configuration
export const CHART_CONFIG = {
  default: {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: APP_CONFIG.chartAnimationDuration
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#ffffff',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#00d4ff',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          borderColor: 'rgba(255, 255, 255, 0.2)'
        },
        ticks: {
          color: '#ffffff'
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          borderColor: 'rgba(255, 255, 255, 0.2)'
        },
        ticks: {
          color: '#ffffff'
        }
      }
    }
  },
  timeSeries: {
    type: 'line',
    elements: {
      point: {
        radius: 2,
        hoverRadius: 4
      },
      line: {
        tension: 0.4
      }
    }
  },
  scatter: {
    type: 'scatter',
    elements: {
      point: {
        radius: 3,
        hoverRadius: 5
      }
    }
  }
} as const;

// Icon mappings
export const ICONS = {
  // Activity metrics
  clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  route: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
  fire: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z',
  heart: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  speed: 'M13 10V3L4 14h7v7l9-11h-7z',
  power: 'M11.584 2.376a.75.75 0 01.832 0l6 4a.75.75 0 010 1.248l-6 4a.75.75 0 01-.832 0l-6-4a.75.75 0 010-1.248l6-4z',
  elevation: 'M12 2C8 2 4 6 4 10s2 6 2 6l6 8 6-8s2-2 2-6-4-8-8-8z',
  cadence: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  respiration: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z',
  temperature: 'M9 2a1 1 0 000 2h2a1 1 0 100-2H9z',
  training: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  hrv: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  
  // UI icons
  upload: 'M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5',
  reset: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  close: 'M6 18L18 6M6 6l12 12',
  expand: 'M19 9l-7 7-7-7',
  collapse: 'M9 5l7 7-7 7',
  check: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  
  // Language icons
  globe: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9'
} as const;

// Sport type mappings
export const SPORT_TYPES = {
  running: 'Running',
  cycling: 'Cycling',
  swimming: 'Swimming',
  triathlon: 'Triathlon',
  hiking: 'Hiking',
  walking: 'Walking',
  fitness_equipment: 'Fitness Equipment',
  other: 'Other'
} as const;

// Data type configurations
export const DATA_TYPE_CONFIG = {
  sessions: {
    label: 'Sessions',
    icon: 'clock',
    priority: 1
  },
  laps: {
    label: 'Laps',
    icon: 'route',
    priority: 2
  },
  records: {
    label: 'Records',
    icon: 'speed',
    priority: 3
  },
  events: {
    label: 'Events',
    icon: 'info',
    priority: 4
  },
  hrv: {
    label: 'HRV Data',
    icon: 'hrv',
    priority: 5
  },
  hrvValue: {
    label: 'HRV Values',
    icon: 'heart',
    priority: 6
  },
  respirationRate: {
    label: 'Respiration Rate',
    icon: 'respiration',
    priority: 7
  },
  stressLevel: {
    label: 'Stress Level',
    icon: 'warning',
    priority: 8
  },
  deviceInfo: {
    label: 'Device Info',
    icon: 'info',
    priority: 9
  },
  monitoring: {
    label: 'Monitoring',
    icon: 'heart',
    priority: 10
  }
} as const;

// Tooltip content (will be moved to i18n)
export const TOOLTIP_CONTENT = {
  duration: 'Total elapsed time of the activity, including pauses and stops.',
  distance: 'Total distance covered during the activity, measured by GPS or sensor.',
  calories: 'Estimated total energy expenditure, calculated from heart rate, age, weight, and activity type.',
  avgHeartRate: 'Average heart rate during the activity, measured in beats per minute (bpm).',
  maxHeartRate: 'Highest heart rate recorded during the activity.',
  minHeartRate: 'Lowest heart rate recorded during the activity.',
  avgPace: 'Average pace calculated from speed. Lower values indicate faster movement.',
  avgSpeed: 'Average speed during moving time, excluding pauses.',
  maxSpeed: 'Maximum speed recorded during the activity.',
  avgCadence: 'Average steps/revolutions per minute. For running, this is step rate; for cycling, pedal RPM.',
  maxCadence: 'Maximum cadence recorded during the activity.',
  avgPower: 'Average power output measured in watts. Requires a power meter.',
  maxPower: 'Maximum power output recorded during the activity.',
  normalizedPower: 'Weighted average power that accounts for variability. Better represents physiological cost.',
  tss: 'Training Stress Score - quantifies training load based on intensity and duration.',
  intensityFactor: 'Ratio of Normalized Power to Functional Threshold Power (FTP).',
  elevation: 'Total vertical distance climbed during the activity.',
  totalAscent: 'Total elevation gained, measured by barometric altimeter or GPS.',
  totalDescent: 'Total elevation lost during the activity.',
  avgAltitude: 'Average altitude above sea level during the activity.',
  respiration: 'Average breathing rate in breaths per minute, measured by compatible sensors.',
  avgRespirationRate: 'Average respiration rate during the activity.',
  maxRespirationRate: 'Maximum breathing rate recorded.',
  minRespirationRate: 'Minimum breathing rate recorded.',
  temperature: 'Ambient temperature recorded by the device sensor.',
  trainingEffect: 'Aerobic training effect on a 0-5 scale. Measures impact on cardio fitness.',
  anaerobicEffect: 'Anaerobic training effect on a 0-5 scale. Measures impact on high-intensity capacity.',
  hrv: 'Heart Rate Variability - variation in time between heartbeats. Indicates recovery and stress.',
  rmssd: 'Root Mean Square of Successive Differences. The primary measure of parasympathetic nervous activity (recovery). Higher is generally better.',
  sdnn: 'Standard Deviation of NN intervals. Reflects total variability (both sympathetic and parasympathetic). Higher generally indicates better fitness.',
  pnn50: 'Percentage of successive RR intervals differing by >50ms. Another measure of parasympathetic activity.',
  meanNN: 'Average time between heartbeats in milliseconds.',
  sport: 'The type of activity (running, cycling, swimming, etc.).',
  subSport: 'More specific activity type (trail running, mountain biking, etc.).',
  startTime: 'Timestamp when the activity was started.',
  elapsedTime: 'Total time from start to finish, including all pauses.',
  movingTime: 'Time spent actively moving, excluding pauses and stops.',
  laps: 'Number of lap markers in the activity, auto or manual.',
  records: 'Total number of data points recorded (typically one per second).'
} as const;