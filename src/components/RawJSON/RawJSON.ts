import i18next from '@/i18n';
import { store } from '@/state/store';

export class RawJSON {
  private container: HTMLElement;
  private unsubscribe: (() => void) | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
    this.subscribeToState();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="raw-json-content">
        <div class="json-header">
          <h3>${i18next.t('rawJson')}</h3>
          <div class="json-controls">
            <button class="copy-button" id="copy-json" aria-label="Copy JSON to clipboard">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy</span>
            </button>
            <button class="download-button" id="download-json" aria-label="Download JSON file">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              <span>Download</span>
            </button>
          </div>
        </div>
        <div class="json-wrapper">
          <pre class="json-content" id="json-content"></pre>
        </div>
      </div>
    `;
    
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const copyButton = this.container.querySelector('#copy-json') as HTMLButtonElement;
    const downloadButton = this.container.querySelector('#download-json') as HTMLButtonElement;
    
    copyButton?.addEventListener('click', () => {
      this.copyToClipboard();
    });
    
    downloadButton?.addEventListener('click', () => {
      this.downloadJSON();
    });
  }

  private updateJSONContent(data: any): void {
    const jsonContent = this.container.querySelector('#json-content') as HTMLElement;
    
    if (!data) {
      jsonContent.textContent = i18next.t('noDataAvailable');
      return;
    }
    
    // Format JSON with syntax highlighting
    const jsonString = JSON.stringify(data, null, 2);
    const highlightedJSON = this.syntaxHighlight(jsonString);
    
    jsonContent.innerHTML = highlightedJSON;
  }

  private syntaxHighlight(json: string): string {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
      let cls = 'number';
      
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'key';
        } else {
          cls = 'string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'boolean';
      } else if (/null/.test(match)) {
        cls = 'null';
      }
      
      return '<span class="' + cls + '">' + match + '</span>';
    });
  }

  private async copyToClipboard(): Promise<void> {
    const jsonContent = this.container.querySelector('#json-content') as HTMLElement;
    const text = jsonContent.textContent || '';
    
    try {
      await navigator.clipboard.writeText(text);
      this.showCopyFeedback(true);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.showCopyFeedback(true);
    }
  }

  private showCopyFeedback(success: boolean): void {
    const copyButton = this.container.querySelector('#copy-json') as HTMLButtonElement;
    const originalContent = copyButton.innerHTML;
    
    if (success) {
      copyButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Copied!</span>
      `;
      copyButton.classList.add('success');
    }
    
    setTimeout(() => {
      copyButton.innerHTML = originalContent;
      copyButton.classList.remove('success');
    }, 2000);
  }

  private downloadJSON(): void {
    const jsonContent = this.container.querySelector('#json-content') as HTMLElement;
    const text = jsonContent.textContent || '';
    
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `fit-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    
    // Show download feedback
    const downloadButton = this.container.querySelector('#download-json') as HTMLButtonElement;
    const originalContent = downloadButton.innerHTML;
    
    downloadButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>Downloaded!</span>
    `;
    downloadButton.classList.add('success');
    
    setTimeout(() => {
      downloadButton.innerHTML = originalContent;
      downloadButton.classList.remove('success');
    }, 2000);
  }

  private subscribeToState(): void {
    this.unsubscribe = store.subscribe((state) => {
      if (state.currentData) {
        this.updateJSONContent(state.currentData.raw);
      } else {
        this.updateJSONContent(null);
      }
    });
  }

  public destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}