import { store } from '@/state/store';

export class ErrorMessage {
  private container: HTMLElement;
  private unsubscribe: (() => void) | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
    this.subscribeToState();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="error-message" id="error-message">
        <div class="error-content">
          <div class="error-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div class="error-text">
            <h3>Error</h3>
            <p id="error-message-text"></p>
          </div>
          <button class="error-close" id="error-close" aria-label="Close error">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    `;
    
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const closeButton = this.container.querySelector('#error-close') as HTMLButtonElement;
    const errorMessage = this.container.querySelector('#error-message') as HTMLElement;
    
    closeButton?.addEventListener('click', () => {
      errorMessage.classList.remove('active');
      // Clear error from state
      store.dispatch({ type: 'SET_ERROR', payload: null });
    });

    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (errorMessage.classList.contains('active')) {
        errorMessage.classList.remove('active');
      }
    }, 10000);
  }

  private subscribeToState(): void {
    this.unsubscribe = store.subscribe((state) => {
      const errorMessage = this.container.querySelector('#error-message') as HTMLElement;
      const errorText = this.container.querySelector('#error-message-text') as HTMLElement;
      
      if (state.error) {
        errorText.textContent = state.error;
        errorMessage.classList.add('active');
      } else {
        errorMessage.classList.remove('active');
      }
    });
  }

  public showError(message: string): void {
    const errorMessage = this.container.querySelector('#error-message') as HTMLElement;
    const errorText = this.container.querySelector('#error-message-text') as HTMLElement;
    
    errorText.textContent = message;
    errorMessage.classList.add('active');
  }

  public hideError(): void {
    const errorMessage = this.container.querySelector('#error-message') as HTMLElement;
    errorMessage.classList.remove('active');
  }

  public destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}