import './styles/base.css';
import './styles/components.css';
import i18next from '@/i18n';

// Import components
import { Header } from '@/components/Header/Header';
import { UploadZone } from '@/components/UploadZone/UploadZone';
import { Loading } from '@/components/Loading/Loading';
import { ErrorMessage } from '@/components/ErrorMessage/ErrorMessage';
import { SummaryCards } from '@/components/SummaryCards/SummaryCards';
import { Tabs } from '@/components/Tabs/Tabs';
import { Overview } from '@/components/Overview/Overview';
import { RawJSON } from '@/components/RawJSON/RawJSON';

// Import state management
import { store, actions } from '@/state/store';

// Import parser
import { parseFitFile } from '@/parser/fitParser';

class App {
  private container: HTMLElement;
  private components: Map<string, any> = new Map();
  private unsubscribe: (() => void) | null = null;

  constructor() {
    this.container = document.getElementById('app') as HTMLElement;
    this.init();
  }

  private async init(): Promise<void> {
    // Initialize i18n
    await this.initI18n();
    
    // Render initial structure
    this.renderStructure();
    
    // Initialize components
    this.initComponents();
    
    // Subscribe to state changes
    this.subscribeToState();
    
    // Setup global event listeners
    this.setupGlobalEventListeners();
  }

  private initializeTabComponents(): void {
    // Initialize Overview component
    const overviewContainer = document.querySelector('#overview-panel-content') as HTMLElement;
    if (overviewContainer) {
      this.components.set('overview', new Overview(overviewContainer));
    }
    
    // Initialize RawJSON component
    const jsonContainer = document.querySelector('#json-panel-content') as HTMLElement;
    if (jsonContainer) {
      this.components.set('rawJSON', new RawJSON(jsonContainer));
    }
  }

  // Setup global event listeners
  private setupGlobalEventListeners(): void {
    // Listen for tab changes to trigger component rendering
    this.container.addEventListener('tabChanged', (e: any) => {
      const { tabId } = e.detail;
      
      // Handle different tab activations
      switch (tabId) {
        case 'hrv-analysis':
          // Import and render HRV charts
          import('@/components/Charts/HRVCharts').then(({ HRVCharts }) => {
            const container = document.querySelector('#hrv-panel-content') as HTMLElement;
            if (container && !container.hasAttribute('data-initialized')) {
              new HRVCharts(container);
              container.setAttribute('data-initialized', 'true');
            }
          });
          break;
          
        case 'overview':
          // Overview component is already initialized and reactive
          break;
          
        case 'raw-json':
          // RawJSON component is already initialized and reactive
          break;
          
        default:
          // Handle data type tabs
          this.handleDataTypeTab(tabId);
          break;
      }
    });
  }
  
  private handleDataTypeTab(tabId: string): void {
    const container = document.querySelector(`#${tabId}-panel-content`) as HTMLElement;
    if (!container || container.hasAttribute('data-initialized')) {
      return;
    }
    
    // Get data from store
    const state = store.getState();
    if (!state.currentData) {
      container.innerHTML = `<p class="no-data">${i18next.t('noDataAvailable')}</p>`;
      return;
    }
    
    // Get the data for this type
    const data = (state.currentData.raw as any)[tabId];
    if (!data || data.length === 0) {
      container.innerHTML = `<p class="no-data">${i18next.t('noDataAvailable')}</p>`;
      return;
    }
    
    // Import and create data table
    import('@/components/DataTable/DataTable').then(({ DataTable }) => {
      const dataTable = new DataTable(container);
      dataTable.setData(data, this.getDataTypeLabel(tabId));
      container.setAttribute('data-initialized', 'true');
      
      // Store component for cleanup
      this.components.set(`${tabId}-table`, dataTable);
    });
  }
  
  private getDataTypeLabel(type: string): string {
    const labelMap: { [key: string]: string } = {
      sessions: i18next.t('sessions'),
      laps: i18next.t('laps'),
      records: i18next.t('records'),
      events: i18next.t('events'),
      hrv: i18next.t('hrvDataTab'),
      hrvValue: i18next.t('hrvValues'),
      hrvStatusSummary: i18next.t('hrvStatus'),
      respirationRate: i18next.t('respirationRate'),
      stressLevel: i18next.t('stressLevel'),
      deviceInfo: i18next.t('deviceInfo'),
      userProfile: i18next.t('userProfile'),
      trainingZones: i18next.t('trainingZones'),
      workout: i18next.t('workout'),
      workoutStep: i18next.t('workoutSteps'),
      lengths: i18next.t('lengths'),
      splits: i18next.t('splits'),
      splitSummary: i18next.t('splitSummary'),
      monitoring: i18next.t('monitoring'),
      gpsMetadata: i18next.t('gpsMetadata'),
      climbPro: i18next.t('climbPro'),
      set: i18next.t('sets'),
      jump: i18next.t('jumps')
    };
    
    return labelMap[type] || type;
  }

  private async initI18n(): Promise<void> {
    const state = store.getState();
    await i18next.changeLanguage(state.selectedLanguage);
  }

  private renderStructure(): void {
    this.container.innerHTML = `
      <div class="app-container">
        <div id="header-container"></div>
        
        <div class="main-content">
          <div id="upload-container"></div>
          <div id="loading-container"></div>
          <div id="error-container"></div>
          
          <div class="data-viewer" id="data-viewer">
            <div class="file-info-bar" id="file-info-bar">
              <!-- File info will be populated dynamically -->
            </div>
            
            <div class="summary-section">
              <div id="summary-cards-container"></div>
            </div>
            
            <div class="tabs-section">
              <div id="tabs-container"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private initComponents(): void {
    // Initialize all components
    this.components.set('header', new Header(
      this.container.querySelector('#header-container') as HTMLElement
    ));
    
    this.components.set('uploadZone', new UploadZone(
      this.container.querySelector('#upload-container') as HTMLElement
    ));
    
    this.components.set('loading', new Loading(
      this.container.querySelector('#loading-container') as HTMLElement
    ));
    
    this.components.set('errorMessage', new ErrorMessage(
      this.container.querySelector('#error-container') as HTMLElement
    ));
    
    this.components.set('summaryCards', new SummaryCards(
      this.container.querySelector('#summary-cards-container') as HTMLElement
    ));
    
    this.components.set('tabs', new Tabs(
      this.container.querySelector('#tabs-container') as HTMLElement
    ));
    
    // Initialize tab content components
    this.initializeTabComponents();
  }

  private subscribeToState(): void {
    this.unsubscribe = store.subscribe((state) => {
      this.updateUI(state);
    });
    
    // Initial UI update
    this.updateUI(store.getState());
  }

  private updateUI(state: any): void {
    const dataViewer = this.container.querySelector('#data-viewer') as HTMLElement;
    const fileInfoBar = this.container.querySelector('#file-info-bar') as HTMLElement;
    
    if (state.currentData) {
      // Show data viewer
      dataViewer.classList.add('active');
      
      // Update file info bar
      this.updateFileInfoBar(state.currentData, state.uploadedFiles);
      
      // Hide upload zone
      this.components.get('uploadZone')?.hide();
    } else {
      // Hide data viewer
      dataViewer.classList.remove('active');
      
      // Show upload zone
      this.components.get('uploadZone')?.show();
    }
  }

  private updateFileInfoBar(data: any, uploadedFiles: any[]): void {
    const fileInfoBar = this.container.querySelector('#file-info-bar') as HTMLElement;
    
    if (uploadedFiles.length > 0) {
      const latestFile = uploadedFiles[uploadedFiles.length - 1];
      const summary = data.summary;
      
      fileInfoBar.innerHTML = `
        <div class="file-info">
          <div class="file-details">
            <span class="file-name">${latestFile.name}</span>
            <span class="file-size">(${this.formatFileSize(latestFile.size)})</span>
            ${summary.sport ? `<span class="sport-type">${this.getSportLabel(summary.sport)}</span>` : ''}
          </div>
          <button class="reset-button" id="reset-button" aria-label="${i18next.t('uploadAnotherFile')}">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            ${i18next.t('uploadAnotherFile')}
          </button>
        </div>
      `;
      
      // Setup reset button listener
      const resetButton = fileInfoBar.querySelector('#reset-button') as HTMLButtonElement;
      resetButton?.addEventListener('click', () => {
        this.resetApp();
      });
    } else {
      fileInfoBar.innerHTML = '';
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private getSportLabel(sport: string): string {
    const sportLabels: { [key: string]: string } = {
      running: 'Running',
      cycling: 'Cycling',
      swimming: 'Swimming',
      triathlon: 'Triathlon',
      hiking: 'Hiking',
      walking: 'Walking',
      fitness_equipment: 'Fitness Equipment',
      other: 'Other'
    };
    
    return sportLabels[sport] || sport;
  }

  

  private resetApp(): void {
    // Reset state
    store.dispatch(actions.reset());
    
    // Reset upload zone
    this.components.get('uploadZone')?.reset();
    
    // Clear any initialized chart containers
    const chartContainers = this.container.querySelectorAll('[data-initialized]');
    chartContainers.forEach(container => {
      container.removeAttribute('data-initialized');
      container.innerHTML = '';
    });
  }

  public destroy(): void {
    // Destroy all components
    this.components.forEach(component => {
      if (component.destroy) {
        component.destroy();
      }
    });
    
    // Unsubscribe from state
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    
    // Clear components map
    this.components.clear();
  }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  
  // Make app available globally for debugging
  (window as any).app = app;
});

// Export for testing
export { App };