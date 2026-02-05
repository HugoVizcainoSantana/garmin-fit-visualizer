import { Decoder, Stream } from '@garmin/fitsdk';

/**
 * Parse a FIT file using the official Garmin FIT SDK
 * This extracts ALL data from the file including respiration, HRV, etc.
 * @param {ArrayBuffer} arrayBuffer - The FIT file as an ArrayBuffer
 * @returns {Promise<Object>} - Complete parsed FIT data
 */
export async function parseFitFile(arrayBuffer) {
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
 * @param {Object} messages - All decoded messages from FIT file
 * @returns {Object} - Organized data structure
 */
function processMessages(messages) {
    // The SDK returns messages grouped by type
    const result = {
        // Activity data
        fileId: messages.fileIdMesgs || [],
        activity: messages.activityMesgs || [],
        session: messages.sessionMesgs || [],
        lap: messages.lapMesgs || [],
        record: messages.recordMesgs || [],
        event: messages.eventMesgs || [],

        // Health metrics
        hrv: messages.hrvMesgs || [],
        hrvStatusSummary: messages.hrvStatusSummaryMesgs || [],
        hrvValue: messages.hrvValueMesgs || [],
        respirationRate: messages.respirationRateMesgs || [],
        stressLevel: messages.stressLevelMesgs || [],

        // Device info
        deviceInfo: messages.deviceInfoMesgs || [],
        deviceSettings: messages.deviceSettingsMesgs || [],
        userProfile: messages.userProfileMesgs || [],

        // Sport/workout
        sport: messages.sportMesgs || [],
        workout: messages.workoutMesgs || [],
        workoutStep: messages.workoutStepMesgs || [],

        // Training
        trainingFile: messages.trainingFileMesgs || [],
        zonesTarget: messages.zonesTargetMesgs || [],

        // GPS/Courses
        gpsMetadata: messages.gpsMetadataMesgs || [],
        course: messages.courseMesgs || [],
        coursePoint: messages.coursePointMesgs || [],

        // Monitoring
        monitoring: messages.monitoringMesgs || [],
        monitoringInfo: messages.monitoringInfoMesgs || [],

        // Other
        length: messages.lengthMesgs || [],
        split: messages.splitMesgs || [],
        splitSummary: messages.splitSummaryMesgs || [],
        set: messages.setMesgs || [],
        jump: messages.jumpMesgs || [],
        climbPro: messages.climbProMesgs || [],

        // Developer fields
        fieldDescription: messages.fieldDescriptionMesgs || [],
        developerDataId: messages.developerDataIdMesgs || [],

        // Keep raw messages for complete access
        raw: messages,
    };

    // Extract summary from session data
    result.summary = extractSummary(result);

    // Build list of available data types for UI tabs
    result.availableDataTypes = extractAvailableDataTypes(result);

    return result;
}

/**
 * Extract summary metrics from the parsed data
 */
function extractSummary(data) {
    const session = data.session[0] || {};
    const records = data.record || [];
    const fileId = data.fileId[0] || {};

    // Extract values from records for calculating averages if not in session
    const hrValues = records.map(r => r.heartRate).filter(v => v !== undefined && v !== null);
    const cadenceValues = records.map(r => r.cadence).filter(v => v !== undefined && v !== null);
    const powerValues = records.map(r => r.power).filter(v => v !== undefined && v !== null);
    const temperatureValues = records.map(r => r.temperature).filter(v => v !== undefined && v !== null);

    // Respiration - check multiple possible field names in records
    const respirationValues = records.map(r =>
        r.respirationRate ??
        r.enhancedRespirationRate ??
        r.respiratoryRate ??
        r.breathsPerMinute
    ).filter(v => v !== undefined && v !== null && !isNaN(v));

    // Also check dedicated respiration rate messages
    const respirationMsgs = data.respirationRate || [];
    const respirationFromMsgs = respirationMsgs.map(r => r.respirationRate).filter(v => v !== undefined && v !== null);

    // Combine respiration values
    const allRespirationValues = [...respirationValues, ...respirationFromMsgs];

    return {
        // File info
        fileType: fileId.type,
        manufacturer: fileId.manufacturer,
        product: fileId.product,
        serialNumber: fileId.serialNumber,
        timeCreated: fileId.timeCreated,

        // Basic metrics
        sport: session.sport,
        subSport: session.subSport,
        startTime: session.startTime || session.timestamp,
        totalElapsedTime: session.totalElapsedTime,
        totalTimerTime: session.totalTimerTime,
        totalDistance: session.totalDistance,
        totalCalories: session.totalCalories,

        // Heart Rate
        avgHeartRate: session.avgHeartRate || average(hrValues),
        maxHeartRate: session.maxHeartRate || (hrValues.length > 0 ? Math.max(...hrValues) : null),
        minHeartRate: session.minHeartRate || (hrValues.length > 0 ? Math.min(...hrValues.filter(v => v > 0)) : null),

        // Speed/Pace
        avgSpeed: session.avgSpeed || session.enhancedAvgSpeed,
        maxSpeed: session.maxSpeed || session.enhancedMaxSpeed,

        // Cadence
        avgCadence: session.avgCadence || session.avgRunningCadence || average(cadenceValues),
        maxCadence: session.maxCadence || session.maxRunningCadence || (cadenceValues.length > 0 ? Math.max(...cadenceValues) : null),

        // Power
        avgPower: session.avgPower || average(powerValues),
        maxPower: session.maxPower || (powerValues.length > 0 ? Math.max(...powerValues) : null),
        normalizedPower: session.normalizedPower,
        trainingStressScore: session.trainingStressScore,
        intensityFactor: session.intensityFactor,
        thresholdPower: session.thresholdPower,

        // Altitude
        totalAscent: session.totalAscent,
        totalDescent: session.totalDescent,
        avgAltitude: session.avgAltitude || session.enhancedAvgAltitude,
        maxAltitude: session.maxAltitude || session.enhancedMaxAltitude,
        minAltitude: session.minAltitude || session.enhancedMinAltitude,

        // Respiration (breaths per minute) - THE KEY DATA
        avgRespirationRate: session.avgRespirationRate || session.enhancedAvgRespirationRate || average(allRespirationValues),
        maxRespirationRate: session.maxRespirationRate || session.enhancedMaxRespirationRate || (allRespirationValues.length > 0 ? Math.max(...allRespirationValues) : null),
        minRespirationRate: session.minRespirationRate || session.enhancedMinRespirationRate || (allRespirationValues.length > 0 ? Math.min(...allRespirationValues.filter(v => v > 0)) : null),
        respirationRecordCount: allRespirationValues.length,

        // Temperature
        avgTemperature: session.avgTemperature || average(temperatureValues),
        maxTemperature: session.maxTemperature || (temperatureValues.length > 0 ? Math.max(...temperatureValues) : null),
        minTemperature: session.minTemperature || (temperatureValues.length > 0 ? Math.min(...temperatureValues.filter(v => v > 0)) : null),

        // Training effect
        trainingEffect: session.totalTrainingEffect,
        anaerobicTrainingEffect: session.totalAnaerobicTrainingEffect,

        // HRV data count
        hrvRecordCount: (data.hrv?.length || 0) + (data.hrvValue?.length || 0),

        // Swimming
        totalStrokes: session.totalStrokes,
        avgStrokeDistance: session.avgStrokeDistance,
        swimStroke: session.swimStroke,
        poolLength: session.poolLength,

        // GPS
        startPositionLat: session.startPositionLat,
        startPositionLong: session.startPositionLong,

        // Record counts
        totalRecords: records.length,
        totalLaps: data.lap?.length || 0,
        totalEvents: data.event?.length || 0,

        // Advanced HRV Analysis
        hrvAnalysis: calculateHRVMetrics(data.hrv),
    };
}

/**
 * Calculate standard HRV metrics from FIT HRV messages
 * @param {Array} hrvMessages - Array of HRV messages from FIT file
 * @returns {Object|null} - HRV metrics (RMSSD, SDNN, etc) or null if no data
 */
function calculateHRVMetrics(hrvMessages) {
    if (!hrvMessages || hrvMessages.length === 0) return null;

    // 1. Extract all RR intervals
    // HRV messages typically contain an array of time values (RR intervals in seconds)
    // The field is often named 'time' and contains an array of numbers
    const rrIntervalsMs = [];

    // Iterate through all HRV messages
    // Format is typically: [{ time: [0.85, 0.84, ...]}, { time: [0.83, ...] }]
    for (const msg of hrvMessages) {
        if (msg.time && Array.isArray(msg.time)) {
            // Values are in seconds, convert to milliseconds for standard HRV calc
            msg.time.forEach(val => {
                if (val !== null && val !== undefined && val > 0 && val < 65.535) { // Filter invalid
                    rrIntervalsMs.push(val * 1000);
                }
            });
        }
    }

    if (rrIntervalsMs.length < 2) return null;

    // 2. Calculate standard time-domain metrics

    // Mean NN (Average RR interval)
    const meanNN = average(rrIntervalsMs);

    // SDNN (Standard Deviation of NN intervals)
    // Reflects overall variability (both short and long term)
    const squaredDiffsFromMean = rrIntervalsMs.map(val => Math.pow(val - meanNN, 2));
    const variance = average(squaredDiffsFromMean);
    const sdnn = Math.sqrt(variance);

    // Calculate successive differences for RMSSD and pNN50
    const successiveDiffs = [];
    const squaredSuccessiveDiffs = [];
    let nn50Count = 0;

    for (let i = 0; i < rrIntervalsMs.length - 1; i++) {
        const diff = Math.abs(rrIntervalsMs[i + 1] - rrIntervalsMs[i]);
        successiveDiffs.push(diff);
        squaredSuccessiveDiffs.push(diff * diff);

        if (diff > 50) {
            nn50Count++;
        }
    }

    // RMSSD (Root Mean Square of Successive Differences)
    // Primary time-domain measure of parasympathetic activity (recovery)
    const meanSquaredDiff = average(squaredSuccessiveDiffs);
    const rmssd = Math.sqrt(meanSquaredDiff);

    // pNN50 (Percentage of successive intervals > 50ms)
    const pnn50 = (nn50Count / successiveDiffs.length) * 100;

    return {
        rmssd: rmssd,
        sdnn: sdnn,
        pnn50: pnn50,
        meanNN: meanNN,
        minNN: Math.min(...rrIntervalsMs),
        maxNN: Math.max(...rrIntervalsMs),
        totalRRIntervals: rrIntervalsMs.length,
        rrIntervals: rrIntervalsMs // Store raw values for visualization
    };
}

/**
 * Extract all available data types that have data
 */
function extractAvailableDataTypes(data) {
    const types = [];

    const dataTypeConfig = [
        { key: 'session', source: data.session, label: 'Sessions' },
        { key: 'lap', source: data.lap, label: 'Laps' },
        { key: 'record', source: data.record, label: 'Records' },
        { key: 'event', source: data.event, label: 'Events' },
        { key: 'hrv', source: data.hrv, label: 'HRV Data' },
        { key: 'hrvValue', source: data.hrvValue, label: 'HRV Values' },
        { key: 'hrvStatusSummary', source: data.hrvStatusSummary, label: 'HRV Status' },
        { key: 'respirationRate', source: data.respirationRate, label: 'Respiration Rate' },
        { key: 'stressLevel', source: data.stressLevel, label: 'Stress Level' },
        { key: 'deviceInfo', source: data.deviceInfo, label: 'Device Info' },
        { key: 'fileId', source: data.fileId, label: 'File Info' },
        { key: 'sport', source: data.sport, label: 'Sport' },
        { key: 'userProfile', source: data.userProfile, label: 'User Profile' },
        { key: 'zonesTarget', source: data.zonesTarget, label: 'Training Zones' },
        { key: 'workout', source: data.workout, label: 'Workout' },
        { key: 'workoutStep', source: data.workoutStep, label: 'Workout Steps' },
        { key: 'length', source: data.length, label: 'Lengths' },
        { key: 'split', source: data.split, label: 'Splits' },
        { key: 'splitSummary', source: data.splitSummary, label: 'Split Summary' },
        { key: 'monitoring', source: data.monitoring, label: 'Monitoring' },
        { key: 'gpsMetadata', source: data.gpsMetadata, label: 'GPS Metadata' },
        { key: 'climbPro', source: data.climbPro, label: 'ClimbPro' },
        { key: 'set', source: data.set, label: 'Sets' },
        { key: 'jump', source: data.jump, label: 'Jumps' },
    ];

    for (const config of dataTypeConfig) {
        if (config.source && Array.isArray(config.source) && config.source.length > 0) {
            types.push({
                key: config.key,
                label: config.label,
                count: config.source.length,
                data: config.source,
            });
        }
    }

    return types;
}

/**
 * Calculate average of an array
 */
function average(arr) {
    if (!arr || arr.length === 0) return null;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/**
 * Format duration in seconds to human readable string
 */
export function formatDuration(seconds) {
    if (seconds === undefined || seconds === null) return '--';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format distance (meters to km)
 */
export function formatDistance(meters) {
    if (meters === undefined || meters === null) return '--';
    return (meters / 1000).toFixed(2);
}

/**
 * Format speed to pace (min/km)
 */
export function formatPace(speedMs) {
    if (!speedMs || speedMs === 0) return '--';
    const paceMinPerKm = (1000 / speedMs) / 60;
    const minutes = Math.floor(paceMinPerKm);
    const seconds = Math.round((paceMinPerKm - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format a date/timestamp
 */
export function formatDate(date) {
    if (!date) return '--';
    const d = new Date(date);
    return d.toLocaleString();
}
