/**
 * Audio Controller for ZenTiles Theme System
 * Handles ambient music playback with smooth transitions
 */

import { AUDIO_CONFIG } from './theme-config.js';

export class AudioController {
    constructor() {
        this.currentAudio = null;
        this.nextAudio = null;
        this.currentTrackIndex = 0;
        this.tracks = [];
        this.isPlaying = false;
        this.isMuted = false;
        this.volume = AUDIO_CONFIG.defaultVolume;
        this.fadeInterval = null;
        this.trackEndHandler = null;
    }

    /**
     * Load tracks for the current theme
     */
    loadTracks(themeTracks) {
        this.stop();
        this.tracks = themeTracks || [];
        this.currentTrackIndex = 0;
        
        if (this.tracks.length > 0) {
            this.preloadTrack(0);
        }
    }

    /**
     * Preload a track for smooth playback
     */
    preloadTrack(index) {
        if (index >= this.tracks.length) return null;
        
        const trackUrl = this.tracks[index]?.url;
        if (!trackUrl) return null;
        
        const audio = new Audio();
        audio.preload = 'auto';
        audio.loop = false;
        audio.volume = 0;
        
        // Add error handling for failed loads
        audio.addEventListener('error', (e) => {
            console.warn(`Audio track failed to load: ${trackUrl}`);
            this.handleTrackError(index);
        });
        
        audio.src = trackUrl;
        return audio;
    }
    
    /**
     * Handle track loading errors gracefully
     */
    handleTrackError(failedIndex) {
        // Mark track as unavailable and try next
        if (this.tracks[failedIndex]) {
            this.tracks[failedIndex].failed = true;
        }
    }

    /**
     * Start playing ambient music
     */
    play() {
        if (this.tracks.length === 0) {
            this.notifyNoAudio();
            return;
        }
        
        // Find a track that hasn't failed
        let attempts = 0;
        while (this.tracks[this.currentTrackIndex]?.failed && attempts < this.tracks.length) {
            this.currentTrackIndex = (this.currentTrackIndex + 1) % this.tracks.length;
            attempts++;
        }
        
        if (attempts >= this.tracks.length) {
            this.notifyNoAudio();
            return;
        }
        
        // Resume if we have a paused track
        if (this.currentAudio && !this.currentAudio.error) {
            this.currentAudio.play()
                .then(() => {
                    this.fadeIn(this.currentAudio);
                    this.isPlaying = true;
                })
                .catch(err => {
                    console.log('Audio playback requires user interaction first.');
                });
            return;
        }

        this.currentAudio = this.preloadTrack(this.currentTrackIndex);
        if (!this.currentAudio) {
            this.notifyNoAudio();
            return;
        }

        this.setupTrackEndHandler();
        
        this.currentAudio.play()
            .then(() => {
                this.fadeIn(this.currentAudio);
                this.isPlaying = true;
            })
            .catch(err => {
                console.log('Audio playback requires user interaction first.');
                this.isPlaying = false;
            });
    }
    
    /**
     * Notify that no audio is available
     */
    notifyNoAudio() {
        console.log('No audio tracks available. Add local audio files to assets/audio/ for ambient music.');
        this.isPlaying = false;
    }

    /**
     * Setup handler for when track ends
     */
    setupTrackEndHandler() {
        if (this.trackEndHandler) {
            this.currentAudio?.removeEventListener('ended', this.trackEndHandler);
        }

        this.trackEndHandler = () => {
            this.playNextTrack();
        };

        this.currentAudio?.addEventListener('ended', this.trackEndHandler);
    }

    /**
     * Play the next track in the playlist
     */
    playNextTrack() {
        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.tracks.length;
        
        const nextAudio = this.preloadTrack(this.currentTrackIndex);
        if (!nextAudio) return;

        // Crossfade to next track
        this.crossfade(this.currentAudio, nextAudio);
    }

    /**
     * Play the previous track in the playlist
     */
    playPrevTrack() {
        this.currentTrackIndex = (this.currentTrackIndex - 1 + this.tracks.length) % this.tracks.length;
        
        const prevAudio = this.preloadTrack(this.currentTrackIndex);
        if (!prevAudio) return;

        // Crossfade to previous track
        this.crossfade(this.currentAudio, prevAudio);
    }

    /**
     * Set repeat mode for current track
     */
    setRepeat(enabled) {
        this.repeatMode = enabled;
        if (this.currentAudio) {
            this.currentAudio.loop = enabled;
        }
    }

    /**
     * Crossfade between two audio tracks
     */
    crossfade(fromAudio, toAudio) {
        const duration = AUDIO_CONFIG.crossfadeDuration;
        const steps = 30;
        const stepTime = duration / steps;
        const volumeStep = this.volume / steps;
        
        let currentStep = 0;
        
        toAudio.volume = 0;
        toAudio.play().catch(() => {});
        
        this.setupTrackEndHandler();

        const fadeInterval = setInterval(() => {
            currentStep++;
            
            if (fromAudio) {
                fromAudio.volume = Math.max(0, (this.isMuted ? 0 : this.volume) - (volumeStep * currentStep));
            }
            toAudio.volume = Math.min(this.isMuted ? 0 : this.volume, volumeStep * currentStep);
            
            if (currentStep >= steps) {
                clearInterval(fadeInterval);
                if (fromAudio) {
                    fromAudio.pause();
                    fromAudio.src = '';
                }
                this.currentAudio = toAudio;
                this.setupTrackEndHandler();
            }
        }, stepTime);
    }

    /**
     * Fade in audio
     */
    fadeIn(audio) {
        if (!audio) return;
        
        const duration = AUDIO_CONFIG.fadeInDuration;
        const steps = 20;
        const stepTime = duration / steps;
        const targetVolume = this.isMuted ? 0 : this.volume;
        const volumeStep = targetVolume / steps;
        
        let currentStep = 0;
        audio.volume = 0;
        
        clearInterval(this.fadeInterval);
        this.fadeInterval = setInterval(() => {
            currentStep++;
            audio.volume = Math.min(targetVolume, volumeStep * currentStep);
            
            if (currentStep >= steps) {
                clearInterval(this.fadeInterval);
            }
        }, stepTime);
    }

    /**
     * Fade out audio
     */
    fadeOut(audio, callback) {
        if (!audio) {
            callback?.();
            return;
        }
        
        const duration = AUDIO_CONFIG.fadeOutDuration;
        const steps = 20;
        const stepTime = duration / steps;
        const startVolume = audio.volume;
        const volumeStep = startVolume / steps;
        
        let currentStep = 0;
        
        clearInterval(this.fadeInterval);
        this.fadeInterval = setInterval(() => {
            currentStep++;
            audio.volume = Math.max(0, startVolume - (volumeStep * currentStep));
            
            if (currentStep >= steps) {
                clearInterval(this.fadeInterval);
                audio.pause();
                callback?.();
            }
        }, stepTime);
    }

    /**
     * Pause playback with fade out
     */
    pause() {
        if (!this.currentAudio || !this.isPlaying) return;
        
        this.fadeOut(this.currentAudio, () => {
            this.isPlaying = false;
        });
    }

    /**
     * Stop playback completely
     */
    stop() {
        clearInterval(this.fadeInterval);
        
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.src = '';
            this.currentAudio = null;
        }
        
        if (this.nextAudio) {
            this.nextAudio.pause();
            this.nextAudio.src = '';
            this.nextAudio = null;
        }
        
        this.isPlaying = false;
    }

    /**
     * Toggle mute state
     */
    toggleMute() {
        this.isMuted = !this.isMuted;
        
        if (this.currentAudio) {
            this.currentAudio.volume = this.isMuted ? 0 : this.volume;
        }
        
        return this.isMuted;
    }

    /**
     * Set volume level
     */
    setVolume(level) {
        this.volume = Math.max(0, Math.min(1, level));
        
        if (this.currentAudio && !this.isMuted) {
            this.currentAudio.volume = this.volume;
        }
    }

    /**
     * Get current track info
     */
    getCurrentTrackInfo() {
        if (this.tracks.length === 0) return null;
        
        return {
            name: this.tracks[this.currentTrackIndex]?.name || 'Unknown',
            index: this.currentTrackIndex,
            total: this.tracks.length,
            isPlaying: this.isPlaying,
            isMuted: this.isMuted,
            volume: this.volume,
            currentTime: this.currentAudio?.currentTime || 0,
            duration: this.currentAudio?.duration || 0
        };
    }

    /**
     * Seek to position in current track
     */
    seekTo(percent) {
        if (this.currentAudio && this.currentAudio.duration) {
            this.currentAudio.currentTime = this.currentAudio.duration * percent;
        }
    }
}
