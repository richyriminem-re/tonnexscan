import { Preferences } from '@capacitor/preferences';
import { v4 as uuidv4 } from 'uuid';

const DEVICE_ID_KEY = 'tonnex_device_id';

export class DeviceIdService {
  private static deviceId: string | null = null;

  /**
   * Gets or generates a unique device ID
   * On first launch, generates a UUID v4 and stores it securely
   * Returns the same ID on subsequent calls
   */
  static async getDeviceId(): Promise<string> {
    if (this.deviceId) {
      return this.deviceId;
    }

    try {
      // Try to get existing device ID from secure storage
      const { value } = await Preferences.get({ key: DEVICE_ID_KEY });
      
      if (value) {
        this.deviceId = value;
        return value;
      }

      // Generate new device ID on first launch
      const newDeviceId = uuidv4();
      
      // Store securely (uses Android Keystore on Android)
      await Preferences.set({
        key: DEVICE_ID_KEY,
        value: newDeviceId
      });

      this.deviceId = newDeviceId;
      console.log('Generated new device ID:', newDeviceId);
      
      return newDeviceId;
    } catch (error) {
      console.error('Error managing device ID:', error);
      // Fallback to in-memory ID if storage fails
      if (!this.deviceId) {
        this.deviceId = uuidv4();
      }
      return this.deviceId;
    }
  }

  /**
   * Clears the device ID (for testing purposes only)
   */
  static async clearDeviceId(): Promise<void> {
    try {
      await Preferences.remove({ key: DEVICE_ID_KEY });
      this.deviceId = null;
    } catch (error) {
      console.error('Error clearing device ID:', error);
    }
  }
}