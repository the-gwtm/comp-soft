import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class ThemeService {
    private renderer: Renderer2;
    private readonly darkClass = 'dark';

    constructor(rendererFactory: RendererFactory2) {
        this.renderer = rendererFactory.createRenderer(null, null);
        const saved = localStorage.getItem('theme');
        if (saved === 'dark') {
            this.enableDark();
        }
    }

    toggleTheme(): void {
        if (document.body.classList.contains(this.darkClass)) {
            this.disableDark();
        } else {
            this.enableDark();
        }
    }

    isDark(): boolean {
        return document.body.classList.contains(this.darkClass);
    }

    private enableDark(): void {
        this.renderer.addClass(document.body, this.darkClass);
        localStorage.setItem('theme', 'dark');
    }

    private disableDark(): void {
        this.renderer.removeClass(document.body, this.darkClass);
        localStorage.setItem('theme', 'light');
    }
}
