/**
 * Background Controller for ZenTiles Theme System
 * Handles background image transitions
 */

import { BACKGROUND_CONFIG } from './theme-config.js';

export class BackgroundController {
    constructor(containerElement) {
        this.container = containerElement;
        this.backgrounds = [];
        this.currentIndex = 0;
        this.transitionTimer = null;
        this.transitionDuration = 15000;
        this.layers = [];
        this.isTransitioning = false;
        
        this.init();
    }

    /**
     * Initialize background layers
     */
    init() {
        // Create two background layers for crossfade effect
        for (let i = 0; i < 2; i++) {
            const layer = document.createElement('div');
            layer.className = 'background-layer';
            layer.style.cssText = `
                position: fixed;
                top: -20px;
                left: -20px;
                width: calc(100% + 40px);
                height: calc(100% + 40px);
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
                transition: opacity ${BACKGROUND_CONFIG.transitionDuration}ms ease-in-out;
                opacity: ${i === 0 ? 1 : 0};
                z-index: -2;
                filter: blur(8px);
            `;
            this.container.appendChild(layer);
            this.layers.push(layer);
        }

        // Create overlay layer
        this.overlayLayer = document.createElement('div');
        this.overlayLayer.className = 'background-overlay';
        this.overlayLayer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            transition: background-color 1s ease-in-out;
        `;
        this.container.appendChild(this.overlayLayer);

    }

    /**
     * Load backgrounds for current theme
     */
    loadTheme(theme) {
        this.stopTransitions();
        this.backgrounds = theme.backgrounds || [];
        this.transitionDuration = theme.transitionDuration || 15000;
        this.currentIndex = 0;

        // Set overlay color
        if (theme.colors?.overlay) {
            this.overlayLayer.style.backgroundColor = theme.colors.overlay;
        }

        // Preload images
        this.preloadImages();

        // Show first background
        if (this.backgrounds.length > 0) {
            this.showBackground(0, true);
        }

        // Start auto-transition
        this.startTransitions();
    }

    /**
     * Preload background images
     */
    preloadImages() {
        const preloadCount = Math.min(BACKGROUND_CONFIG.preloadCount, this.backgrounds.length);
        
        for (let i = 0; i < preloadCount; i++) {
            const img = new Image();
            img.src = this.backgrounds[i].url;
        }
    }

    /**
     * Show a specific background
     */
    showBackground(index, immediate = false) {
        if (this.backgrounds.length === 0) return;
        if (this.isTransitioning && !immediate) return;

        this.isTransitioning = true;
        const activeLayer = this.layers[0];
        const inactiveLayer = this.layers[1];
        
        const bg = this.backgrounds[index];
        
        // Set new background on inactive layer (supports both gradients and image URLs)
        if (bg.gradient) {
            inactiveLayer.style.backgroundImage = bg.gradient;
        } else if (bg.url) {
            inactiveLayer.style.backgroundImage = `url('${bg.url}')`;
        }
        
        if (immediate) {
            activeLayer.style.opacity = '0';
            inactiveLayer.style.opacity = '1';
            this.layers = [inactiveLayer, activeLayer];
            this.isTransitioning = false;
        } else {
            // Trigger transition
            requestAnimationFrame(() => {
                inactiveLayer.style.opacity = '1';
                activeLayer.style.opacity = '0';
                
                // Swap layers after transition
                setTimeout(() => {
                    this.layers = [inactiveLayer, activeLayer];
                    this.isTransitioning = false;
                }, BACKGROUND_CONFIG.transitionDuration);
            });
        }
    }

    /**
     * Start automatic background transitions
     */
    startTransitions() {
        this.stopTransitions();
        
        if (this.backgrounds.length <= 1) return;

        this.transitionTimer = setInterval(() => {
            this.currentIndex = (this.currentIndex + 1) % this.backgrounds.length;
            this.showBackground(this.currentIndex);
        }, this.transitionDuration);
    }

    /**
     * Stop automatic transitions
     */
    stopTransitions() {
        if (this.transitionTimer) {
            clearInterval(this.transitionTimer);
            this.transitionTimer = null;
        }
    }

    /**
     * Manually transition to next background
     */
    next() {
        this.currentIndex = (this.currentIndex + 1) % this.backgrounds.length;
        this.showBackground(this.currentIndex);
        
        // Reset timer
        this.startTransitions();
    }

    /**
     * Manually transition to previous background
     */
    previous() {
        this.currentIndex = (this.currentIndex - 1 + this.backgrounds.length) % this.backgrounds.length;
        this.showBackground(this.currentIndex);
        
        // Reset timer
        this.startTransitions();
    }

    /**
     * Update overlay color
     */
    setOverlayColor(color) {
        if (this.overlayLayer) {
            this.overlayLayer.style.backgroundColor = color;
        }
    }

    /**
     * Cleanup resources
     */
    destroy() {
        this.stopTransitions();
        
        this.layers.forEach(layer => layer.remove());
        this.overlayLayer?.remove();
        
        this.layers = [];
    }
}
