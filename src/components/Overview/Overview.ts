import i18next from '@/i18n';
import { store } from '@/state/store';
import { DataTable } from '@/components/DataTable/DataTable';
import { formatValue, formatDate } from '@/utils/formatters';

export class Overview {
  private container: HTMLElement;
  private unsubscribe: (() => void) | null = null;
  private dataTables: Map<string, DataTable> = new Map();

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
    this.subscribeToState();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="overview-content">
        <div class="overview-sections">
          <!-- Sections will be populated dynamically -->
        </div>
      </div>
    `;
  }

  private createSection(title: string, data: any, type: 'summary' | 'table' = 'summary'): HTMLElement {
    const section = document.createElement('div');
    section.className = 'overview-section';
    
    if (type === 'summary') {
      section.innerHTML = `
        <div class="section-header">
          <h3 class="section-title">${title}</h3>
          <button class="section-toggle" aria-expanded="true">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
        </div>
        <div class="section-content expanded">
          ${this.createSummaryGrid(data)}
        </div>
      `;
    } else {
      section.innerHTML = `
        <div class="section-header">
          <h3 class="section-title">${title}</h3>
          <button class="section-toggle" aria-expanded="true">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
        </div>
        <div class="section-content expanded">
          <div class="table-container" data-section="${title}"></div>
        </div>
      `;
    }

    // Setup toggle functionality
    const toggleButton = section.querySelector('.section-toggle') as HTMLButtonElement;
    const sectionContent = section.querySelector('.section-content') as HTMLElement;
    
    toggleButton?.addEventListener('click', () => {
      const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true';
      toggleButton.setAttribute('aria-expanded', (!isExpanded).toString());
      sectionContent.classList.toggle('expanded');
    });

    return section;
  }

  private createSummaryGrid(data: any): string {
    if (!data || typeof data !== 'object') {
      return `<p class="no-data">${i18next.t('noDataAvailable')}</p>`;
    }

    const items = Object.entries(data)
      .filter(([_, value]) => value !== null && value !== undefined)
      .map(([key, value]) => `
        <div class="summary-item">
          <div class="summary-label">${this.formatLabel(key)}</div>
          <div class="summary-value">${this.formatValue(value)}</div>
        </div>
      `).join('');

    return `<div class="summary-grid">${items}</div>`;
  }

  private formatLabel(key: string): string {
    const labelMap: { [key: string]: string } = {
      sport: i18next.t('sport'),
      subSport: i18next.t('subSport'),
      startTime: i18next.t('startTime'),
      totalElapsedTime: i18next.t('elapsedTime'),
      totalTimerTime: i18next.t('movingTime'),
      totalDistance: i18next.t('distance'),
      totalCalories: i18next.t('calories'),
      avgHeartRate: i18next.t('avgHeartRate'),
      maxHeartRate: i18next.t('maxHeartRate'),
      minHeartRate: i18next.t('minHeartRate'),
      avgSpeed: i18next.t('avgSpeed'),
      maxSpeed: i18next.t('maxSpeed'),
      avgCadence: i18next.t('avgCadence'),
      maxCadence: i18next.t('maxCadence'),
      avgPower: i18next.t('avgPower'),
      maxPower: i18next.t('maxPower'),
      normalizedPower: 'Normalized Power',
      trainingStressScore: 'TSS',
      intensityFactor: 'Intensity Factor',
      totalAscent: i18next.t('totalAscent'),
      totalDescent: i18next.t('totalDescent'),
      avgAltitude: i18next.t('avgAltitude'),
      avgRespirationRate: i18next.t('avgRespirationRate'),
      maxRespirationRate: i18next.t('maxRespirationRate'),
      minRespirationRate: i18next.t('minRespirationRate'),
      temperature: i18next.t('temperature'),
      totalTrainingEffect: i18next.t('trainingEffect'),
      totalAnaerobicEffect: i18next.t('anaerobicEffect'),
      rmssd: 'RMSSD',
      sdnn: 'SDNN',
      pnn50: 'pNN50',
      meanNN: 'Mean NN'
    };

    return labelMap[key] || this.formatKeyFromCamelCase(key);
  }

  private formatKeyFromCamelCase(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  private formatValue(value: any): string {
    if (value === null || value === undefined) {
      return '--';
    }

    if (value instanceof Date) {
      return formatDate(value);
    }

    if (typeof value === 'number') {
      // Format based on context
      if (value > 1000) {
        // Large numbers (distance in meters, time in seconds)
        return value.toLocaleString();
      } else if (value < 1 && value > 0) {
        // Small decimal numbers
        return value.toFixed(3);
      } else {
        // Regular numbers
        return value.toLocaleString();
      }
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    return String(value);
  }

  private organizeData(raw: any): { [section: string]: any } {
    const organized: { [section: string]: any } = {};

    // Activity info
    if (raw.session && raw.session.length > 0) {
      const session = raw.session[0];
      organized[i18next.t('activityInfo')] = {
        sport: session.sport,
        subSport: session.subSport,
        startTime: session.startTime ? new Date(session.startTime * 1000) : null
      };
    }

    // Time and distance
    if (raw.session && raw.session.length > 0) {
      const session = raw.session[0];
      organized[i18next.t('timeAndDistance')] = {
        totalElapsedTime: session.totalElapsedTime,
        totalTimerTime: session.totalTimerTime,
        totalDistance: session.totalDistance,
        totalCalories: session.totalCalories
      };
    }

    // Heart rate
    if (raw.session && raw.session.length > 0) {
      const session = raw.session[0];
      if (session.avgHeartRate || session.maxHeartRate) {
        organized[i18next.t('heartRate')] = {
          avgHeartRate: session.avgHeartRate,
          maxHeartRate: session.maxHeartRate,
          minHeartRate: session.minHeartRate
        };
      }
    }

    // Speed and pace
    if (raw.session && raw.session.length > 0) {
      const session = raw.session[0];
      if (session.avgSpeed || session.maxSpeed) {
        organized[i18next.t('speedAndPace')] = {
          avgSpeed: session.avgSpeed,
          maxSpeed: session.maxSpeed
        };
      }
    }

    // Cadence
    if (raw.session && raw.session.length > 0) {
      const session = raw.session[0];
      if (session.avgCadence || session.maxCadence) {
        organized[i18next.t('cadence')] = {
          avgCadence: session.avgCadence,
          maxCadence: session.maxCadence
        };
      }
    }

    // Power
    if (raw.session && raw.session.length > 0) {
      const session = raw.session[0];
      if (session.avgPower || session.maxPower) {
        organized[i18next.t('power')] = {
          avgPower: session.avgPower,
          maxPower: session.maxPower,
          normalizedPower: session.normalizedPower,
          trainingStressScore: session.trainingStressScore,
          intensityFactor: session.intensityFactor
        };
      }
    }

    // Altitude
    if (raw.session && raw.session.length > 0) {
      const session = raw.session[0];
      if (session.totalAscent || session.totalDescent || session.avgAltitude) {
        organized[i18next.t('altitude')] = {
          totalAscent: session.totalAscent,
          totalDescent: session.totalDescent,
          avgAltitude: session.avgAltitude
        };
      }
    }

    // Respiration
    if (raw.respirationRate && raw.respirationRate.length > 0) {
      const respRates = raw.respirationRate;
      organized[i18next.t('respiration')] = {
        avgRespirationRate: respRates.reduce((sum: number, r: any) => sum + (r.respirationRate || 0), 0) / respRates.length,
        maxRespirationRate: Math.max(...respRates.map((r: any) => r.respirationRate || 0)),
        minRespirationRate: Math.min(...respRates.map((r: any) => r.respirationRate || 0))
      };
    }

    // Temperature
    if (raw.record && raw.record.length > 0) {
      const temperatures = raw.record.map((r: any) => r.temperature).filter((t: any) => t !== null && t !== undefined);
      if (temperatures.length > 0) {
        organized[i18next.t('temperature')] = {
          temperature: temperatures.reduce((sum: number, t: number) => sum + t, 0) / temperatures.length
        };
      }
    }

    // Training effect
    if (raw.session && raw.session.length > 0) {
      const session = raw.session[0];
      if (session.totalTrainingEffect || session.totalAnaerobicEffect) {
        organized[i18next.t('trainingEffect')] = {
          totalTrainingEffect: session.totalTrainingEffect,
          totalAnaerobicEffect: session.totalAnaerobicEffect
        };
      }
    }

    // HRV data
    if (raw.hrvValue && raw.hrvValue.length > 0) {
      organized[i18next.t('hrvData')] = {
        hrvRecords: raw.hrvValue.length,
        rmssd: this.calculateHRVMetrics(raw.hrvValue).rmssd,
        sdnn: this.calculateHRVMetrics(raw.hrvValue).sdnn,
        pnn50: this.calculateHRVMetrics(raw.hrvValue).pnn50,
        meanNN: this.calculateHRVMetrics(raw.hrvValue).meanNN
      };
    }

    return organized;
  }

  private calculateHRVMetrics(hrvValues: any[]): any {
    const rrIntervals: number[] = [];
    
    hrvValues.forEach(hrv => {
      if (hrv.time && hrv.time > 0) {
        rrIntervals.push(hrv.time);
      }
    });

    if (rrIntervals.length < 2) {
      return { rmssd: 0, sdnn: 0, pnn50: 0, meanNN: 0 };
    }

    const nnIntervals: number[] = [];
    for (let i = 1; i < rrIntervals.length; i++) {
      nnIntervals.push(Math.abs(rrIntervals[i] - rrIntervals[i - 1]));
    }

    const sumSquares = nnIntervals.reduce((sum, nn) => sum + nn * nn, 0);
    const rmssd = Math.sqrt(sumSquares / nnIntervals.length);

    const meanNN = rrIntervals.reduce((sum, rr) => sum + rr, 0) / rrIntervals.length;
    const variance = rrIntervals.reduce((sum, rr) => sum + Math.pow(rr - meanNN, 2), 0) / rrIntervals.length;
    const sdnn = Math.sqrt(variance);

    const nn50 = nnIntervals.filter(nn => nn > 50).length;
    const pnn50 = (nn50 / nnIntervals.length) * 100;

    return {
      rmssd: Math.round(rmssd),
      sdnn: Math.round(sdnn),
      pnn50: Math.round(pnn50 * 10) / 10,
      meanNN: Math.round(meanNN)
    };
  }

  private subscribeToState(): void {
    this.unsubscribe = store.subscribe((state) => {
      if (state.currentData) {
        this.updateOverview(state.currentData.raw);
      } else {
        this.clearOverview();
      }
    });
  }

  private updateOverview(raw: any): void {
    const sectionsContainer = this.container.querySelector('.overview-sections') as HTMLElement;
    sectionsContainer.innerHTML = '';

    const organizedData = this.organizeData(raw);

    Object.entries(organizedData).forEach(([title, data]) => {
      const section = this.createSection(title, data, 'summary');
      sectionsContainer.appendChild(section);
    });

    // Add data tables for larger datasets
    if (raw.record && raw.record.length > 0) {
      const recordsSection = this.createSection(i18next.t('records'), raw.record, 'table');
      sectionsContainer.appendChild(recordsSection);
      
      const tableContainer = recordsSection.querySelector('.table-container') as HTMLElement;
      const dataTable = new DataTable(tableContainer);
      dataTable.setData(raw.record, i18next.t('records'));
      this.dataTables.set('records', dataTable);
    }

    if (raw.lap && raw.lap.length > 0) {
      const lapsSection = this.createSection(i18next.t('laps'), raw.lap, 'table');
      sectionsContainer.appendChild(lapsSection);
      
      const tableContainer = lapsSection.querySelector('.table-container') as HTMLElement;
      const dataTable = new DataTable(tableContainer);
      dataTable.setData(raw.lap, i18next.t('laps'));
      this.dataTables.set('laps', dataTable);
    }
  }

  private clearOverview(): void {
    const sectionsContainer = this.container.querySelector('.overview-sections') as HTMLElement;
    sectionsContainer.innerHTML = `<p class="no-data">${i18next.t('noDataAvailable')}</p>`;
    
    // Destroy data tables
    this.dataTables.forEach(table => table.destroy());
    this.dataTables.clear();
  }

  public destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    
    // Destroy data tables
    this.dataTables.forEach(table => table.destroy());
    this.dataTables.clear();
  }
}