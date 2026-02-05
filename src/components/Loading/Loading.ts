import i18next from '@/i18n';
import { store } from '@/state/store';

export class Loading {
  private container: HTMLElement;
  private unsubscribe: (() => void) | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
    this.subscribeToState();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="loading" id="loading">
        <div class="spinner">
          <div class="spinner-circle"></div>
          <div class="spinner-circle"></div>
          <div class="spinner-circle"></div>
        </div>
        <p>${i18next.t('parsingFile')}</p>
      </div>
    `;
  }

  private subscribeToState(): void {
    this.unsubscribe = store.subscribe((state) => {
      const loadingElement = this.container.querySelector('#loading') as HTMLElement;
      
      if (state.isLoading) {
        loadingElement.classList.add('active');
      } else {
        loadingElement.classList.remove('active');
      }
    });
  }

  public show(): void {
    const loadingElement = this.container.querySelector('#loading') as HTMLElement;
    loadingElement.classList.add('active');
  }

  public hide(): void {
    const loadingElement = this.container.querySelector('#loading') as HTMLElement;
    loadingElement.classList.remove('active');
  }

  public destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}