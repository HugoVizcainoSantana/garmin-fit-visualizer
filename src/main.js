import './index.css';
import { parseFitFile, formatDuration, formatDistance, formatPace, formatDate } from './parser/fitParser.js';

// App state
let currentData = null;

// Initialize the app
function init() {
  renderApp();
  setupEventListeners();
}

// Render the main application structure
function renderApp() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <header class="header">
      <h1>Garmin FIT File Viewer</h1>
      <p>Upload your .FIT activity files to explore all the data inside</p>
    </header>

    <div class="upload-container">
      <div class="upload-zone" id="upload-zone">
        <div class="upload-icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>
        <h2>Drop your .FIT file here</h2>
        <p>or click to browse</p>
        <input type="file" id="file-input" accept=".fit" />
      </div>
    </div>

    <div class="loading" id="loading">
      <div class="spinner"></div>
      <p>Parsing FIT file...</p>
    </div>

    <div class="error-message" id="error-message"></div>

    <div class="data-viewer" id="data-viewer">
      <!-- Populated dynamically -->
    </div>
  `;
}

// Setup event listeners
function setupEventListeners() {
  const uploadZone = document.getElementById('upload-zone');
  const fileInput = document.getElementById('file-input');

  // Click to upload
  uploadZone.addEventListener('click', () => fileInput.click());

  // File input change
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  });

  // Drag and drop
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('drag-over');
  });

  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('drag-over');
  });

  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');

    if (e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith('.fit')) {
        handleFile(file);
      } else {
        showError('Please upload a .FIT file');
      }
    }
  });
}

// Handle file upload
async function handleFile(file) {
  const uploadZone = document.querySelector('.upload-container');
  const loading = document.getElementById('loading');
  const dataViewer = document.getElementById('data-viewer');
  const errorMessage = document.getElementById('error-message');

  // Reset states
  errorMessage.classList.remove('active');
  dataViewer.classList.remove('active');

  // Show loading
  uploadZone.style.display = 'none';
  loading.classList.add('active');

  try {
    const arrayBuffer = await file.arrayBuffer();
    currentData = await parseFitFile(arrayBuffer);

    // Hide loading, show data
    loading.classList.remove('active');
    renderDataViewer(file.name, file.size);
    dataViewer.classList.add('active');
  } catch (error) {
    console.error('Error parsing FIT file:', error);
    loading.classList.remove('active');
    uploadZone.style.display = 'block';
    showError(`Error parsing file: ${error.message}`);
  }
}

// Show error message
function showError(message) {
  const errorMessage = document.getElementById('error-message');
  errorMessage.textContent = message;
  errorMessage.classList.add('active');
}

// Reset the app
function resetApp() {
  currentData = null;
  const uploadZone = document.querySelector('.upload-container');
  const dataViewer = document.getElementById('data-viewer');
  const fileInput = document.getElementById('file-input');

  dataViewer.classList.remove('active');
  uploadZone.style.display = 'block';
  fileInput.value = '';
}

// Render the data viewer
function renderDataViewer(fileName, fileSize) {
  const dataViewer = document.getElementById('data-viewer');
  const { summary, availableDataTypes } = currentData;

  dataViewer.innerHTML = `
    <!-- File Info -->
    <div class="file-info">
      <div class="file-info-left">
        <div class="file-icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <div class="file-details">
          <h3>${fileName}</h3>
          <p>${formatFileSize(fileSize)} • ${summary.sport || 'Activity'} ${summary.subSport ? `(${summary.subSport})` : ''}</p>
        </div>
      </div>
      <button class="btn-reset" id="btn-reset">Upload Another File</button>
    </div>

    <!-- Summary Cards -->
    ${renderSummaryCards(summary)}

    <!-- Tabs -->
    <div class="tabs">
      <div class="tab-list" id="tab-list">
        <button class="tab-button active" data-tab="overview">Overview</button>
        ${summary.hrvAnalysis ? '<button class="tab-button" data-tab="hrv-analysis">HRV Analysis</button>' : ''}
        ${availableDataTypes.map(type => `
          <button class="tab-button" data-tab="${type.key}">${type.label} (${type.count})</button>
        `).join('')}
        <button class="tab-button" data-tab="raw">Raw JSON</button>
      </div>
    </div>

    <!-- Tab Panels -->
    <div id="tab-panels">
      <div class="tab-panel active" data-panel="overview">
        ${renderOverviewPanel(summary)}
      </div>
      ${summary.hrvAnalysis ? `
        <div class="tab-panel" data-panel="hrv-analysis">
          ${renderHRVAnalysis(summary.hrvAnalysis)}
        </div>
      ` : ''}
      ${availableDataTypes.map(type => `
        <div class="tab-panel" data-panel="${type.key}">
          ${renderDataSection(type)}
        </div>
      `).join('')}
      <div class="tab-panel" data-panel="raw">
        ${renderRawJson(currentData.raw)}
      </div>
    </div>
  `;

  // Setup tab and section interactions
  setupInteractions();
}

// Setup tab and collapsible section interactions
function setupInteractions() {
  // Reset button
  document.getElementById('btn-reset').addEventListener('click', resetApp);

  // Tab switching
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.dataset.tab;

      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabPanels.forEach(panel => panel.classList.remove('active'));

      button.classList.add('active');
      document.querySelector(`[data-panel="${tabId}"]`).classList.add('active');

      // Draw charts if switching to HRV tab
      if (tabId === 'hrv-analysis') {
        drawHrvCharts();
      }
    });
  });

  // Collapsible sections
  document.querySelectorAll('.data-section-header').forEach(header => {
    header.addEventListener('click', () => {
      header.parentElement.classList.toggle('expanded');
    });
  });
}

// Field descriptions based on Garmin FIT protocol
const FIELD_TOOLTIPS = {
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
  records: 'Total number of data points recorded (typically one per second).',
};

// Render summary cards
function renderSummaryCards(summary) {
  const cards = [];

  // Duration
  if (summary.totalElapsedTime) {
    cards.push({
      label: 'Duration',
      value: formatDuration(summary.totalElapsedTime),
      icon: 'clock',
      tooltip: FIELD_TOOLTIPS.duration
    });
  }

  // Distance
  if (summary.totalDistance) {
    cards.push({
      label: 'Distance',
      value: formatDistance(summary.totalDistance),
      unit: 'km',
      icon: 'route',
      tooltip: FIELD_TOOLTIPS.distance
    });
  }

  // Calories
  if (summary.totalCalories) {
    cards.push({
      label: 'Calories',
      value: summary.totalCalories,
      unit: 'kcal',
      icon: 'fire',
      tooltip: FIELD_TOOLTIPS.calories
    });
  }

  // Heart Rate
  if (summary.avgHeartRate) {
    cards.push({
      label: 'Avg Heart Rate',
      value: Math.round(summary.avgHeartRate),
      unit: 'bpm',
      icon: 'heart',
      tooltip: FIELD_TOOLTIPS.avgHeartRate
    });
  }

  // Pace/Speed
  if (summary.avgSpeed) {
    cards.push({
      label: 'Avg Pace',
      value: formatPace(summary.avgSpeed),
      unit: 'min/km',
      icon: 'speed',
      tooltip: FIELD_TOOLTIPS.avgPace
    });
  }

  // Cadence
  if (summary.avgCadence) {
    cards.push({
      label: 'Avg Cadence',
      value: Math.round(summary.avgCadence),
      unit: 'spm',
      icon: 'steps',
      tooltip: FIELD_TOOLTIPS.avgCadence
    });
  }

  // Power
  if (summary.avgPower) {
    cards.push({
      label: 'Avg Power',
      value: Math.round(summary.avgPower),
      unit: 'W',
      icon: 'bolt',
      tooltip: FIELD_TOOLTIPS.avgPower
    });
  }

  // Elevation
  if (summary.totalAscent) {
    cards.push({
      label: 'Elevation Gain',
      value: Math.round(summary.totalAscent),
      unit: 'm',
      icon: 'mountain',
      tooltip: FIELD_TOOLTIPS.totalAscent
    });
  }

  // Respiration
  if (summary.avgRespirationRate) {
    cards.push({
      label: 'Avg Respiration',
      value: summary.avgRespirationRate.toFixed(1),
      unit: 'br/min',
      icon: 'wind',
      tooltip: FIELD_TOOLTIPS.respiration
    });
  }

  // HRV count
  if (summary.hrvRecordCount > 0) {
    cards.push({
      label: 'HRV Records',
      value: summary.hrvRecordCount,
      icon: 'heart',
      tooltip: FIELD_TOOLTIPS.hrv
    });
  }

  return `
    <div class="summary-grid">
      ${cards.map(card => `
        <div class="summary-card">
          <div class="summary-card-header has-tooltip" data-tooltip="${card.tooltip}">
            ${getIcon(card.icon)}
            <span>${card.label}</span>
            <span class="info-icon">?</span>
          </div>
          <div class="summary-card-value">
            ${card.value}${card.unit ? `<span class="summary-card-unit">${card.unit}</span>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// Render overview panel with all metrics
function renderOverviewPanel(summary) {
  const sections = [
    {
      title: 'Activity Info',
      items: [
        { label: 'Sport', value: summary.sport, tooltip: FIELD_TOOLTIPS.sport },
        { label: 'Sub-Sport', value: summary.subSport, tooltip: FIELD_TOOLTIPS.subSport },
        { label: 'Start Time', value: formatDate(summary.startTime), tooltip: FIELD_TOOLTIPS.startTime },
        { label: 'Total Records', value: summary.totalRecords, tooltip: FIELD_TOOLTIPS.records },
        { label: 'Total Laps', value: summary.totalLaps, tooltip: FIELD_TOOLTIPS.laps },
        { label: 'Total Events', value: summary.totalEvents, tooltip: 'Number of events like start, stop, lap markers, and alerts.' },
      ]
    },
    {
      title: 'Time & Distance',
      items: [
        { label: 'Elapsed Time', value: formatDuration(summary.totalElapsedTime), tooltip: FIELD_TOOLTIPS.elapsedTime },
        { label: 'Moving Time', value: formatDuration(summary.totalTimerTime), tooltip: FIELD_TOOLTIPS.movingTime },
        { label: 'Distance', value: summary.totalDistance ? `${formatDistance(summary.totalDistance)} km` : null, tooltip: FIELD_TOOLTIPS.distance },
        { label: 'Calories', value: summary.totalCalories ? `${summary.totalCalories} kcal` : null, tooltip: FIELD_TOOLTIPS.calories },
      ]
    },
    {
      title: 'Heart Rate',
      items: [
        { label: 'Average', value: summary.avgHeartRate ? `${Math.round(summary.avgHeartRate)} bpm` : null, tooltip: FIELD_TOOLTIPS.avgHeartRate },
        { label: 'Maximum', value: summary.maxHeartRate ? `${Math.round(summary.maxHeartRate)} bpm` : null, tooltip: FIELD_TOOLTIPS.maxHeartRate },
        { label: 'Minimum', value: summary.minHeartRate && summary.minHeartRate > 0 ? `${Math.round(summary.minHeartRate)} bpm` : null, tooltip: FIELD_TOOLTIPS.minHeartRate },
      ]
    },
    {
      title: 'Speed & Pace',
      items: [
        { label: 'Avg Speed', value: summary.avgSpeed ? `${(summary.avgSpeed * 3.6).toFixed(1)} km/h` : null, tooltip: FIELD_TOOLTIPS.avgSpeed },
        { label: 'Max Speed', value: summary.maxSpeed ? `${(summary.maxSpeed * 3.6).toFixed(1)} km/h` : null, tooltip: FIELD_TOOLTIPS.maxSpeed },
        { label: 'Avg Pace', value: summary.avgSpeed ? `${formatPace(summary.avgSpeed)} min/km` : null, tooltip: FIELD_TOOLTIPS.avgPace },
      ]
    },
    {
      title: 'Cadence',
      items: [
        { label: 'Average', value: summary.avgCadence ? `${Math.round(summary.avgCadence)} spm` : null, tooltip: FIELD_TOOLTIPS.avgCadence },
        { label: 'Maximum', value: summary.maxCadence ? `${Math.round(summary.maxCadence)} spm` : null, tooltip: FIELD_TOOLTIPS.maxCadence },
      ]
    },
    {
      title: 'Power',
      items: [
        { label: 'Average', value: summary.avgPower ? `${Math.round(summary.avgPower)} W` : null, tooltip: FIELD_TOOLTIPS.avgPower },
        { label: 'Maximum', value: summary.maxPower ? `${Math.round(summary.maxPower)} W` : null, tooltip: FIELD_TOOLTIPS.maxPower },
        { label: 'Normalized', value: summary.normalizedPower ? `${Math.round(summary.normalizedPower)} W` : null, tooltip: FIELD_TOOLTIPS.normalizedPower },
        { label: 'TSS', value: summary.trainingStressScore, tooltip: FIELD_TOOLTIPS.tss },
        { label: 'Intensity Factor', value: summary.intensityFactor?.toFixed(2), tooltip: FIELD_TOOLTIPS.intensityFactor },
      ]
    },
    {
      title: 'Altitude',
      items: [
        { label: 'Total Ascent', value: summary.totalAscent ? `${Math.round(summary.totalAscent)} m` : null, tooltip: FIELD_TOOLTIPS.totalAscent },
        { label: 'Total Descent', value: summary.totalDescent ? `${Math.round(summary.totalDescent)} m` : null, tooltip: FIELD_TOOLTIPS.totalDescent },
        { label: 'Avg Altitude', value: summary.avgAltitude ? `${Math.round(summary.avgAltitude)} m` : null, tooltip: FIELD_TOOLTIPS.avgAltitude },
        { label: 'Max Altitude', value: summary.maxAltitude ? `${Math.round(summary.maxAltitude)} m` : null, tooltip: 'Highest point above sea level reached during the activity.' },
        { label: 'Min Altitude', value: summary.minAltitude ? `${Math.round(summary.minAltitude)} m` : null, tooltip: 'Lowest point above sea level during the activity.' },
      ]
    },
    {
      title: 'Respiration (Breaths/min)',
      items: [
        { label: 'Average', value: summary.avgRespirationRate ? `${summary.avgRespirationRate.toFixed(1)} br/min` : null, tooltip: FIELD_TOOLTIPS.avgRespirationRate },
        { label: 'Maximum', value: summary.maxRespirationRate ? `${summary.maxRespirationRate.toFixed(1)} br/min` : null, tooltip: FIELD_TOOLTIPS.maxRespirationRate },
        { label: 'Minimum', value: summary.minRespirationRate && summary.minRespirationRate > 0 ? `${summary.minRespirationRate.toFixed(1)} br/min` : null, tooltip: FIELD_TOOLTIPS.minRespirationRate },
        { label: 'Data Points', value: summary.respirationRecordCount > 0 ? summary.respirationRecordCount : null, tooltip: 'Number of respiration rate measurements recorded during the activity.' },
      ]
    },
    {
      title: 'Temperature',
      items: [
        { label: 'Average', value: summary.avgTemperature ? `${summary.avgTemperature.toFixed(1)} °C` : null, tooltip: FIELD_TOOLTIPS.temperature },
        { label: 'Maximum', value: summary.maxTemperature && summary.maxTemperature !== -Infinity ? `${summary.maxTemperature?.toFixed(1)} °C` : null, tooltip: 'Highest temperature recorded during the activity.' },
        { label: 'Minimum', value: summary.minTemperature && summary.minTemperature !== Infinity ? `${summary.minTemperature?.toFixed(1)} °C` : null, tooltip: 'Lowest temperature recorded during the activity.' },
      ]
    },
    {
      title: 'Training Effect',
      items: [
        { label: 'Aerobic', value: summary.trainingEffect?.toFixed(1), tooltip: FIELD_TOOLTIPS.trainingEffect },
        { label: 'Anaerobic', value: summary.anaerobicTrainingEffect?.toFixed(1), tooltip: FIELD_TOOLTIPS.anaerobicEffect },
      ]
    },
    {
      title: 'HRV Data',
      items: [
        { label: 'HRV Records', value: summary.hrvRecordCount > 0 ? summary.hrvRecordCount : null, tooltip: FIELD_TOOLTIPS.hrv },
      ]
    },
  ];

  // Filter out sections with no data
  const validSections = sections.filter(section =>
    section.items.some(item => item.value !== null && item.value !== undefined)
  );

  return `
    <div class="overview-grid">
      ${validSections.map(section => `
        <div class="data-section expanded">
          <div class="data-section-header">
            <span class="data-section-title">${section.title}</span>
            <svg class="data-section-toggle" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
          <div class="data-section-content">
            <table class="data-table">
              <tbody>
                ${section.items
      .filter(item => item.value !== null && item.value !== undefined)
      .map(item => `
                    <tr>
                      <td class="has-tooltip" data-tooltip="${item.tooltip || ''}" style="color: var(--text-secondary)">${item.label}<span class="info-icon">?</span></td>
                      <td>${item.value}</td>
                    </tr>
                  `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// Render a data section with table
function renderDataSection(type) {
  if (!type.data || type.data.length === 0) {
    return '<p style="color: var(--text-muted); padding: 1rem;">No data available</p>';
  }

  // Get all unique keys from all records
  const allKeys = new Set();
  type.data.forEach(record => {
    Object.keys(record).forEach(key => allKeys.add(key));
  });
  const keys = Array.from(allKeys);

  return `
    <div class="data-section expanded">
      <div class="data-section-header">
        <span class="data-section-title">
          ${type.label}
          <span class="data-section-count">${type.count} records</span>
        </span>
        <svg class="data-section-toggle" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </div>
      <div class="data-section-content">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              ${keys.map(key => `<th>${formatKey(key)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${type.data.slice(0, 1000).map((record, index) => `
              <tr>
                <td>${index + 1}</td>
                ${keys.map(key => `<td>${formatValue(record[key])}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${type.count > 1000 ? `<p style="padding: 1rem; color: var(--text-muted);">Showing first 1000 of ${type.count} records</p>` : ''}
      </div>
    </div>
  `;
}

// Render HRV Analysis Panel
function renderHRVAnalysis(hrv) {
  if (!hrv || !hrv.rmssd) {
    return '<p style="color: var(--text-muted); padding: 1rem;">No HRV data available (requires RR intervals).</p>';
  }

  const cards = [
    { label: 'RMSSD', value: Math.round(hrv.rmssd), unit: 'ms', icon: 'heart', tooltip: FIELD_TOOLTIPS.rmssd },
    { label: 'SDNN', value: Math.round(hrv.sdnn), unit: 'ms', icon: 'heart', tooltip: FIELD_TOOLTIPS.sdnn },
    { label: 'pNN50', value: hrv.pnn50.toFixed(1), unit: '%', icon: 'heart', tooltip: FIELD_TOOLTIPS.pnn50 },
    { label: 'Mean NN', value: Math.round(hrv.meanNN), unit: 'ms', icon: 'clock', tooltip: FIELD_TOOLTIPS.meanNN },
  ];

  return `
    <div class="summary-grid" style="margin-bottom: 2rem;">
      ${cards.map(card => `
        <div class="summary-card">
          <div class="summary-card-header has-tooltip" data-tooltip="${card.tooltip}">
            ${getIcon(card.icon)}
            <span>${card.label}</span>
            <span class="info-icon">?</span>
          </div>
          <div class="summary-card-value">
            ${card.value}<span class="summary-card-unit">${card.unit}</span>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="data-section expanded">
      <div class="data-section-header">
        <span class="data-section-title">Poincaré Plot (RR_n vs RR_n+1)</span>
      </div>
      <div class="data-section-content" style="padding: 1rem; display: flex; justify-content: center; background: var(--bg-card);">
        <canvas id="poincare-plot" width="500" height="500" style="max-width: 100%; height: auto; border-radius: 8px; background: var(--bg-primary);"></canvas>
      </div>
    </div>

    <div class="data-section expanded">
      <div class="data-section-header">
        <span class="data-section-title">RR Intervals Time Series</span>
      </div>
      <div class="data-section-content" style="padding: 1rem; display: flex; justify-content: center; background: var(--bg-card);">
        <canvas id="rr-timeseries" width="800" height="300" style="width: 100%; height: auto; border-radius: 8px; background: var(--bg-primary);"></canvas>
      </div>
    </div>
  `;
}

// Draw charts when HRV tab is activated
function drawHrvCharts() {
  if (!currentData || !currentData.summary.hrvAnalysis) return;
  const rrIntervals = currentData.summary.hrvAnalysis.rrIntervals;

  // Use requestAnimationFrame to ensure DOM is updated
  requestAnimationFrame(() => {
    drawPoincarePlot(rrIntervals);
    drawRRTimeSeries(rrIntervals);
  });
}

function drawPoincarePlot(rrIntervals) {
  const canvas = document.getElementById('poincare-plot');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const padding = 40;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Find min/max for scaling
  const minRR = Math.min(...rrIntervals) * 0.9;
  const maxRR = Math.max(...rrIntervals) * 1.1;
  const range = maxRR - minRR;

  // Scale function
  const scale = (val) => ((val - minRR) / range) * (width - 2 * padding) + padding;
  // Y needs to be inverted (0 at bottom)
  const scaleY = (val) => height - (((val - minRR) / range) * (height - 2 * padding) + padding);

  // Draw Grid
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  // ... grid logic could be complex, keeping it simple
  ctx.stroke();

  // Axis labels
  ctx.fillStyle = '#888';
  ctx.font = '12px Inter';
  ctx.textAlign = 'center';
  ctx.fillText('RR_n (ms)', width / 2, height - 10);
  ctx.save();
  ctx.translate(15, height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('RR_n+1 (ms)', 0, 0);
  ctx.restore();

  // Draw points
  ctx.fillStyle = '#00d4ff';
  ctx.globalAlpha = 0.6;

  for (let i = 0; i < rrIntervals.length - 1; i++) {
    const x = scale(rrIntervals[i]);
    const y = scaleY(rrIntervals[i + 1]);

    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw identity line (x=y)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(scale(minRR), scaleY(minRR));
  ctx.lineTo(scale(maxRR), scaleY(maxRR));
  ctx.stroke();

  ctx.globalAlpha = 1.0;
}

function drawRRTimeSeries(rrIntervals) {
  const canvas = document.getElementById('rr-timeseries');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const padding = 40;

  ctx.clearRect(0, 0, width, height);

  const minRR = Math.min(...rrIntervals) * 0.9;
  const maxRR = Math.max(...rrIntervals) * 1.1;
  const range = maxRR - minRR;

  const scaleY = (val) => height - (((val - minRR) / range) * (height - 2 * padding) + padding);
  const scaleX = (idx) => (idx / rrIntervals.length) * (width - 2 * padding) + padding;

  // Draw line
  ctx.strokeStyle = '#7c3aed';
  ctx.lineWidth = 1.5;
  ctx.beginPath();

  for (let i = 0; i < rrIntervals.length; i++) {
    const x = scaleX(i);
    const y = scaleY(rrIntervals[i]);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Axis
  ctx.fillStyle = '#888';
  ctx.font = '12px Inter';
  ctx.fillText('Beat Number', width / 2, height - 10);
  ctx.save();
  ctx.translate(15, height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('RR Interval (ms)', 0, 0);
  ctx.restore();
}

// Render raw JSON view
function renderRawJson(data) {
  return `
    <div class="raw-json">
      <pre>${syntaxHighlight(JSON.stringify(data || currentData.raw, null, 2))}</pre>
    </div>
  `;
}

// Syntax highlight JSON
function syntaxHighlight(json) {
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
    let cls = 'number';
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        cls = 'key';
        match = match.slice(0, -1) + '</span>:';
        return `<span class="${cls}">${match}`;
      } else {
        cls = 'string';
      }
    } else if (/true|false/.test(match)) {
      cls = 'boolean';
    } else if (/null/.test(match)) {
      cls = 'null';
    }
    return `<span class="${cls}">${match}</span>`;
  });
}

// Format a key name for display
function formatKey(key) {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
}

// Format a value for display
function formatValue(value) {
  if (value === null || value === undefined) return '--';
  if (value instanceof Date) return formatDate(value);
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'number') {
    // Format numbers nicely
    if (Number.isInteger(value)) return value.toLocaleString();
    return value.toFixed(2);
  }
  return String(value);
}

// Format file size
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Get icon SVG
function getIcon(name) {
  const icons = {
    clock: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',
    route: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /></svg>',
    fire: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" /></svg>',
    heart: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>',
    speed: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>',
    steps: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>',
    bolt: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>',
    mountain: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>',
    wind: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>',
  };
  return icons[name] || '';
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);
