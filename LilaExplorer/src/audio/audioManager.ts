/**
 * Audio Manager — stub implementation.
 * All methods are no-ops but log intent to console.
 * To add real audio: place .mp3 files in assets/audio/
 * and replace the require() stubs below.
 *
 * Example real implementation using expo-av:
 *
 *   import { Audio } from 'expo-av';
 *   const sound = new Audio.Sound();
 *   await sound.loadAsync(require('../../assets/audio/theme.mp3'));
 *   await sound.playAsync();
 */

class AudioManagerClass {
  private currentTrack: string | null = null;

  async playMusic(track: 'theme' | 'park' | 'beach' | 'forest' | 'mountain' | 'celebration') {
    if (this.currentTrack === track) return;
    this.currentTrack = track;
    // TODO: load and play assets/audio/${track}.mp3
    console.log(`[Audio] ♫ Music: ${track}`);
  }

  async stopMusic() {
    this.currentTrack = null;
    // TODO: stop current sound
    console.log('[Audio] ♫ Stopped');
  }

  async playSfx(
    sfx:
      | 'tap'
      | 'success'
      | 'levelup'
      | 'discover'
      | 'friendship'
      | 'walk'
      | 'whoosh'
      | 'pop'
  ) {
    // TODO: play assets/audio/sfx/${sfx}.mp3
    console.log(`[Audio] SFX: ${sfx}`);
  }

  async setMusicVolume(_volume: number) {
    // TODO: implement volume
  }
}

export const audioManager = new AudioManagerClass();
