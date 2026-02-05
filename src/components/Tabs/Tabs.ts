import i18next from '@/i18n';
import { store, actions } from '@/state/store';
import { DATA_TYPE_CONFIG } from '@/utils/constants';

interface TabConfig {
  id: string;
  label: string;
  icon: string;
  panel: string;
  enabled: boolean;
}

export class Tabs {
  private container: HTMLElement;
  private unsubscribe: (() => void) | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
    this.setupEventListeners();
    this.subscribeToState();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="tabs-container">
        <div class="tab-buttons" id="tab-buttons" role="tablist">
          <!-- Tab buttons will be populated dynamically -->
        </div>
        <div class="tab-panels" id="tab-panels">
          <!-- Tab panels will be populated dynamically -->
        </div>
      </div>
    `;
  }

  private generateTabs(dataTypes: string[]): TabConfig[] {
    const tabs: TabConfig[] = [];
    
    // Always include Overview tab
    tabs.push({
      id: 'overview',
      label: i18next.t('overview'),
      icon: 'info',
      panel: 'overview-panel',
      enabled: true
    });

    // Add HRV Analysis tab if HRV data is available
    if (dataTypes.includes('hrv') || dataTypes.includes('hrvValue')) {
      tabs.push({
        id: 'hrv-analysis',
        label: i18next.t('hrvAnalysis'),
        icon: 'heart',
        panel: 'hrv-panel',
        enabled: true
      });
    }

    // Add data type tabs based on available data
    const dataTypeTabs = dataTypes
      .filter(type => !['hrv', 'hrvValue'].includes(type))
      .map(type => ({
        id: type,
        label: this.getDataTypeLabel(type),
        icon: this.getDataTypeIcon(type),
        panel: `${type}-panel`,
        enabled: true
      }));

    tabs.push(...dataTypeTabs);

    // Always include Raw JSON tab
    tabs.push({
      id: 'raw-json',
      label: i18next.t('rawJson'),
      icon: 'code',
      panel: 'json-panel',
      enabled: true
    });

    return tabs;
  }

  private getDataTypeLabel(type: string): string {
    const config = (DATA_TYPE_CONFIG as any)[type];
    if (config && config.label) {
      return config.label;
    }
    
    // Fallback to formatted key
    return type
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  private getDataTypeIcon(type: string): string {
    const config = (DATA_TYPE_CONFIG as any)[type];
    if (config && config.icon) {
      return config.icon;
    }
    
    // Default icon
    return 'info';
  }

  private renderTabs(tabs: TabConfig[]): void {
    const tabButtonsContainer = this.container.querySelector('#tab-buttons') as HTMLElement;
    const tabPanelsContainer = this.container.querySelector('#tab-panels') as HTMLElement;
    
    if (tabs.length === 0) {
      tabButtonsContainer.innerHTML = '<p class="no-tabs">' + i18next.t('noDataAvailable') + '</p>';
      tabPanelsContainer.innerHTML = '';
      return;
    }

    // Render tab buttons
    const tabButtonsHTML = tabs.map((tab, index) => `
      <button 
        class="tab-button ${tab.enabled ? 'enabled' : 'disabled'} ${index === 0 ? 'active' : ''}" 
        data-tab="${tab.id}"
        role="tab"
        aria-selected="${index === 0 ? 'true' : 'false'}"
        aria-controls="${tab.panel}"
        id="tab-${tab.id}"
        ${!tab.enabled ? 'disabled' : ''}
      >
        <svg class="tab-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="${this.getIconPath(tab.icon)}" />
        </svg>
        <span class="tab-label">${tab.label}</span>
      </button>
    `).join('');

    tabButtonsContainer.innerHTML = tabButtonsHTML;

    // Render tab panels
    const tabPanelsHTML = tabs.map((tab, index) => `
      <div 
        class="tab-panel ${index === 0 ? 'active' : ''}" 
        data-panel="${tab.id}"
        role="tabpanel"
        aria-labelledby="tab-${tab.id}"
        id="${tab.panel}"
        ${index !== 0 ? 'hidden' : ''}
      >
        <div class="panel-content" id="${tab.panel}-content">
          <!-- Content will be populated by specific components -->
        </div>
      </div>
    `).join('');

    tabPanelsContainer.innerHTML = tabPanelsHTML;
  }

  private getIconPath(iconName: string): string {
    const iconPaths: { [key: string]: string } = {
      info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      heart: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
      clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      route: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
      speed: 'M13 10V3L4 14h7v7l9-11h-7z',
      power: 'M11.584 2.376a.75.75 0 01.832 0l6 4a.75.75 0 010 1.248l-6 4a.75.75 0 01-.832 0l-6-4a.75.75 0 010-1.248l6-4z',
      cadence: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
      elevation: 'M12 2C8 2 4 6 4 10s2 6 2 6l6 8 6-8s2-2 2-6-4-8-8-8z',
      respiration: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z',
      training: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      code: 'M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5',
      warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
      globe: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9'
    };
    
    return iconPaths[iconName] || iconPaths.info;
  }

  private setupEventListeners(): void {
    const tabButtonsContainer = this.container.querySelector('#tab-buttons') as HTMLElement;
    
    tabButtonsContainer.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const tabButton = target.closest('.tab-button') as HTMLButtonElement;
      
      if (tabButton && !tabButton.disabled) {
        this.switchTab(tabButton.dataset.tab);
      }
    });

    // Keyboard navigation
    tabButtonsContainer.addEventListener('keydown', (e) => {
      const target = e.target as HTMLElement;
      const tabButton = target.closest('.tab-button') as HTMLButtonElement;
      
      if (!tabButton) return;
      
      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (!tabButton.disabled) {
            this.switchTab(tabButton.dataset.tab);
          }
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          this.focusPreviousTab(tabButton);
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          this.focusNextTab(tabButton);
          break;
        case 'Home':
          e.preventDefault();
          this.focusFirstTab();
          break;
        case 'End':
          e.preventDefault();
          this.focusLastTab();
          break;
      }
    });
  }

  private switchTab(tabId?: string): void {
    if (!tabId) return;
    
    const tabButtons = this.container.querySelectorAll('.tab-button');
    const tabPanels = this.container.querySelectorAll('.tab-panel');
    
    // Update button states
    tabButtons.forEach(button => {
      const isActive = button.dataset.tab === tabId;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-selected', isActive.toString());
    });
    
    // Update panel states
    tabPanels.forEach(panel => {
      const isActive = panel.dataset.panel === tabId;
      panel.classList.toggle('active', isActive);
      panel.hidden = !isActive;
    });
    
    // Update state
    store.dispatch(actions.setActiveTab(tabId));
    
    // Trigger custom event for other components
    this.container.dispatchEvent(new CustomEvent('tabChanged', { 
      detail: { tabId } 
    }));
  }

  private focusPreviousTab(currentTab: HTMLButtonElement): void {
    const tabButtons = Array.from(this.container.querySelectorAll('.tab-button:not(:disabled)')) as HTMLButtonElement[];
    const currentIndex = tabButtons.indexOf(currentTab);
    const previousIndex = currentIndex > 0 ? currentIndex - 1 : tabButtons.length - 1;
    tabButtons[previousIndex].focus();
  }

  private focusNextTab(currentTab: HTMLButtonElement): void {
    const tabButtons = Array.from(this.container.querySelectorAll('.tab-button:not(:disabled)')) as HTMLButtonElement[];
    const currentIndex = tabButtons.indexOf(currentTab);
    const nextIndex = currentIndex < tabButtons.length - 1 ? currentIndex + 1 : 0;
    tabButtons[nextIndex].focus();
  }

  private focusFirstTab(): void {
    const firstTab = this.container.querySelector('.tab-button:not(:disabled)') as HTMLButtonElement;
    if (firstTab) {
      firstTab.focus();
    }
  }

  private focusLastTab(): void {
    const tabButtons = this.container.querySelectorAll('.tab-button:not(:disabled)') as NodeListOf<HTMLButtonElement>;
    const lastTab = tabButtons[tabButtons.length - 1];
    if (lastTab) {
      lastTab.focus();
    }
  }

  private subscribeToState(): void {
    this.unsubscribe = store.subscribe((state) => {
      if (state.currentData) {
        const tabs = this.generateTabs(state.currentData.availableDataTypes);
        this.renderTabs(tabs);
        
        // Restore active tab from state
        if (state.activeTab) {
          this.switchTab(state.activeTab);
        }
      } else {
        const tabButtonsContainer = this.container.querySelector('#tab-buttons') as HTMLElement;
        const tabPanelsContainer = this.container.querySelector('#tab-panels') as HTMLElement;
        tabButtonsContainer.innerHTML = '';
        tabPanelsContainer.innerHTML = '';
      }
    });
  }

  public getActiveTab(): string | null {
    const activeButton = this.container.querySelector('.tab-button.active') as HTMLButtonElement;
    return activeButton?.dataset.tab || null;
  }

  public destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}