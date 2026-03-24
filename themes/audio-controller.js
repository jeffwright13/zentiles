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
        this.crossfadeInterval = null;
        this.outgoingAudio = null;
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
        
        // Add error handling for failed loads.
        // Guard against spurious errors fired when src is cleared during cleanup:
        // setting src='' resolves to the page URL, which won't match trackUrl.
        audio.addEventListener('error', (e) => {
            const resolvedTrackUrl = new URL(trackUrl, window.location.href).href;
            if (audio.src !== resolvedTrackUrl) return;
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
     * Returns indices of tracks eligible for cycling (not failed, not disabled).
     */
    _enabledIndices() {
        return this.tracks
            .map((t, i) => i)
            .filter(i => !this.tracks[i].failed && this.tracks[i].enabled !== false);
    }

    /**
     * Play the next track in the playlist (skips disabled tracks)
     */
    playNextTrack() {
        const enabled = this._enabledIndices();
        if (enabled.length === 0) return;
        const pos = enabled.indexOf(this.currentTrackIndex);
        this.currentTrackIndex = enabled[(pos + 1) % enabled.length];

        const nextAudio = this.preloadTrack(this.currentTrackIndex);
        if (!nextAudio) return;
        this.crossfade(this.currentAudio, nextAudio);
    }

    /**
     * Play the previous track in the playlist (skips disabled tracks)
     */
    playPrevTrack() {
        const enabled = this._enabledIndices();
        if (enabled.length === 0) return;
        const pos = enabled.indexOf(this.currentTrackIndex);
        this.currentTrackIndex = enabled[(pos - 1 + enabled.length) % enabled.length];

        const prevAudio = this.preloadTrack(this.currentTrackIndex);
        if (!prevAudio) return;
        this.crossfade(this.currentAudio, prevAudio);
    }

    /**
     * Jump directly to a specific track by index and start playing it.
     */
    jumpToTrack(index) {
        if (index < 0 || index >= this.tracks.length) return;
        this.currentTrackIndex = index;
        const audio = this.preloadTrack(index);
        if (!audio) return;
        if (this.currentAudio) {
            this.crossfade(this.currentAudio, audio);
        } else {
            this.currentAudio = audio;
            this.setupTrackEndHandler();
            audio.play()
                .then(() => { this.fadeIn(audio); this.isPlaying = true; })
                .catch(() => { console.log('Audio playback requires user interaction first.'); });
        }
        this.isPlaying = true;
    }

    /**
     * Enable or disable a track in the rotation.
     * If the currently-playing track is disabled, skip to the next enabled one.
     */
    setTrackEnabled(index, enabled) {
        if (!this.tracks[index]) return;
        this.tracks[index].enabled = enabled;
        if (!enabled && index === this.currentTrackIndex && this.isPlaying) {
            this.playNextTrack();
        }
    }

    /**
     * Return a snapshot of all tracks with their current state.
     */
    getTracks() {
        return this.tracks.map((t, i) => ({
            name: t.name,
            url: t.url,
            index: i,
            enabled: t.enabled !== false,
            failed: !!t.failed,
            isCurrent: i === this.currentTrackIndex,
        }));
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
        // Cancel any in-progress crossfade and immediately stop the fading-out audio.
        // This prevents orphaned audio when the user skips rapidly.
        clearInterval(this.crossfadeInterval);
        if (this.outgoingAudio) {
            this.outgoingAudio.pause();
            this.outgoingAudio = null;
        }

        // Remove ended listener from the track being replaced
        if (this.trackEndHandler && fromAudio) {
            fromAudio.removeEventListener('ended', this.trackEndHandler);
            this.trackEndHandler = null;
        }

        // Immediately promote toAudio to currentAudio so that pause(), play(),
        // and further skips always target the right element mid-crossfade.
        this.outgoingAudio = fromAudio;
        this.currentAudio = toAudio;

        toAudio.volume = 0;
        toAudio.play().catch(() => {});
        this.setupTrackEndHandler();

        const steps = 30;
        const stepTime = AUDIO_CONFIG.crossfadeDuration / steps;
        const volumeStep = this.volume / steps;
        let currentStep = 0;

        this.crossfadeInterval = setInterval(() => {
            currentStep++;

            if (this.outgoingAudio) {
                this.outgoingAudio.volume = Math.max(0, (this.isMuted ? 0 : this.volume) - volumeStep * currentStep);
            }
            // Only adjust toAudio volume if it hasn't been paused by the user
            if (!toAudio.paused) {
                toAudio.volume = Math.min(this.isMuted ? 0 : this.volume, volumeStep * currentStep);
            }

            if (currentStep >= steps) {
                clearInterval(this.crossfadeInterval);
                if (this.outgoingAudio) {
                    this.outgoingAudio.pause();
                    this.outgoingAudio = null;
                }
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

        // Cancel any crossfade and immediately stop the fading-out audio so nothing
        // keeps playing behind the scenes after the user hits Pause.
        clearInterval(this.crossfadeInterval);
        if (this.outgoingAudio) {
            this.outgoingAudio.pause();
            this.outgoingAudio = null;
        }

        this.fadeOut(this.currentAudio, () => {
            this.isPlaying = false;
        });
    }

    /**
     * Stop playback completely
     */
    stop() {
        clearInterval(this.fadeInterval);
        clearInterval(this.crossfadeInterval);
        
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.src = '';
            this.currentAudio = null;
        }
        
        if (this.outgoingAudio) {
            this.outgoingAudio.pause();
            this.outgoingAudio = null;
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
