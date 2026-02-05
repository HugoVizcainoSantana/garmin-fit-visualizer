import i18next from '@/i18n';
import { store, actions } from '@/state/store';
import { ICONS } from '@/utils/constants';

export class Header {
  private container: HTMLElement;
  private unsubscribe: (() => void) | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
    this.setupEventListeners();
    this.subscribeToState();
  }

  private render(): void {
    const currentLang = store.getState().selectedLanguage;
    
    this.container.innerHTML = `
      <header class="header">
        <div class="header-content">
          <div class="header-title">
            <h1>${i18next.t('appTitle')}</h1>
            <p>${i18next.t('appSubtitle')}</p>
          </div>
          <div class="header-controls">
            <div class="language-switcher" id="language-switcher">
              <button class="language-button" aria-label="${i18next.t('language')}" aria-expanded="false">
                <svg class="language-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="${ICONS.globe}" />
                </svg>
                <span class="current-lang">${currentLang.toUpperCase()}</span>
                <svg class="dropdown-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              <div class="language-dropdown" id="language-dropdown">
                <button class="language-option ${currentLang === 'en' ? 'active' : ''}" data-lang="en">
                  <span class="flag">🇺🇸</span>
                  <span class="name">${i18next.t('english')}</span>
                </button>
                <button class="language-option ${currentLang === 'es' ? 'active' : ''}" data-lang="es">
                  <span class="flag">🇪🇸</span>
                  <span class="name">${i18next.t('spanish')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
    `;
  }

  private setupEventListeners(): void {
    const languageButton = this.container.querySelector('.language-button') as HTMLButtonElement;
    const languageDropdown = this.container.querySelector('.language-dropdown') as HTMLElement;
    const languageOptions = this.container.querySelectorAll('.language-option');

    // Toggle dropdown
    languageButton?.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = languageButton.getAttribute('aria-expanded') === 'true';
      
      languageButton.setAttribute('aria-expanded', (!isExpanded).toString());
      languageDropdown.classList.toggle('active');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target as Node)) {
        languageButton.setAttribute('aria-expanded', 'false');
        languageDropdown.classList.remove('active');
      }
    });

    // Handle language selection
    languageOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        const lang = (option as HTMLElement).dataset.lang;
        if (lang && lang !== store.getState().selectedLanguage) {
          store.dispatch(actions.setLanguage(lang));
          i18next.changeLanguage(lang);
          this.updateLanguageDisplay(lang);
        }
        
        // Close dropdown
        languageButton.setAttribute('aria-expanded', 'false');
        languageDropdown.classList.remove('active');
      });
    });

    // Keyboard navigation
    languageButton?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        languageButton.click();
      }
    });

    // Close dropdown on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && languageDropdown.classList.contains('active')) {
        languageButton.setAttribute('aria-expanded', 'false');
        languageDropdown.classList.remove('active');
        languageButton.focus();
      }
    });
  }

  private updateLanguageDisplay(lang: string): void {
    const currentLangSpan = this.container.querySelector('.current-lang') as HTMLSpanElement;
    const languageOptions = this.container.querySelectorAll('.language-option');
    
    if (currentLangSpan) {
      currentLangSpan.textContent = lang.toUpperCase();
    }
    
    languageOptions.forEach(option => {
      const optionLang = (option as HTMLElement).dataset.lang;
      if (optionLang === lang) {
        option.classList.add('active');
      } else {
        option.classList.remove('active');
      }
    });
  }

  private subscribeToState(): void {
    this.unsubscribe = store.subscribe((state) => {
      // Re-render if language changed
      const currentLang = this.container.querySelector('.current-lang')?.textContent;
      if (currentLang !== state.selectedLanguage.toUpperCase()) {
        this.render();
        this.setupEventListeners();
      }
    });
  }

  public destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}