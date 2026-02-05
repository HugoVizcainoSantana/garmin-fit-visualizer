import { AppState, StateAction, FitData } from '@/types/app';

class StateStore {
  private state: AppState;
  private subscribers: Set<(state: AppState) => void>;
  private storageKey = 'garmin-fit-viewer-state';

  constructor() {
    this.state = this.getInitialState();
    this.subscribers = new Set();
    this.loadFromStorage();
  }

  private getInitialState(): AppState {
    return {
      currentData: null,
      isLoading: false,
      error: null,
      selectedLanguage: 'en',
      activeTab: 'overview',
      comparisonData: [],
      uploadedFiles: []
    };
  }

  public getState(): AppState {
    return { ...this.state };
  }

  public dispatch(action: StateAction): void {
    const prevState = { ...this.state };
    
    switch (action.type) {
      case 'SET_LOADING':
        this.state.isLoading = action.payload;
        break;
        
      case 'SET_ERROR':
        this.state.error = action.payload;
        this.state.isLoading = false;
        break;
        
      case 'SET_DATA':
        this.state.currentData = action.payload;
        this.state.isLoading = false;
        this.state.error = null;
        break;
        
      case 'SET_LANGUAGE':
        this.state.selectedLanguage = action.payload;
        this.saveToStorage();
        break;
        
      case 'SET_ACTIVE_TAB':
        this.state.activeTab = action.payload;
        break;
        
      case 'ADD_COMPARISON_DATA':
        this.state.comparisonData.push(action.payload);
        break;
        
      case 'REMOVE_COMPARISON_DATA':
        this.state.comparisonData = this.state.comparisonData.filter(
          (_, index) => index !== action.payload
        );
        break;
        
      case 'CLEAR_COMPARISON_DATA':
        this.state.comparisonData = [];
        break;
        
      case 'ADD_UPLOADED_FILE':
        this.state.uploadedFiles.push(action.payload);
        break;
        
      case 'RESET':
        this.state = this.getInitialState();
        this.saveToStorage();
        break;
        
      default:
        console.warn(`Unknown action type: ${action.type}`);
        return;
    }
    
    // Notify subscribers of state change
    this.notifySubscribers();
  }

  public subscribe(callback: (state: AppState) => void): () => void {
    this.subscribers.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback(this.getState()));
  }

  private saveToStorage(): void {
    try {
      const stateToSave = {
        selectedLanguage: this.state.selectedLanguage,
        // Don't save large data objects to localStorage
      };
      localStorage.setItem(this.storageKey, JSON.stringify(stateToSave));
    } catch (error) {
      console.warn('Failed to save state to localStorage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const savedState = localStorage.getItem(this.storageKey);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        this.state.selectedLanguage = parsed.selectedLanguage || 'en';
      }
    } catch (error) {
      console.warn('Failed to load state from localStorage:', error);
    }
  }
}

// Create singleton instance
export const store = new StateStore();

// Action creators
export const actions = {
  setLoading: (isLoading: boolean): StateAction => ({
    type: 'SET_LOADING',
    payload: isLoading
  }),
  
  setError: (error: string | null): StateAction => ({
    type: 'SET_ERROR',
    payload: error
  }),
  
  setData: (data: FitData): StateAction => ({
    type: 'SET_DATA',
    payload: data
  }),
  
  setLanguage: (language: string): StateAction => ({
    type: 'SET_LANGUAGE',
    payload: language
  }),
  
  setActiveTab: (tab: string): StateAction => ({
    type: 'SET_ACTIVE_TAB',
    payload: tab
  }),
  
  addComparisonData: (data: FitData): StateAction => ({
    type: 'ADD_COMPARISON_DATA',
    payload: data
  }),
  
  removeComparisonData: (index: number): StateAction => ({
    type: 'REMOVE_COMPARISON_DATA',
    payload: index
  }),
  
  clearComparisonData: (): StateAction => ({
    type: 'CLEAR_COMPARISON_DATA'
  }),
  
  addUploadedFile: (file: File): StateAction => ({
    type: 'ADD_UPLOADED_FILE',
    payload: {
      file,
      name: file.name,
      size: file.size,
      type: file.type
    }
  }),
  
  reset: (): StateAction => ({
    type: 'RESET'
  })
};