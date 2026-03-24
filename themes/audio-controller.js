/**
 * Audio Controller for ZenTiles Theme System
 * Handles ambient music playback with smooth transitions
 */

import { AUDIO_CONFIG } from './theme-config.js';

export class AudioController {
    constructor() {
        this.currentAudio = null;
        this.outgoingAudio = null;   // audio being faded out during crossfade
        this._preloadedAudio = null; // next-track look-ahead buffer
        this._preloadedIndex = null;
        this.currentTrackIndex = 0;
        this.tracks = [];
        this.isPlaying = false;
        this.isMuted = false;
        this.repeatMode = false;
        this.volume = AUDIO_CONFIG.defaultVolume;
        this.fadeInterval = null;
        this.crossfadeInterval = null;
        this.trackEndHandler = null;
    }

    // -------------------------------------------------------------------------
    // Track loading
    // -------------------------------------------------------------------------

    /**
     * Switch to a new set of tracks (e.g. on theme change).
     * Fades out the current audio gracefully instead of cutting it off.
     */
    loadTracks(themeTracks) {
        clearInterval(this.fadeInterval);
        clearInterval(this.crossfadeInterval);

        // Fade out the playing track over ~500 ms, then discard it.
        // We do this on a detached "ghost" so the state reset below is immediate.
        if (this.currentAudio && this.isPlaying) {
            const ghost = this.currentAudio;
            const startVol = ghost.volume;
            const steps = 10;
            let step = 0;
            const timer = setInterval(() => {
                step++;
                ghost.volume = Math.max(0, startVol * (1 - step / steps));
                if (step >= steps) { clearInterval(timer); ghost.pause(); }
            }, 50);
        } else if (this.currentAudio) {
            this.currentAudio.pause();
        }

        if (this.outgoingAudio) {
            this.outgoingAudio.pause();
            this.outgoingAudio = null;
        }

        this._clearPreloaded();

        this.currentAudio = null;
        this.trackEndHandler = null;
        this.isPlaying = false;
        this.tracks = themeTracks || [];
        this.currentTrackIndex = 0;
    }

    /**
     * Create and return a new Audio element for the given track index.
     * Applies the current repeat/loop setting.
     */
    preloadTrack(index) {
        if (index < 0 || index >= this.tracks.length) return null;

        const trackUrl = this.tracks[index]?.url;
        if (!trackUrl) return null;

        const audio = new Audio();
        audio.preload = 'auto';
        audio.loop = this.repeatMode;
        audio.volume = 0;

        // Guard against spurious errors fired when src is cleared during cleanup:
        // setting src='' resolves to the page URL, which won't match trackUrl.
        audio.addEventListener('error', () => {
            const resolvedTrackUrl = new URL(trackUrl, window.location.href).href;
            if (audio.src !== resolvedTrackUrl) return;
            console.warn(`Audio track failed to load: ${trackUrl}`);
            this.handleTrackError(index);
        });

        audio.src = trackUrl;
        return audio;
    }

    handleTrackError(failedIndex) {
        if (this.tracks[failedIndex]) {
            this.tracks[failedIndex].failed = true;
        }
    }

    // -------------------------------------------------------------------------
    // Look-ahead preloading — buffers the next track before it's needed
    // -------------------------------------------------------------------------

    _preloadNext() {
        const enabled = this._enabledIndices();
        if (enabled.length < 2) return;
        const pos = enabled.indexOf(this.currentTrackIndex);
        const nextIndex = enabled[(pos + 1) % enabled.length];
        if (this._preloadedIndex === nextIndex && this._preloadedAudio) return;
        this._clearPreloaded();
        this._preloadedAudio = this.preloadTrack(nextIndex);
        this._preloadedIndex = nextIndex;
    }

    _takePreloaded(index) {
        if (this._preloadedAudio && this._preloadedIndex === index) {
            const audio = this._preloadedAudio;
            this._preloadedAudio = null;
            this._preloadedIndex = null;
            return audio;
        }
        return null;
    }

    _clearPreloaded() {
        if (this._preloadedAudio) {
            this._preloadedAudio.pause();
            this._preloadedAudio = null;
        }
        this._preloadedIndex = null;
    }

    // -------------------------------------------------------------------------
    // Playback control
    // -------------------------------------------------------------------------

    play() {
        if (this.tracks.length === 0) { this._notifyNoAudio(); return; }

        // Skip past any failed tracks
        let attempts = 0;
        while (this.tracks[this.currentTrackIndex]?.failed && attempts < this.tracks.length) {
            this.currentTrackIndex = (this.currentTrackIndex + 1) % this.tracks.length;
            attempts++;
        }
        if (attempts >= this.tracks.length) { this._notifyNoAudio(); return; }

        // Resume a paused track
        if (this.currentAudio && !this.currentAudio.error) {
            this.currentAudio.play()
                .then(() => { this.fadeIn(this.currentAudio); this.isPlaying = true; })
                .catch(() => console.log('Audio playback requires user interaction first.'));
            return;
        }

        this.currentAudio = this.preloadTrack(this.currentTrackIndex);
        if (!this.currentAudio) { this._notifyNoAudio(); return; }

        this.setupTrackEndHandler();
        this.currentAudio.play()
            .then(() => { this.fadeIn(this.currentAudio); this.isPlaying = true; })
            .catch(() => { console.log('Audio playback requires user interaction first.'); this.isPlaying = false; });
    }

    pause() {
        if (!this.currentAudio || !this.isPlaying) return;

        // Cancel any in-flight crossfade and silence the outgoing track immediately
        clearInterval(this.crossfadeInterval);
        if (this.outgoingAudio) {
            this.outgoingAudio.pause();
            this.outgoingAudio = null;
        }

        this.fadeOut(this.currentAudio, () => { this.isPlaying = false; });
    }

    /**
     * Hard stop — used when destroying the controller or switching pages.
     */
    stop() {
        clearInterval(this.fadeInterval);
        clearInterval(this.crossfadeInterval);

        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }
        if (this.outgoingAudio) {
            this.outgoingAudio.pause();
            this.outgoingAudio = null;
        }

        this._clearPreloaded();
        this.trackEndHandler = null;
        this.isPlaying = false;
    }

    _notifyNoAudio() {
        console.log('No audio tracks available.');
        this.isPlaying = false;
    }

    // -------------------------------------------------------------------------
    // Track navigation
    // -------------------------------------------------------------------------

    /** Indices of tracks eligible for cycling (not failed, not disabled). */
    _enabledIndices() {
        return this.tracks
            .map((t, i) => i)
            .filter(i => !this.tracks[i].failed && this.tracks[i].enabled !== false);
    }

    setupTrackEndHandler() {
        if (this.trackEndHandler) {
            this.currentAudio?.removeEventListener('ended', this.trackEndHandler);
        }
        this.trackEndHandler = () => this.playNextTrack();
        this.currentAudio?.addEventListener('ended', this.trackEndHandler);

        // Buffer the next track so it's ready when this one ends
        this._preloadNext();
    }

    playNextTrack() {
        const enabled = this._enabledIndices();
        if (enabled.length === 0) return;
        const pos = enabled.indexOf(this.currentTrackIndex);
        this.currentTrackIndex = enabled[(pos + 1) % enabled.length];

        // Use the look-ahead buffer if it's for the right track
        const nextAudio = this._takePreloaded(this.currentTrackIndex)
            ?? this.preloadTrack(this.currentTrackIndex);
        if (!nextAudio) return;
        this.crossfade(this.currentAudio, nextAudio);
    }

    playPrevTrack() {
        const enabled = this._enabledIndices();
        if (enabled.length === 0) return;
        const pos = enabled.indexOf(this.currentTrackIndex);
        this.currentTrackIndex = enabled[(pos - 1 + enabled.length) % enabled.length];

        const prevAudio = this._takePreloaded(this.currentTrackIndex)
            ?? this.preloadTrack(this.currentTrackIndex);
        if (!prevAudio) return;
        this.crossfade(this.currentAudio, prevAudio);
    }

    /**
     * Jump directly to a specific track and start playing immediately.
     */
    jumpToTrack(index) {
        if (index < 0 || index >= this.tracks.length) return;
        this.currentTrackIndex = index;

        const audio = this._takePreloaded(index) ?? this.preloadTrack(index);
        if (!audio) return;

        if (this.currentAudio) {
            this.crossfade(this.currentAudio, audio);
        } else {
            this.currentAudio = audio;
            this.setupTrackEndHandler();
            audio.play()
                .then(() => { this.fadeIn(audio); this.isPlaying = true; })
                .catch(() => console.log('Audio playback requires user interaction first.'));
        }
        this.isPlaying = true;
    }

    setTrackEnabled(index, enabled) {
        if (!this.tracks[index]) return;
        this.tracks[index].enabled = enabled;
        // If the now-disabled track is currently playing, skip ahead
        if (!enabled && index === this.currentTrackIndex && this.isPlaying) {
            this.playNextTrack();
        }
        // Refresh the look-ahead buffer since the rotation changed
        this._clearPreloaded();
        this._preloadNext();
    }

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

    // -------------------------------------------------------------------------
    // Crossfade / fade helpers
    // -------------------------------------------------------------------------

    crossfade(fromAudio, toAudio) {
        // Cancel any in-progress crossfade and stop the outgoing track immediately
        clearInterval(this.crossfadeInterval);
        if (this.outgoingAudio) {
            this.outgoingAudio.pause();
            this.outgoingAudio = null;
        }

        // Remove the ended listener from the track being replaced
        if (this.trackEndHandler && fromAudio) {
            fromAudio.removeEventListener('ended', this.trackEndHandler);
            this.trackEndHandler = null;
        }

        // Immediately promote toAudio so pause/play/skip always target the right element
        this.outgoingAudio = fromAudio;
        this.currentAudio = toAudio;

        toAudio.volume = 0;
        toAudio.play().catch(() => {});
        this.setupTrackEndHandler(); // also triggers _preloadNext for the one after

        const steps = 30;
        const stepTime = AUDIO_CONFIG.crossfadeDuration / steps;
        const volumeStep = this.volume / steps;
        let currentStep = 0;

        this.crossfadeInterval = setInterval(() => {
            currentStep++;

            if (this.outgoingAudio) {
                this.outgoingAudio.volume = Math.max(
                    0,
                    (this.isMuted ? 0 : this.volume) - volumeStep * currentStep
                );
            }
            if (!toAudio.paused) {
                toAudio.volume = Math.min(
                    this.isMuted ? 0 : this.volume,
                    volumeStep * currentStep
                );
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

    fadeIn(audio) {
        if (!audio) return;
        const steps = 20;
        const stepTime = AUDIO_CONFIG.fadeInDuration / steps;
        const targetVolume = this.isMuted ? 0 : this.volume;
        const volumeStep = targetVolume / steps;
        let currentStep = 0;
        audio.volume = 0;

        clearInterval(this.fadeInterval);
        this.fadeInterval = setInterval(() => {
            currentStep++;
            audio.volume = Math.min(targetVolume, volumeStep * currentStep);
            if (currentStep >= steps) clearInterval(this.fadeInterval);
        }, stepTime);
    }

    fadeOut(audio, callback) {
        if (!audio) { callback?.(); return; }
        const steps = 20;
        const stepTime = AUDIO_CONFIG.fadeOutDuration / steps;
        const startVolume = audio.volume;
        const volumeStep = startVolume / steps;
        let currentStep = 0;

        clearInterval(this.fadeInterval);
        this.fadeInterval = setInterval(() => {
            currentStep++;
            audio.volume = Math.max(0, startVolume - volumeStep * currentStep);
            if (currentStep >= steps) {
                clearInterval(this.fadeInterval);
                audio.pause();
                callback?.();
            }
        }, stepTime);
    }

    // -------------------------------------------------------------------------
    // Volume / mute / repeat / seek
    // -------------------------------------------------------------------------

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.currentAudio) this.currentAudio.volume = this.isMuted ? 0 : this.volume;
        return this.isMuted;
    }

    setVolume(level) {
        this.volume = Math.max(0, Math.min(1, level));
        if (this.currentAudio && !this.isMuted) this.currentAudio.volume = this.volume;
    }

    setRepeat(enabled) {
        this.repeatMode = enabled;
        if (this.currentAudio) this.currentAudio.loop = enabled;
    }

    seekTo(percent) {
        if (this.currentAudio?.duration) {
            this.currentAudio.currentTime = this.currentAudio.duration * percent;
        }
    }

    // -------------------------------------------------------------------------
    // State query
    // -------------------------------------------------------------------------

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
            duration: this.currentAudio?.duration || 0,
        };
    }
}
