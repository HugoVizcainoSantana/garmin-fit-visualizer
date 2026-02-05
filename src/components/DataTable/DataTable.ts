import i18next from '@/i18n';
import { store } from '@/state/store';
import { formatValue, formatKey } from '@/utils/formatters';

export class DataTable {
  private container: HTMLElement;
  private unsubscribe: (() => void) | null = null;
  private data: any[] = [];
  private columns: string[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
    this.subscribeToState();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="data-table-container">
        <div class="table-header">
          <h3 class="table-title"></h3>
          <div class="table-controls">
            <span class="record-count"></span>
          </div>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead class="table-head">
              <tr class="table-row">
                <!-- Headers will be populated dynamically -->
              </tr>
            </thead>
            <tbody class="table-body">
              <!-- Rows will be populated dynamically -->
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  public setData(data: any[], title: string): void {
    this.data = data;
    this.columns = this.extractColumns(data);
    this.renderTable(title);
  }

  private extractColumns(data: any[]): string[] {
    if (!data || data.length === 0) return [];
    
    const columnSet = new Set<string>();
    data.forEach(item => {
      Object.keys(item).forEach(key => columnSet.add(key));
    });
    
    return Array.from(columnSet).sort();
  }

  private renderTable(title: string): void {
    const container = this.container.querySelector('.data-table-container') as HTMLElement;
    const titleElement = container.querySelector('.table-title') as HTMLElement;
    const countElement = container.querySelector('.record-count') as HTMLElement;
    const thead = container.querySelector('.table-head tr') as HTMLElement;
    const tbody = container.querySelector('.table-body') as HTMLElement;

    // Set title and count
    titleElement.textContent = title;
    
    const totalCount = this.data.length;
    const displayCount = Math.min(totalCount, 1000);
    
    if (totalCount > 1000) {
      countElement.textContent = i18next.t('showingFirstNOfM', { 
        first: displayCount, 
        total: totalCount 
      });
    } else {
      countElement.textContent = `${totalCount} ${i18next.t('records')}`;
    }

    // Render headers
    const headersHTML = this.columns.map(column => `
      <th class="table-header-cell">
        <span class="header-text">${formatKey(column)}</span>
        <button class="sort-button" data-column="${column}" aria-label="Sort by ${formatKey(column)}">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </button>
      </th>
    `).join('');
    
    thead.innerHTML = headersHTML;

    // Render rows (limit to 1000 for performance)
    const rowsHTML = this.data.slice(0, 1000).map((row, index) => `
      <tr class="table-row ${index % 2 === 0 ? 'even' : 'odd'}">
        ${this.columns.map(column => `
          <td class="table-cell" data-column="${column}">
            ${this.formatCellValue(row[column])}
          </td>
        `).join('')}
      </tr>
    `).join('');
    
    tbody.innerHTML = rowsHTML;

    // Setup sort listeners
    this.setupSortListeners();
  }

  private formatCellValue(value: any): string {
    if (value === null || value === undefined) {
      return '<span class="empty-value">--</span>';
    }
    
    if (value instanceof Date) {
      return value.toLocaleString();
    }
    
    if (typeof value === 'object') {
      return '<span class="object-value">Object</span>';
    }
    
    return String(value);
  }

  private setupSortListeners(): void {
    const sortButtons = this.container.querySelectorAll('.sort-button');
    
    sortButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const column = (button as HTMLElement).dataset.column;
        if (column) {
          this.sortByColumn(column);
        }
      });
    });
  }

  private sortByColumn(column: string): void {
    this.data.sort((a, b) => {
      const aVal = a[column];
      const bVal = b[column];
      
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return aVal - bVal;
      }
      
      return String(aVal).localeCompare(String(bVal));
    });
    
    // Re-render with current title
    const titleElement = this.container.querySelector('.table-title') as HTMLElement;
    this.renderTable(titleElement.textContent || '');
  }

  private subscribeToState(): void {
    this.unsubscribe = store.subscribe((state) => {
      // Update based on state changes if needed
    });
  }

  public destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}