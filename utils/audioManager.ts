import { Audio } from 'expo-av';

class AudioManager {
  private sound: Audio.Sound | null = null;
  private isPlaying: boolean = false;
  private streamUrl: string = 'https://stream.zeno.fm/hmc38shnrwzuv';
  private playbackStatusListeners: ((status: Audio.PlaybackStatus) => void)[] = [];

  constructor() {
    this.configureAudioMode();
  }

  private async configureAudioMode() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecording: false,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        shouldDuckAndroid: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true, // Crucial for background playback
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      });
    } catch (error) {
      console.error('Error setting audio mode:', error);
    }
  }

  async play() {
    if (this.sound === null) {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: this.streamUrl },
          { shouldPlay: true, isLooping: false },
          this.onPlaybackStatusUpdate
        );
        this.sound = sound;
        this.isPlaying = true;
      } catch (error) {
        console.error('Error playing audio:', error);
      }
    } else {
      await this.sound.playAsync();
      this.isPlaying = true;
    }
    this.notifyListeners();
  }

  async pause() {
    if (this.sound) {
      await this.sound.pauseAsync();
      this.isPlaying = false;
    }
    this.notifyListeners();
  }

  async stop() {
    if (this.sound) {
      await this.sound.stopAsync();
      await this.sound.unloadAsync();
      this.sound = null;
      this.isPlaying = false;
    }
    this.notifyListeners();
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  private onPlaybackStatusUpdate = (status: Audio.PlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        console.error(`Encountered a fatal error during playback: ${status.error}`);
      }
    } else {
      const newIsPlaying = status.isPlaying;
      if (this.isPlaying !== newIsPlaying) {
        this.isPlaying = newIsPlaying;
        this.notifyListeners();
      }
    }
  };

  // Listener pattern to notify components of playback status changes
  subscribe(listener: (status: Audio.PlaybackStatus) => void) {
    this.playbackStatusListeners.push(listener);
    // Immediately notify with current status if available
    if (this.sound) {
      this.sound.getStatusAsync().then(status => {
        if (status.isLoaded) {
          listener(status);
        }
      });
    }
  }

  unsubscribe(listener: (status: Audio.PlaybackStatus) => void) {
    this.playbackStatusListeners = this.playbackStatusListeners.filter(l => l !== listener);
  }

  private notifyListeners() {
    if (this.sound) {
      this.sound.getStatusAsync().then(status => {
        if (status.isLoaded) {
          this.playbackStatusListeners.forEach(listener => listener(status));
        }
      });
    } else {
      // If sound is null, notify listeners that it's not playing
      this.playbackStatusListeners.forEach(listener => listener({ isPlaying: false, isLoaded: false } as Audio.PlaybackStatus));
    }
  }
}

export const audioManager = new AudioManager();
