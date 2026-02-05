import i18next from '@/i18n';
import { store, actions } from '@/state/store';
import { validateFile } from '@/utils/formatters';
import { ICONS } from '@/utils/constants';

export class UploadZone {
  private container: HTMLElement;
  private unsubscribe: (() => void) | null = null;
  private fileInput: HTMLInputElement | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
    this.setupEventListeners();
    this.subscribeToState();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="upload-container" id="upload-container">
        <div class="upload-zone" id="upload-zone" tabindex="0" role="button" aria-label="${i18next.t('dropFileHere')}">
          <div class="upload-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="${ICONS.upload}" />
            </svg>
          </div>
          <h2>${i18next.t('dropFileHere')}</h2>
          <p>${i18next.t('orClickToBrowse')}</p>
          <input type="file" id="file-input" accept=".fit" aria-label="${i18next.t('orClickToBrowse')}" />
        </div>
      </div>
    `;
    
    this.fileInput = this.container.querySelector('#file-input') as HTMLInputElement;
  }

  private setupEventListeners(): void {
    const uploadZone = this.container.querySelector('#upload-zone') as HTMLElement;
    
    if (!uploadZone || !this.fileInput) return;

    // Click to upload
    uploadZone.addEventListener('click', () => {
      this.fileInput?.click();
    });

    // File input change
    this.fileInput.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        this.handleFile(target.files[0]);
      }
    });

    // Drag and drop events
    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('drag-over');
    });

    uploadZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      // Only remove class if leaving the upload zone
      if (!uploadZone.contains(e.relatedTarget as Node)) {
        uploadZone.classList.remove('drag-over');
      }
    });

    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('drag-over');

      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        this.handleFile(file);
      }
    });

    // Keyboard navigation
    uploadZone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.fileInput?.click();
      }
    });

    // Prevent default drag behavior on document
    document.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    document.addEventListener('drop', (e) => {
      e.preventDefault();
    });
  }

  private async handleFile(file: File): Promise<void> {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      store.dispatch(actions.setError(validation.error || 'Invalid file'));
      return;
    }

    // Add to uploaded files
    store.dispatch(actions.addUploadedFile(file));
    
    // Set loading state
    store.dispatch(actions.setLoading(true));

    try {
      // Read file as ArrayBuffer
      const arrayBuffer = await this.readFileAsArrayBuffer(file);
      
      // Import parser dynamically to avoid circular dependencies
      const { parseFitFile } = await import('@/parser/fitParser');
      
      // Parse FIT file
      const fitData = await parseFitFile(arrayBuffer);
      
      // Set data in store
      store.dispatch(actions.setData(fitData));
      
    } catch (error) {
      console.error('Error parsing FIT file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      store.dispatch(actions.setError(i18next.t('errorParsingFile', { error: errorMessage })));
    }
  }

  private readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file as ArrayBuffer'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('File reading failed'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  private subscribeToState(): void {
    this.unsubscribe = store.subscribe((state) => {
      const uploadContainer = this.container.querySelector('#upload-container') as HTMLElement;
      
      if (state.currentData) {
        // Hide upload zone when data is loaded
        uploadContainer.style.display = 'none';
      } else {
        // Show upload zone when no data
        uploadContainer.style.display = 'block';
      }
    });
  }

  public show(): void {
    const uploadContainer = this.container.querySelector('#upload-container') as HTMLElement;
    uploadContainer.style.display = 'block';
  }

  public hide(): void {
    const uploadContainer = this.container.querySelector('#upload-container') as HTMLElement;
    uploadContainer.style.display = 'none';
  }

  public reset(): void {
    if (this.fileInput) {
      this.fileInput.value = '';
    }
    this.show();
  }

  public destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}