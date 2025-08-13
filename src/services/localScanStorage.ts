import { Preferences } from '@capacitor/preferences';
import { DeviceIdService } from './deviceIdService';

export interface ScanRecord {
  id: string;
  deviceId: string;
  content: string;
  format: string;
  timestamp: number;
  notes?: string;
}

const SCANS_STORAGE_KEY = 'tonnex_scans';

export class LocalScanStorage {
  /**
   * Saves a scan result locally, associated with the device ID
   */
  static async saveScan(content: string, format: string, notes?: string): Promise<ScanRecord> {
    try {
      const deviceId = await DeviceIdService.getDeviceId();
      const scanRecord: ScanRecord = {
        id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        deviceId,
        content,
        format,
        timestamp: Date.now(),
        notes
      };

      // Get existing scans
      const existingScans = await this.getAllScans();
      
      // Add new scan
      const updatedScans = [scanRecord, ...existingScans];
      
      // Store back to secure storage
      await Preferences.set({
        key: SCANS_STORAGE_KEY,
        value: JSON.stringify(updatedScans)
      });

      console.log('Scan saved:', scanRecord);
      return scanRecord;
    } catch (error) {
      console.error('Error saving scan:', error);
      throw error;
    }
  }

  /**
   * Gets all scans for the current device
   */
  static async getAllScans(): Promise<ScanRecord[]> {
    try {
      const deviceId = await DeviceIdService.getDeviceId();
      const { value } = await Preferences.get({ key: SCANS_STORAGE_KEY });
      
      if (!value) {
        return [];
      }

      const allScans: ScanRecord[] = JSON.parse(value);
      
      // Filter scans for current device only
      return allScans.filter(scan => scan.deviceId === deviceId);
    } catch (error) {
      console.error('Error getting scans:', error);
      return [];
    }
  }

  /**
   * Deletes a specific scan
   */
  static async deleteScan(scanId: string): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: SCANS_STORAGE_KEY });
      
      if (!value) {
        return;
      }

      const allScans: ScanRecord[] = JSON.parse(value);
      const updatedScans = allScans.filter(scan => scan.id !== scanId);
      
      await Preferences.set({
        key: SCANS_STORAGE_KEY,
        value: JSON.stringify(updatedScans)
      });

      console.log('Scan deleted:', scanId);
    } catch (error) {
      console.error('Error deleting scan:', error);
      throw error;
    }
  }

  /**
   * Updates scan notes
   */
  static async updateScanNotes(scanId: string, notes: string): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: SCANS_STORAGE_KEY });
      
      if (!value) {
        return;
      }

      const allScans: ScanRecord[] = JSON.parse(value);
      const updatedScans = allScans.map(scan => 
        scan.id === scanId ? { ...scan, notes } : scan
      );
      
      await Preferences.set({
        key: SCANS_STORAGE_KEY,
        value: JSON.stringify(updatedScans)
      });

      console.log('Scan notes updated:', scanId);
    } catch (error) {
      console.error('Error updating scan notes:', error);
      throw error;
    }
  }

  /**
   * Clears all scans for the current device
   */
  static async clearAllScans(): Promise<void> {
    try {
      const deviceId = await DeviceIdService.getDeviceId();
      const { value } = await Preferences.get({ key: SCANS_STORAGE_KEY });
      
      if (!value) {
        return;
      }

      const allScans: ScanRecord[] = JSON.parse(value);
      // Keep scans from other devices, remove only current device scans
      const otherDeviceScans = allScans.filter(scan => scan.deviceId !== deviceId);
      
      await Preferences.set({
        key: SCANS_STORAGE_KEY,
        value: JSON.stringify(otherDeviceScans)
      });

      console.log('All scans cleared for device:', deviceId);
    } catch (error) {
      console.error('Error clearing scans:', error);
      throw error;
    }
  }

  /**
   * Gets scan count for current device
   */
  static async getScanCount(): Promise<number> {
    const scans = await this.getAllScans();
    return scans.length;
  }
}
