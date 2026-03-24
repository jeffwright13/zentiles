/**
 * Theme Manager for ZenTiles
 * Central controller for theme switching, coordinating backgrounds and audio
 */

import { THEMES, DEFAULT_THEME } from './theme-config.js';
import { AudioController } from './audio-controller.js';
import { BackgroundController } from './background-controller.js';

export class ThemeManager {
    constructor() {
        this.currentThemeId = null;
        this.currentTheme = null;
        this.audioController = null;
        this.backgroundController = null;
        this.initialized = false;
        this.listeners = new Map();
    }

    /**
     * Initialize the theme manager
     */
    init(containerElement = document.body) {
        if (this.initialized) return;

        this.audioController = new AudioController();
        this.backgroundController = new BackgroundController(containerElement);
        this.initialized = true;

        // Load saved theme or default
        const savedTheme = localStorage.getItem('zentiles-theme') || DEFAULT_THEME;
        this.setTheme(savedTheme);

        // Load saved audio preferences
        const savedMuted = localStorage.getItem('zentiles-muted') === 'true';
        const savedVolume = parseFloat(localStorage.getItem('zentiles-volume') || '0.3');
        
        if (savedMuted) {
            this.audioController.toggleMute();
        }
        this.audioController.setVolume(savedVolume);
    }

    /**
     * Get all available themes
     */
    getAvailableThemes() {
        return Object.values(THEMES).map(theme => ({
            id: theme.id,
            name: theme.name,
            description: theme.description,
            primaryColor: theme.colors.primary
        }));
    }

    /**
     * Get current theme
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * Set active theme
     */
    setTheme(themeId) {
        const theme = THEMES[themeId];
        if (!theme) {
            console.warn(`Theme "${themeId}" not found. Using default.`);
            return this.setTheme(DEFAULT_THEME);
        }

        if (this.currentThemeId === themeId) return;

        this.currentThemeId = themeId;
        this.currentTheme = theme;

        // Save preference
        localStorage.setItem('zentiles-theme', themeId);

        // Apply theme to controllers
        if (this.backgroundController) {
            this.backgroundController.loadTheme(theme);
        }

        if (this.audioController) {
            this.audioController.loadTracks(theme.audio?.tracks || []);
        }

        // Apply CSS variables
        this.applyThemeColors(theme.colors);

        // Notify listeners
        this.emit('themeChange', theme);

        return theme;
    }

    /**
     * Apply theme colors as CSS variables
     */
    applyThemeColors(colors) {
        const root = document.documentElement;
        
        root.style.setProperty('--theme-primary', colors.primary);
        root.style.setProperty('--theme-secondary', colors.secondary);
        root.style.setProperty('--theme-accent', colors.accent);
        root.style.setProperty('--theme-text', colors.text);
        root.style.setProperty('--theme-text-light', colors.textLight);
        root.style.setProperty('--theme-overlay', colors.overlay);
        root.style.setProperty('--theme-card-bg', colors.cardBg);
        root.style.setProperty('--theme-card-border', colors.cardBorder);
    }

    /**
     * Start playing theme music
     */
    playMusic() {
        this.audioController?.play();
    }

    /**
     * Pause theme music
     */
    pauseMusic() {
        this.audioController?.pause();
    }

    /**
     * Toggle music mute
     */
    toggleMute() {
        const isMuted = this.audioController?.toggleMute();
        localStorage.setItem('zentiles-muted', isMuted);
        this.emit('muteChange', isMuted);
        return isMuted;
    }

    /**
     * Set music volume
     */
    setVolume(level) {
        this.audioController?.setVolume(level);
        localStorage.setItem('zentiles-volume', level.toString());
        this.emit('volumeChange', level);
    }

    /**
     * Get audio state
     */
    getAudioState() {
        return this.audioController?.getCurrentTrackInfo() || null;
    }

    /**
     * Skip to next track
     */
    nextTrack() {
        this.audioController?.playNextTrack();
    }

    /**
     * Skip to previous track
     */
    prevTrack() {
        this.audioController?.playPrevTrack();
    }

    /**
     * Set repeat mode
     */
    setRepeat(enabled) {
        this.audioController?.setRepeat(enabled);
    }

    /**
     * Seek to position in current track
     */
    seekTo(percent) {
        this.audioController?.seekTo(percent);
    }

    /**
     * Return all tracks with current state (for building UI)
     */
    getTracks() {
        return this.audioController?.getTracks() || [];
    }

    /**
     * Jump directly to a track by index
     */
    jumpToTrack(index) {
        this.audioController?.jumpToTrack(index);
    }

    /**
     * Enable or disable a track in the rotation
     */
    setTrackEnabled(index, enabled) {
        this.audioController?.setTrackEnabled(index, enabled);
    }

    /**
     * Toggle dog companion visibility
     */
    toggleDog(visible) {
        this.backgroundController?.toggleDog(visible);
    }

    /**
     * Manually cycle to next background
     */
    nextBackground() {
        this.backgroundController?.next();
    }

    /**
     * Event system - subscribe to events
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
        
        return () => this.off(event, callback);
    }

    /**
     * Event system - unsubscribe from events
     */
    off(event, callback) {
        this.listeners.get(event)?.delete(callback);
    }

    /**
     * Event system - emit event
     */
    emit(event, data) {
        this.listeners.get(event)?.forEach(callback => {
            try {
                callback(data);
            } catch (err) {
                console.error(`Error in theme event listener: ${err}`);
            }
        });
    }

    /**
     * Cleanup resources
     */
    destroy() {
        this.audioController?.stop();
        this.backgroundController?.destroy();
        this.listeners.clear();
        this.initialized = false;
    }
}

// Singleton instance
let themeManagerInstance = null;

export function getThemeManager() {
    if (!themeManagerInstance) {
        themeManagerInstance = new ThemeManager();
    }
    return themeManagerInstance;
}
