import i18next from '@/i18n';
import { store } from '@/state/store';
import { TimeSeriesChart } from './TimeSeriesChart';
import { formatDuration, formatDate } from '@/utils/formatters';

export class MetricsCharts {
  private container: HTMLElement;
  private unsubscribe: (() => void) | null = null;
  private charts: Map<string, TimeSeriesChart> = new Map();

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
    this.subscribeToState();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="metrics-charts">
        <div class="charts-header">
          <h3>${i18next.t('overview')} - Time Series Analysis</h3>
          <div class="charts-controls">
            <button class="chart-toggle" id="toggle-all-charts" aria-expanded="true">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
              <span>Collapse All</span>
            </button>
          </div>
        </div>
        
        <div class="charts-grid" id="charts-grid">
          <!-- Charts will be populated dynamically -->
        </div>
        
        <div class="charts-explanation">
          <h4>Understanding Time Series Data</h4>
          <p>Time series charts show how your metrics changed throughout the activity. This helps identify patterns, fatigue, and performance variations.</p>
          
          <div class="chart-insights">
            <div class="insight-card">
              <h5>Heart Rate Analysis</h5>
              <p>Observe how your heart rate responds to effort and recovery. Look for steady-state zones and spikes during high-intensity segments.</p>
            </div>
            <div class="insight-card">
              <h5>Pace & Speed Variability</h5>
              <p>Analyze consistency in pace. Large variations may indicate terrain changes, fatigue, or strategic efforts.</p>
            </div>
            <div class="insight-card">
              <h5>Cadence Patterns</h5>
              <p>Monitor cadence for efficiency. Consistent cadence often indicates better performance and reduced injury risk.</p>
            </div>
            <div class="insight-card">
              <h5>Power Output</h5>
              <p>For cycling, power shows the actual work done. Compare power segments with heart rate to understand fitness level.</p>
            </div>
          </div>
        </div>
      </div>
    `;
    
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const toggleButton = this.container.querySelector('#toggle-all-charts') as HTMLButtonElement;
    
    toggleButton?.addEventListener('click', () => {
      const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true';
      const chartSections = this.container.querySelectorAll('.chart-section');
      
      chartSections.forEach(section => {
        const content = section.querySelector('.chart-content') as HTMLElement;
        if (isExpanded) {
          content.classList.remove('expanded');
          section.classList.add('collapsed');
        } else {
          content.classList.add('expanded');
          section.classList.remove('collapsed');
        }
      });
      
      toggleButton.setAttribute('aria-expanded', (!isExpanded).toString());
      toggleButton.querySelector('span')!.textContent = isExpanded ? 'Expand All' : 'Collapse All';
    });
  }

  private updateCharts(): void {
    const state = store.getState();
    if (!state.currentData) return;

    const raw = state.currentData.raw;
    const records = raw.record || [];
    
    if (records.length === 0) {
      this.showNoDataMessage();
      return;
    }

    // Clear existing charts
    this.charts.forEach(chart => chart.destroy());
    this.charts.clear();

    // Create charts grid
    const chartsGrid = this.container.querySelector('#charts-grid') as HTMLElement;
    chartsGrid.innerHTML = '';

    // Heart Rate Chart
    if (this.hasHeartRateData(records)) {
      const heartRateSection = this.createChartSection('heart-rate', 'Heart Rate', 'heart');
      chartsGrid.appendChild(heartRateSection);
      
      const chartContainer = heartRateSection.querySelector('.chart-wrapper') as HTMLElement;
      const heartRateChart = new TimeSeriesChart(chartContainer);
      this.charts.set('heart-rate', heartRateChart);
      
      this.updateHeartRateChart(records);
    }

    // Speed Chart
    if (this.hasSpeedData(records)) {
      const speedSection = this.createChartSection('speed', 'Speed & Pace', 'speed');
      chartsGrid.appendChild(speedSection);
      
      const chartContainer = speedSection.querySelector('.chart-wrapper') as HTMLElement;
      const speedChart = new TimeSeriesChart(chartContainer);
      this.charts.set('speed', speedChart);
      
      this.updateSpeedChart(records);
    }

    // Cadence Chart
    if (this.hasCadenceData(records)) {
      const cadenceSection = this.createChartSection('cadence', 'Cadence', 'cadence');
      chartsGrid.appendChild(cadenceSection);
      
      const chartContainer = cadenceSection.querySelector('.chart-wrapper') as HTMLElement;
      const cadenceChart = new TimeSeriesChart(chartContainer);
      this.charts.set('cadence', cadenceChart);
      
      this.updateCadenceChart(records);
    }

    // Power Chart
    if (this.hasPowerData(records)) {
      const powerSection = this.createChartSection('power', 'Power Output', 'power');
      chartsGrid.appendChild(powerSection);
      
      const chartContainer = powerSection.querySelector('.chart-wrapper') as HTMLElement;
      const powerChart = new TimeSeriesChart(chartContainer);
      this.charts.set('power', powerChart);
      
      this.updatePowerChart(records);
    }

    // Elevation Chart
    if (this.hasElevationData(records)) {
      const elevationSection = this.createChartSection('elevation', 'Elevation Profile', 'elevation');
      chartsGrid.appendChild(elevationSection);
      
      const chartContainer = elevationSection.querySelector('.chart-wrapper') as HTMLElement;
      const elevationChart = new TimeSeriesChart(chartContainer);
      this.charts.set('elevation', elevationChart);
      
      this.updateElevationChart(records);
    }

    // Respiration Chart
    if (this.hasRespirationData(raw)) {
      const respirationSection = this.createChartSection('respiration', 'Respiration Rate', 'respiration');
      chartsGrid.appendChild(respirationSection);
      
      const chartContainer = respirationSection.querySelector('.chart-wrapper') as HTMLElement;
      const respirationChart = new TimeSeriesChart(chartContainer);
      this.charts.set('respiration', respirationChart);
      
      this.updateRespirationChart(raw);
    }
  }

  private createChartSection(id: string, title: string, icon: string): HTMLElement {
    const section = document.createElement('div');
    section.className = 'chart-section';
    section.id = `${id}-section`;
    
    section.innerHTML = `
      <div class="chart-header">
        <h4 class="chart-title">
          <svg class="chart-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="${this.getIconPath(icon)}" />
          </svg>
          ${title}
        </h4>
        <button class="chart-toggle" aria-expanded="true">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      </div>
      <div class="chart-content expanded">
        <div class="chart-wrapper"></div>
        <div class="chart-stats" id="${id}-stats">
          <!-- Stats will be populated dynamically -->
        </div>
      </div>
    `;
    
    // Setup toggle functionality
    const toggleButton = section.querySelector('.chart-toggle') as HTMLButtonElement;
    const chartContent = section.querySelector('.chart-content') as HTMLElement;
    
    toggleButton?.addEventListener('click', () => {
      const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true';
      toggleButton.setAttribute('aria-expanded', (!isExpanded).toString());
      chartContent.classList.toggle('expanded');
      section.classList.toggle('collapsed');
    });
    
    return section;
  }

  private getIconPath(iconName: string): string {
    const iconPaths: { [key: string]: string } = {
      heart: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
      speed: 'M13 10V3L4 14h7v7l9-11h-7z',
      cadence: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
      power: 'M11.584 2.376a.75.75 0 01.832 0l6 4a.75.75 0 010 1.248l-6 4a.75.75 0 01-.832 0l-6-4a.75.75 0 010-1.248l6-4z',
      elevation: 'M12 2C8 2 4 6 4 10s2 6 2 6l6 8 6-8s2-2 2-6-4-8-8-8z',
      respiration: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z'
    };
    
    return iconPaths[iconName] || iconPaths.heart;
  }

  private updateHeartRateChart(records: any[]): void {
    const chart = this.charts.get('heart-rate');
    if (!chart) return;

    const heartRateData = records
      .filter(record => record.heartRate !== null && record.heartRate !== undefined)
      .map(record => record.heartRate);

    const labels = this.generateTimeLabels(records);
    
    chart.updateTimeSeries({
      labels,
      datasets: [{
        label: 'Heart Rate',
        data: heartRateData
      }]
    }, 'Heart Rate Analysis', 'bpm');

    // Update stats
    this.updateHeartRateStats(heartRateData);
  }

  private updateSpeedChart(records: any[]): void {
    const chart = this.charts.get('speed');
    if (!chart) return;

    const speedData = records
      .filter(record => record.speed !== null && record.speed !== undefined)
      .map(record => record.speed * 3.6); // Convert to km/h

    const paceData = records
      .filter(record => record.speed !== null && record.speed !== undefined && record.speed > 0)
      .map(record => 1000 / (record.speed * 60)); // Convert to min/km

    const labels = this.generateTimeLabels(records);
    
    const datasets: any[] = [{
      label: 'Speed (km/h)',
      data: speedData
    }];

    if (paceData.length > 0) {
      datasets.push({
        label: 'Pace (min/km)',
        data: paceData,
        color: '#7c3aed'
      });
    }
    
    chart.updateTimeSeries({
      labels,
      datasets
    }, 'Speed & Pace Analysis');

    // Update stats
    this.updateSpeedStats(speedData, paceData);
  }

  private updateCadenceChart(records: any[]): void {
    const chart = this.charts.get('cadence');
    if (!chart) return;

    const cadenceData = records
      .filter(record => record.cadence !== null && record.cadence !== undefined)
      .map(record => record.cadence);

    const labels = this.generateTimeLabels(records);
    
    chart.updateTimeSeries({
      labels,
      datasets: [{
        label: 'Cadence',
        data: cadenceData
      }]
    }, 'Cadence Analysis', 'spm');

    // Update stats
    this.updateCadenceStats(cadenceData);
  }

  private updatePowerChart(records: any[]): void {
    const chart = this.charts.get('power');
    if (!chart) return;

    const powerData = records
      .filter(record => record.power !== null && record.power !== undefined)
      .map(record => record.power);

    const labels = this.generateTimeLabels(records);
    
    chart.updateTimeSeries({
      labels,
      datasets: [{
        label: 'Power Output',
        data: powerData
      }]
    }, 'Power Analysis', 'W');

    // Update stats
    this.updatePowerStats(powerData);
  }

  private updateElevationChart(records: any[]): void {
    const chart = this.charts.get('elevation');
    if (!chart) return;

    const elevationData = records
      .filter(record => record.altitude !== null && record.altitude !== undefined)
      .map(record => record.altitude);

    const labels = this.generateTimeLabels(records);
    
    chart.updateTimeSeries({
      labels,
      datasets: [{
        label: 'Altitude',
        data: elevationData,
        color: '#10b981'
      }]
    }, 'Elevation Profile', 'm');

    // Update stats
    this.updateElevationStats(elevationData);
  }

  private updateRespirationChart(raw: any): void {
    const chart = this.charts.get('respiration');
    if (!chart) return;

    const respData = raw.respirationRate || [];
    if (respData.length === 0) return;

    const respirationData = respData
      .filter(record => record.respirationRate !== null && record.respirationRate !== undefined)
      .map(record => record.respirationRate);

    const labels = respData
      .filter(record => record.timestamp !== null && record.timestamp !== undefined)
      .map(record => formatDate(new Date(record.timestamp * 1000)));
    
    chart.updateTimeSeries({
      labels,
      datasets: [{
        label: 'Respiration Rate',
        data: respirationData,
        color: '#f59e0b'
      }]
    }, 'Respiration Analysis', 'br/min');

    // Update stats
    this.updateRespirationStats(respirationData);
  }

  private generateTimeLabels(records: any[]): string[] {
    return records.map((record, index) => {
      if (record.timestamp) {
        return formatDate(new Date(record.timestamp * 1000));
      }
      return formatDuration(index);
    });
  }

  private updateHeartRateStats(data: number[]): void {
    const statsContainer = this.container.querySelector('#heart-rate-stats') as HTMLElement;
    if (!statsContainer || data.length === 0) return;

    const avg = data.reduce((sum, val) => sum + val, 0) / data.length;
    const max = Math.max(...data);
    const min = Math.min(...data);

    statsContainer.innerHTML = `
      <div class="stat-item">
        <span class="stat-label">Average:</span>
        <span class="stat-value">${Math.round(avg)} bpm</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Maximum:</span>
        <span class="stat-value">${max} bpm</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Minimum:</span>
        <span class="stat-value">${min} bpm</span>
      </div>
    `;
  }

  private updateSpeedStats(speedData: number[], paceData: number[]): void {
    const statsContainer = this.container.querySelector('#speed-stats') as HTMLElement;
    if (!statsContainer || speedData.length === 0) return;

    const avgSpeed = speedData.reduce((sum, val) => sum + val, 0) / speedData.length;
    const maxSpeed = Math.max(...speedData);

    let statsHTML = `
      <div class="stat-item">
        <span class="stat-label">Avg Speed:</span>
        <span class="stat-value">${avgSpeed.toFixed(1)} km/h</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Max Speed:</span>
        <span class="stat-value">${maxSpeed.toFixed(1)} km/h</span>
      </div>
    `;

    if (paceData.length > 0) {
      const avgPace = paceData.reduce((sum, val) => sum + val, 0) / paceData.length;
      statsHTML += `
        <div class="stat-item">
          <span class="stat-label">Avg Pace:</span>
          <span class="stat-value">${this.formatPace(avgPace)}</span>
        </div>
      `;
    }

    statsContainer.innerHTML = statsHTML;
  }

  private updateCadenceStats(data: number[]): void {
    const statsContainer = this.container.querySelector('#cadence-stats') as HTMLElement;
    if (!statsContainer || data.length === 0) return;

    const avg = data.reduce((sum, val) => sum + val, 0) / data.length;
    const max = Math.max(...data);

    statsContainer.innerHTML = `
      <div class="stat-item">
        <span class="stat-label">Average:</span>
        <span class="stat-value">${Math.round(avg)} spm</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Maximum:</span>
        <span class="stat-value">${max} spm</span>
      </div>
    `;
  }

  private updatePowerStats(data: number[]): void {
    const statsContainer = this.container.querySelector('#power-stats') as HTMLElement;
    if (!statsContainer || data.length === 0) return;

    const avg = data.reduce((sum, val) => sum + val, 0) / data.length;
    const max = Math.max(...data);

    statsContainer.innerHTML = `
      <div class="stat-item">
        <span class="stat-label">Average:</span>
        <span class="stat-value">${Math.round(avg)} W</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Maximum:</span>
        <span class="stat-value">${max} W</span>
      </div>
    `;
  }

  private updateElevationStats(data: number[]): void {
    const statsContainer = this.container.querySelector('#elevation-stats') as HTMLElement;
    if (!statsContainer || data.length === 0) return;

    const avg = data.reduce((sum, val) => sum + val, 0) / data.length;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const gain = this.calculateElevationGain(data);

    statsContainer.innerHTML = `
      <div class="stat-item">
        <span class="stat-label">Average:</span>
        <span class="stat-value">${avg.toFixed(0)} m</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Maximum:</span>
        <span class="stat-value">${max.toFixed(0)} m</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Elevation Gain:</span>
        <span class="stat-value">${gain.toFixed(0)} m</span>
      </div>
    `;
  }

  private updateRespirationStats(data: number[]): void {
    const statsContainer = this.container.querySelector('#respiration-stats') as HTMLElement;
    if (!statsContainer || data.length === 0) return;

    const avg = data.reduce((sum, val) => sum + val, 0) / data.length;
    const max = Math.max(...data);
    const min = Math.min(...data);

    statsContainer.innerHTML = `
      <div class="stat-item">
        <span class="stat-label">Average:</span>
        <span class="stat-value">${Math.round(avg)} br/min</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Maximum:</span>
        <span class="stat-value">${max} br/min</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Minimum:</span>
        <span class="stat-value">${min} br/min</span>
      </div>
    `;
  }

  private formatPace(paceMinKm: number): string {
    const minutes = Math.floor(paceMinKm);
    const seconds = Math.round((paceMinKm - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')} min/km`;
  }

  private calculateElevationGain(elevations: number[]): number {
    let gain = 0;
    for (let i = 1; i < elevations.length; i++) {
      if (elevations[i] > elevations[i - 1]) {
        gain += elevations[i] - elevations[i - 1];
      }
    }
    return gain;
  }

  // Data availability checkers
  private hasHeartRateData(records: any[]): boolean {
    return records.some(record => record.heartRate !== null && record.heartRate !== undefined);
  }

  private hasSpeedData(records: any[]): boolean {
    return records.some(record => record.speed !== null && record.speed !== undefined);
  }

  private hasCadenceData(records: any[]): boolean {
    return records.some(record => record.cadence !== null && record.cadence !== undefined);
  }

  private hasPowerData(records: any[]): boolean {
    return records.some(record => record.power !== null && record.power !== undefined);
  }

  private hasElevationData(records: any[]): boolean {
    return records.some(record => record.altitude !== null && record.altitude !== undefined);
  }

  private hasRespirationData(raw: any): boolean {
    const respData = raw.respirationRate || [];
    return respData.length > 0 && respData.some(record => record.respirationRate !== null && record.respirationRate !== undefined);
  }

  private showNoDataMessage(): void {
    const chartsGrid = this.container.querySelector('#charts-grid') as HTMLElement;
    chartsGrid.innerHTML = `
      <div class="no-data-message">
        <h4>No time series data available</h4>
        <p>Upload a FIT file with record data to see time series charts.</p>
      </div>
    `;
  }

  private subscribeToState(): void {
    this.unsubscribe = store.subscribe((state) => {
      if (state.currentData) {
        this.updateCharts();
      } else {
        this.showNoDataMessage();
      }
    });
  }

  public destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    
    // Destroy all charts
    this.charts.forEach(chart => chart.destroy());
    this.charts.clear();
  }
}