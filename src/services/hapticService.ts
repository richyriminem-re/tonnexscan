import { Haptics, ImpactStyle } from '@capacitor/haptics';

export class HapticService {
  /**
   * Light haptic feedback for successful scans
   */
  static async scanSuccess() {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      // Fallback for web
      this.webVibrate(30);
    }
  }

  /**
   * Medium haptic feedback for batch operations
   */
  static async batchComplete() {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (error) {
      // Fallback for web
      this.webVibrate(50);
    }
  }

  /**
   * Heavy haptic feedback for errors or important actions
   */
  static async error() {
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (error) {
      // Fallback for web
      this.webVibrate([100, 50, 100]);
    }
  }

  /**
   * Notification haptic for alerts
   */
  static async notification() {
    try {
      await Haptics.notification({ type: 'SUCCESS' as any });
    } catch (error) {
      // Fallback for web
      this.webVibrate(30);
    }
  }

  /**
   * Web vibration fallback
   */
  private static webVibrate(pattern: number | number[]) {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch (error) {
      console.log('Vibration not supported');
    }
  }

  /**
   * Check if haptics are available
   */
  static async isAvailable(): Promise<boolean> {
    try {
      // This will throw if haptics aren't available
      await Haptics.impact({ style: ImpactStyle.Light });
      return true;
    } catch (error) {
      return 'vibrate' in navigator;
    }
  }
}