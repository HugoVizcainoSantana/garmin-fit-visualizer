import { Decoder, Stream } from '@garmin/fitsdk';
import { FitData, ActivitySummary, HRVMetrics, RawFitData } from '@/types/fit';
import { formatDuration, formatDistance, formatPace, formatDate, average, min, max } from '@/utils/formatters';

/**
 * Parse a FIT file using the official Garmin FIT SDK
 * This extracts ALL data from the file including respiration, HRV, etc.
 * @param arrayBuffer - The FIT file as an ArrayBuffer
 * @returns Complete parsed FIT data
 */
export async function parseFitFile(arrayBuffer: ArrayBuffer): Promise<FitData> {
  const stream = Stream.fromArrayBuffer(arrayBuffer);
  const decoder = new Decoder(stream);

  if (!decoder.isFIT()) {
    throw new Error('Not a valid FIT file');
  }

  if (!decoder.checkIntegrity()) {
    console.warn('FIT file integrity check failed, attempting to parse anyway...');
  }

  const { messages, errors } = decoder.read();

  if (errors.length > 0) {
    console.warn('FIT parsing warnings:', errors);
  }

  return processMessages(messages);
}

/**
 * Process decoded FIT messages into organized structure
 * @param messages - All decoded messages from FIT file
 * @returns Organized data structure
 */
function processMessages(messages: any): FitData {
  // The SDK returns messages grouped by type
  const raw: RawFitData = {
    fileId: messages.fileIdMesgs || [],
    activity: messages.activityMesgs || [],
    session: messages.sessionMesgs || [],
    lap: messages.lapMesgs || [],
    record: messages.recordMesgs || [],
    event: messages.eventMesgs || [],
    hrv: messages.hrvMesgs || [],
    hrvStatusSummary: messages.hrvStatusSummaryMesgs || [],
    hrvValue: messages.hrvValueMesgs || [],
    respirationRate: messages.respirationRateMesgs || [],
    stressLevel: messages.stressLevelMesgs || [],
    deviceInfo: messages.deviceInfoMesgs || [],
    userProfile: messages.userProfileMesgs || [],
    trainingZones: messages.trainingZonesMesgs || [],
    workout: messages.workoutMesgs || [],
    workoutStep: messages.workoutStepMesgs || [],
    lengths: messages.lengthsMesgs || [],
    splits: messages.splitsMesgs || [],
    splitSummary: messages.splitSummaryMesgs || [],
    monitoring: messages.monitoringMesgs || [],
    gpsMetadata: messages.gpsMetadataMesgs || [],
    climbPro: messages.climbProMesgs || [],
    set: messages.setMesgs || [],
    jump: messages.jumpMesgs || []
  };

  const summary = extractSummary(raw);
  const availableDataTypes = getAvailableDataTypes(raw);

  return {
    summary,
    availableDataTypes,
    raw
  };
}

/**
 * Extract summary metrics from FIT data
 * @param raw - Raw FIT data
 * @returns Activity summary
 */
function extractSummary(raw: RawFitData): ActivitySummary {
  const summary: ActivitySummary = {};

  // Get session data (most comprehensive)
  if (raw.session && raw.session.length > 0) {
    const session = raw.session[0];
    
    // Basic activity info
    summary.sport = session.sport;
    summary.subSport = session.subSport;
    summary.startTime = session.startTime ? new Date(session.startTime * 1000) : undefined;
    summary.totalElapsedTime = session.totalElapsedTime;
    summary.totalTimerTime = session.totalTimerTime; // Moving time
    
    // Distance and calories
    summary.totalDistance = session.totalDistance;
    summary.totalCalories = session.totalCalories;
    
    // Heart rate metrics
    summary.avgHeartRate = session.avgHeartRate;
    summary.maxHeartRate = session.maxHeartRate;
    
    // Speed and pace
    summary.avgSpeed = session.avgSpeed;
    summary.maxSpeed = session.maxSpeed;
    
    // Cadence metrics
    summary.avgCadence = session.avgCadence;
    summary.maxCadence = session.maxCadence;
    
    // Power metrics (cycling)
    summary.avgPower = session.avgPower;
    summary.maxPower = session.maxPower;
    summary.normalizedPower = session.normalizedPower;
    summary.trainingStressScore = session.trainingStressScore;
    summary.intensityFactor = session.intensityFactor;
    
    // Elevation metrics
    summary.totalAscent = session.totalAscent;
    summary.totalDescent = session.totalDescent;
    summary.avgAltitude = session.avgAltitude;
    
    // Training effect
    summary.totalTrainingEffect = session.totalTrainingEffect;
    summary.totalAnaerobicEffect = session.totalAnaerobicEffect;
  }

  // Calculate averages from record data if not available in session
  if (raw.record && raw.record.length > 0) {
    const records = raw.record;
    
    // Heart rate from records
    if (!summary.avgHeartRate) {
      const heartRates = records.map(r => r.heartRate).filter(hr => hr !== undefined && hr !== null);
      if (heartRates.length > 0) {
        summary.avgHeartRate = Math.round(average(heartRates));
        summary.maxHeartRate = Math.round(max(heartRates));
        summary.minHeartRate = Math.round(min(heartRates));
      }
    }
    
    // Cadence from records
    if (!summary.avgCadence) {
      const cadences = records.map(r => r.cadence).filter(c => c !== undefined && c !== null);
      if (cadences.length > 0) {
        summary.avgCadence = Math.round(average(cadences));
        summary.maxCadence = Math.round(max(cadences));
      }
    }
    
    // Power from records
    if (!summary.avgPower) {
      const powers = records.map(r => r.power).filter(p => p !== undefined && p !== null);
      if (powers.length > 0) {
        summary.avgPower = Math.round(average(powers));
        summary.maxPower = Math.round(max(powers));
      }
    }
    
    // Speed from records
    if (!summary.avgSpeed) {
      const speeds = records.map(r => r.speed).filter(s => s !== undefined && s !== null);
      if (speeds.length > 0) {
        summary.avgSpeed = average(speeds);
        summary.maxSpeed = max(speeds);
      }
    }
    
    // Altitude from records
    if (!summary.avgAltitude) {
      const altitudes = records.map(r => r.altitude).filter(a => a !== undefined && a !== null);
      if (altitudes.length > 0) {
        summary.avgAltitude = average(altitudes);
      }
    }
    
    // Temperature from records
    const temperatures = records.map(r => r.temperature).filter(t => t !== undefined && t !== null);
    if (temperatures.length > 0) {
      summary.temperature = Math.round(average(temperatures));
    }
  }

  // Respiration rate data
  if (raw.respirationRate && raw.respirationRate.length > 0) {
    const respRates = raw.respirationRate.map(r => r.respirationRate).filter(r => r !== undefined && r !== null);
    if (respRates.length > 0) {
      summary.avgRespirationRate = Math.round(average(respRates));
      summary.maxRespirationRate = Math.round(max(respRates));
      summary.minRespirationRate = Math.round(min(respRates));
    }
  }

  // HRV analysis
  if (raw.hrvValue && raw.hrvValue.length > 0) {
    const hrvMetrics = calculateHRVMetrics(raw.hrvValue);
    summary.hrvRecords = raw.hrvValue.length;
    summary.rmssd = hrvMetrics.rmssd;
    summary.sdnn = hrvMetrics.sdnn;
    summary.pnn50 = hrvMetrics.pnn50;
    summary.meanNN = hrvMetrics.meanNN;
  }

  // Data counts
  summary.totalRecords = raw.record?.length || 0;
  summary.totalLaps = raw.lap?.length || 0;
  summary.totalSessions = raw.session?.length || 0;

  // Calculate derived metrics
  if (summary.avgSpeed && summary.avgSpeed > 0) {
    summary.avgPace = 1000 / (summary.avgSpeed * 60); // Convert to min/km
  }

  return summary;
}

/**
 * Calculate HRV metrics from RR intervals
 * @param hrvValues - HRV value messages from FIT file
 * @returns HRV metrics
 */
function calculateHRVMetrics(hrvValues: any[]): HRVMetrics {
  const rrIntervals: number[] = [];
  
  // Extract RR intervals from HRV data
  hrvValues.forEach(hrv => {
    if (hrv.time && hrv.time > 0) {
      rrIntervals.push(hrv.time);
    }
  });

  if (rrIntervals.length < 2) {
    return {
      rmssd: 0,
      sdnn: 0,
      pnn50: 0,
      meanNN: 0,
      rrIntervals: []
    };
  }

  // Calculate NN intervals (differences between successive RR intervals)
  const nnIntervals: number[] = [];
  for (let i = 1; i < rrIntervals.length; i++) {
    nnIntervals.push(Math.abs(rrIntervals[i] - rrIntervals[i - 1]));
  }

  // RMSSD: Root Mean Square of Successive Differences
  const sumSquares = nnIntervals.reduce((sum, nn) => sum + nn * nn, 0);
  const rmssd = Math.sqrt(sumSquares / nnIntervals.length);

  // SDNN: Standard Deviation of NN intervals
  const meanNN = average(rrIntervals);
  const variance = rrIntervals.reduce((sum, rr) => sum + Math.pow(rr - meanNN, 2), 0) / rrIntervals.length;
  const sdnn = Math.sqrt(variance);

  // pNN50: Percentage of successive RR intervals differing by >50ms
  const nn50 = nnIntervals.filter(nn => nn > 50).length;
  const pnn50 = (nn50 / nnIntervals.length) * 100;

  return {
    rmssd: Math.round(rmssd),
    sdnn: Math.round(sdnn),
    pnn50: Math.round(pnn50 * 10) / 10, // One decimal place
    meanNN: Math.round(meanNN),
    rrIntervals
  };
}

/**
 * Get list of available data types from FIT data
 * @param raw - Raw FIT data
 * @returns Array of available data type names
 */
function getAvailableDataTypes(raw: RawFitData): string[] {
  const dataTypes: string[] = [];
  
  // Check each data type and add if it has data
  const typeMap: { [key: string]: any[] } = {
    sessions: raw.session,
    laps: raw.lap,
    records: raw.record,
    events: raw.event,
    hrv: raw.hrv,
    hrvValue: raw.hrvValue,
    hrvStatusSummary: raw.hrvStatusSummary,
    respirationRate: raw.respirationRate,
    stressLevel: raw.stressLevel,
    deviceInfo: raw.deviceInfo,
    userProfile: raw.userProfile,
    trainingZones: raw.trainingZones,
    workout: raw.workout,
    workoutStep: raw.workoutStep,
    lengths: raw.lengths,
    splits: raw.splits,
    splitSummary: raw.splitSummary,
    monitoring: raw.monitoring,
    gpsMetadata: raw.gpsMetadata,
    climbPro: raw.climbPro,
    set: raw.set,
    jump: raw.jump
  };

  Object.entries(typeMap).forEach(([type, data]) => {
    if (data && data.length > 0) {
      dataTypes.push(type);
    }
  });

  return dataTypes;
}

// Export formatting functions for use in components
export { formatDuration, formatDistance, formatPace, formatDate };