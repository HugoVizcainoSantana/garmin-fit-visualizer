import i18next from '@/i18n';
import { store } from '@/state/store';
import { ActivitySummary } from '@/types/fit';
import { formatDuration, formatDistance, formatPace, formatValue } from '@/utils/formatters';
import { ICONS, TOOLTIP_CONTENT } from '@/utils/constants';

interface SummaryCard {
  label: string;
  value: string;
  unit?: string;
  icon: string;
  tooltip: string;
  enabled: boolean;
}

export class SummaryCards {
  private container: HTMLElement;
  private unsubscribe: (() => void) | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
    this.subscribeToState();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="summary-cards" id="summary-cards">
        <!-- Cards will be populated dynamically -->
      </div>
    `;
  }

  private generateCards(summary: ActivitySummary): SummaryCard[] {
    const cards: SummaryCard[] = [];

    // Duration
    if (summary.totalElapsedTime !== undefined) {
      cards.push({
        label: i18next.t('duration'),
        value: formatDuration(summary.totalElapsedTime),
        icon: ICONS.clock,
        tooltip: i18next.t('tooltip_duration'),
        enabled: true
      });
    }

    // Distance
    if (summary.totalDistance !== undefined) {
      cards.push({
        label: i18next.t('distance'),
        value: formatDistance(summary.totalDistance),
        unit: i18next.t('kilometers'),
        icon: ICONS.route,
        tooltip: i18next.t('tooltip_distance'),
        enabled: true
      });
    }

    // Calories
    if (summary.totalCalories !== undefined) {
      cards.push({
        label: i18next.t('calories'),
        value: formatValue(summary.totalCalories),
        unit: i18next.t('caloriesUnit'),
        icon: ICONS.fire,
        tooltip: i18next.t('tooltip_calories'),
        enabled: true
      });
    }

    // Heart Rate
    if (summary.avgHeartRate !== undefined) {
      cards.push({
        label: i18next.t('avgHeartRate'),
        value: formatValue(summary.avgHeartRate),
        unit: i18next.t('beatsPerMinute'),
        icon: ICONS.heart,
        tooltip: i18next.t('tooltip_avgHeartRate'),
        enabled: true
      });
    }

    // Max Heart Rate
    if (summary.maxHeartRate !== undefined) {
      cards.push({
        label: i18next.t('maxHeartRate'),
        value: formatValue(summary.maxHeartRate),
        unit: i18next.t('beatsPerMinute'),
        icon: ICONS.heart,
        tooltip: i18next.t('tooltip_maxHeartRate'),
        enabled: true
      });
    }

    // Average Pace
    if (summary.avgPace !== undefined) {
      cards.push({
        label: i18next.t('avgPace'),
        value: formatPace(1 / summary.avgPace), // Convert back to speed for formatting
        unit: i18next.t('minutesPerKilometer'),
        icon: ICONS.speed,
        tooltip: i18next.t('tooltip_avgPace'),
        enabled: true
      });
    }

    // Average Speed
    if (summary.avgSpeed !== undefined) {
      cards.push({
        label: i18next.t('avgSpeed'),
        value: formatValue(summary.avgSpeed * 3.6), // Convert m/s to km/h
        unit: 'km/h',
        icon: ICONS.speed,
        tooltip: i18next.t('tooltip_avgSpeed'),
        enabled: true
      });
    }

    // Max Speed
    if (summary.maxSpeed !== undefined) {
      cards.push({
        label: i18next.t('maxSpeed'),
        value: formatValue(summary.maxSpeed * 3.6), // Convert m/s to km/h
        unit: 'km/h',
        icon: ICONS.speed,
        tooltip: i18next.t('tooltip_maxSpeed'),
        enabled: true
      });
    }

    // Average Cadence
    if (summary.avgCadence !== undefined) {
      cards.push({
        label: i18next.t('avgCadence'),
        value: formatValue(summary.avgCadence),
        unit: i18next.t('stepsPerMinute'),
        icon: ICONS.cadence,
        tooltip: i18next.t('tooltip_avgCadence'),
        enabled: true
      });
    }

    // Max Cadence
    if (summary.maxCadence !== undefined) {
      cards.push({
        label: i18next.t('maxCadence'),
        value: formatValue(summary.maxCadence),
        unit: i18next.t('stepsPerMinute'),
        icon: ICONS.cadence,
        tooltip: i18next.t('tooltip_maxCadence'),
        enabled: true
      });
    }

    // Average Power
    if (summary.avgPower !== undefined) {
      cards.push({
        label: i18next.t('avgPower'),
        value: formatValue(summary.avgPower),
        unit: i18next.t('watts'),
        icon: ICONS.power,
        tooltip: i18next.t('tooltip_avgPower'),
        enabled: true
      });
    }

    // Max Power
    if (summary.maxPower !== undefined) {
      cards.push({
        label: i18next.t('maxPower'),
        value: formatValue(summary.maxPower),
        unit: i18next.t('watts'),
        icon: ICONS.power,
        tooltip: i18next.t('tooltip_maxPower'),
        enabled: true
      });
    }

    // Elevation Gain
    if (summary.totalAscent !== undefined) {
      cards.push({
        label: i18next.t('elevationGain'),
        value: formatValue(summary.totalAscent),
        unit: i18next.t('meters'),
        icon: ICONS.elevation,
        tooltip: i18next.t('tooltip_totalAscent'),
        enabled: true
      });
    }

    // Average Respiration
    if (summary.avgRespirationRate !== undefined) {
      cards.push({
        label: i18next.t('avgRespiration'),
        value: formatValue(summary.avgRespirationRate),
        unit: i18next.t('breathsPerMinute'),
        icon: ICONS.respiration,
        tooltip: i18next.t('tooltip_avgRespirationRate'),
        enabled: true
      });
    }

    // HRV Records
    if (summary.hrvRecords !== undefined) {
      cards.push({
        label: i18next.t('hrvRecords'),
        value: formatValue(summary.hrvRecords),
        icon: ICONS.hrv,
        tooltip: i18next.t('tooltip_hrv'),
        enabled: true
      });
    }

    // Training Effect
    if (summary.totalTrainingEffect !== undefined) {
      cards.push({
        label: i18next.t('trainingEffect'),
        value: formatValue(summary.totalTrainingEffect),
        icon: ICONS.training,
        tooltip: i18next.t('tooltip_trainingEffect'),
        enabled: true
      });
    }

    return cards;
  }

  private renderCards(cards: SummaryCard[]): void {
    const container = this.container.querySelector('#summary-cards') as HTMLElement;
    
    if (cards.length === 0) {
      container.innerHTML = '<p class="no-data">' + i18next.t('noDataAvailable') + '</p>';
      return;
    }

    const cardsHTML = cards.map(card => `
      <div class="summary-card ${card.enabled ? 'enabled' : 'disabled'}" data-tooltip="${card.tooltip}">
        <div class="card-icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="${card.icon}" />
          </svg>
        </div>
        <div class="card-content">
          <div class="card-value">${card.value}</div>
          <div class="card-label">${card.label}</div>
          ${card.unit ? `<div class="card-unit">${card.unit}</div>` : ''}
        </div>
      </div>
    `).join('');

    container.innerHTML = cardsHTML;
    
    // Setup tooltip listeners
    this.setupTooltips();
  }

  private setupTooltips(): void {
    const cards = this.container.querySelectorAll('.summary-card[data-tooltip]');
    
    cards.forEach(card => {
      card.addEventListener('mouseenter', (e) => {
        this.showTooltip(e.target as HTMLElement, card.getAttribute('data-tooltip') || '');
      });
      
      card.addEventListener('mouseleave', () => {
        this.hideTooltip();
      });
      
      // Keyboard accessibility
      card.addEventListener('focus', (e) => {
        this.showTooltip(e.target as HTMLElement, card.getAttribute('data-tooltip') || '');
      });
      
      card.addEventListener('blur', () => {
        this.hideTooltip();
      });
    });
  }

  private showTooltip(element: HTMLElement, text: string): void {
    // Remove existing tooltip
    this.hideTooltip();
    
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip active';
    tooltip.textContent = text;
    
    document.body.appendChild(tooltip);
    
    // Position tooltip
    const rect = element.getBoundingClientRect();
    tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
    tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
  }

  private hideTooltip(): void {
    const existingTooltip = document.querySelector('.tooltip.active');
    if (existingTooltip) {
      existingTooltip.remove();
    }
  }

  private subscribeToState(): void {
    this.unsubscribe = store.subscribe((state) => {
      if (state.currentData) {
        const cards = this.generateCards(state.currentData.summary);
        this.renderCards(cards);
      } else {
        const container = this.container.querySelector('#summary-cards') as HTMLElement;
        container.innerHTML = '';
      }
    });
  }

  public update(summary: ActivitySummary): void {
    const cards = this.generateCards(summary);
    this.renderCards(cards);
  }

  public destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}