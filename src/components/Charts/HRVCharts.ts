import i18next from '@/i18n';
import { store } from '@/state/store';
import { TimeSeriesChart } from './TimeSeriesChart';

export class HRVCharts {
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
      <div class="hrv-charts">
        <div class="hrv-header">
          <h3>${i18next.t('hrvAnalysis')}</h3>
          <div class="hrv-metrics-summary" id="hrv-metrics">
            <!-- Metrics will be populated dynamically -->
          </div>
        </div>
        
        <div class="charts-grid">
          <div class="chart-section">
            <div class="chart-container" id="poincare-chart">
              <h4>Poincaré Plot</h4>
              <div class="chart-wrapper"></div>
            </div>
          </div>
          
          <div class="chart-section">
            <div class="chart-container" id="rr-intervals-chart">
              <h4>RR Intervals Time Series</h4>
              <div class="chart-wrapper"></div>
            </div>
          </div>
          
          <div class="chart-section">
            <div class="chart-container" id="hrv-distribution-chart">
              <h4>RR Interval Distribution</h4>
              <div class="chart-wrapper"></div>
            </div>
          </div>
          
          <div class="chart-section">
            <div class="chart-container" id="hrv-trends-chart">
              <h4>HRV Trends (Moving Average)</h4>
              <div class="chart-wrapper"></div>
            </div>
          </div>
        </div>
        
        <div class="hrv-explanation">
          <h4>Understanding HRV Metrics</h4>
          <div class="metrics-grid">
            <div class="metric-card">
              <h5>RMSSD</h5>
              <p>${i18next.t('tooltip_rmssd')}</p>
            </div>
            <div class="metric-card">
              <h5>SDNN</h5>
              <p>${i18next.t('tooltip_sdnn')}</p>
            </div>
            <div class="metric-card">
              <h5>pNN50</h5>
              <p>${i18next.t('tooltip_pnn50')}</p>
            </div>
            <div class="metric-card">
              <h5>Mean NN</h5>
              <p>${i18next.t('tooltip_meanNN')}</p>
            </div>
          </div>
        </div>
      </div>
    `;
    
    this.initializeCharts();
  }

  private initializeCharts(): void {
    // Initialize chart containers
    const chartContainers = this.container.querySelectorAll('.chart-wrapper');
    
    chartContainers.forEach((container, index) => {
      const chartId = container.parentElement?.id;
      if (chartId) {
        const chart = new TimeSeriesChart(container as HTMLElement);
        this.charts.set(chartId, chart);
      }
    });
  }

  private updateHRVMetrics(): void {
    const state = store.getState();
    if (!state.currentData) return;

    const summary = state.currentData.summary;
    const metricsContainer = this.container.querySelector('#hrv-metrics') as HTMLElement;
    
    if (summary.rmssd || summary.sdnn || summary.pnn50) {
      metricsContainer.innerHTML = `
        <div class="metric-item">
          <span class="metric-label">RMSSD:</span>
          <span class="metric-value">${summary.rmssd || '--'} ms</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">SDNN:</span>
          <span class="metric-value">${summary.sdnn || '--'} ms</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">pNN50:</span>
          <span class="metric-value">${summary.pnn50 || '--'}%</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">Mean NN:</span>
          <span class="metric-value">${summary.meanNN || '--'} ms</span>
        </div>
      `;
    } else {
      metricsContainer.innerHTML = `<p class="no-data">${i18next.t('noHrvDataAvailable')}</p>`;
    }
  }

  private updateCharts(): void {
    const state = store.getState();
    if (!state.currentData) return;

    const raw = state.currentData.raw;
    
    // Get HRV data
    const hrvValues = raw.hrvValue || [];
    if (hrvValues.length === 0) {
      this.showNoDataMessage();
      return;
    }

    // Extract RR intervals
    const rrIntervals: number[] = [];
    hrvValues.forEach(hrv => {
      if (hrv.time && hrv.time > 0) {
        rrIntervals.push(hrv.time);
      }
    });

    if (rrIntervals.length < 2) {
      this.showNoDataMessage();
      return;
    }

    // Update Poincaré plot
    this.updatePoincarePlot(rrIntervals);
    
    // Update RR intervals time series
    this.updateRRIntervalsTimeSeries(rrIntervals);
    
    // Update RR interval distribution
    this.updateRRIntervalDistribution(rrIntervals);
    
    // Update HRV trends
    this.updateHRVTrends(rrIntervals);
  }

  private updatePoincarePlot(rrIntervals: number[]): void {
    const chart = this.charts.get('poincare-chart');
    if (!chart) return;

    // Create Poincaré plot data (RR_n vs RR_n+1)
    const scatterData: { x: number; y: number }[] = [];
    for (let i = 0; i < rrIntervals.length - 1; i++) {
      scatterData.push({
        x: rrIntervals[i],
        y: rrIntervals[i + 1]
      });
    }

    chart.updateScatterPlot(
      scatterData,
      'Poincaré Plot (RR_n vs RR_n+1)',
      'RR_n (ms)',
      'RR_n+1 (ms)'
    );
  }

  private updateRRIntervalsTimeSeries(rrIntervals: number[]): void {
    const chart = this.charts.get('rr-intervals-chart');
    if (!chart) return;

    const labels = rrIntervals.map((_, index) => `${index + 1}`);
    
    chart.updateTimeSeries({
      labels,
      datasets: [{
        label: 'RR Intervals',
        data: rrIntervals
      }]
    }, 'RR Intervals Time Series', 'ms');
  }

  private updateRRIntervalDistribution(rrIntervals: number[]): void {
    const chart = this.charts.get('hrv-distribution-chart');
    if (!chart) return;

    // Create histogram data
    const bins = 20;
    const min = Math.min(...rrIntervals);
    const max = Math.max(...rrIntervals);
    const binWidth = (max - min) / bins;
    
    const histogram = new Array(bins).fill(0);
    const binLabels: string[] = [];
    
    for (let i = 0; i < bins; i++) {
      const binStart = min + (i * binWidth);
      const binEnd = binStart + binWidth;
      binLabels.push(`${binStart.toFixed(0)}-${binEnd.toFixed(0)}`);
    }
    
    rrIntervals.forEach(value => {
      const binIndex = Math.min(Math.floor((value - min) / binWidth), bins - 1);
      histogram[binIndex]++;
    });

    chart.updateTimeSeries({
      labels: binLabels,
      datasets: [{
        label: 'Frequency',
        data: histogram
      }]
    }, 'RR Interval Distribution', 'count');
  }

  private updateHRVTrends(rrIntervals: number[]): void {
    const chart = this.charts.get('hrv-trends-chart');
    if (!chart) return;

    // Calculate moving average
    const windowSize = Math.min(10, Math.floor(rrIntervals.length / 10));
    const movingAverage: number[] = [];
    
    for (let i = 0; i < rrIntervals.length; i++) {
      const start = Math.max(0, i - windowSize + 1);
      const end = i + 1;
      const window = rrIntervals.slice(start, end);
      const avg = window.reduce((sum, val) => sum + val, 0) / window.length;
      movingAverage.push(avg);
    }

    const labels = movingAverage.map((_, index) => `${index + 1}`);
    
    chart.updateTimeSeries({
      labels,
      datasets: [
        {
          label: 'RR Intervals',
          data: rrIntervals,
          color: '#00d4ff'
        },
        {
          label: `Moving Average (${windowSize} points)`,
          data: movingAverage,
          color: '#7c3aed'
        }
      ]
    }, 'HRV Trends', 'ms');
  }

  private showNoDataMessage(): void {
    this.charts.forEach(chart => {
      // Clear charts
      chart.destroy();
    });
    
    const chartsGrid = this.container.querySelector('.charts-grid') as HTMLElement;
    chartsGrid.innerHTML = `
      <div class="no-data-message">
        <h4>${i18next.t('noHrvDataAvailable')}</h4>
        <p>HRV analysis requires RR interval data from compatible devices.</p>
      </div>
    `;
  }

  private subscribeToState(): void {
    this.unsubscribe = store.subscribe((state) => {
      if (state.currentData) {
        this.updateHRVMetrics();
        this.updateCharts();
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