import { useState, useEffect, useCallback } from 'react';
import { LocalScanStorage, ScanRecord } from '@/services/localScanStorage';
import { DeviceIdService } from '@/services/deviceIdService';

export const useDeviceScans = () => {
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deviceId, setDeviceId] = useState<string>('');

  const loadScans = useCallback(async () => {
    try {
      setLoading(true);
      const id = await DeviceIdService.getDeviceId();
      setDeviceId(id);
      
      const savedScans = await LocalScanStorage.getAllScans();
      setScans(savedScans);
    } catch (error) {
      console.error('Error loading device scans:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addScan = useCallback(async (content: string, format: string, notes?: string) => {
    try {
      const scanRecord = await LocalScanStorage.saveScan(content, format, notes);
      setScans(prev => [scanRecord, ...prev]);
      return scanRecord;
    } catch (error) {
      console.error('Error adding scan:', error);
      throw error;
    }
  }, []);

  const deleteScan = useCallback(async (scanId: string) => {
    try {
      await LocalScanStorage.deleteScan(scanId);
      setScans(prev => prev.filter(scan => scan.id !== scanId));
    } catch (error) {
      console.error('Error deleting scan:', error);
      throw error;
    }
  }, []);

  const updateScanNotes = useCallback(async (scanId: string, notes: string) => {
    try {
      await LocalScanStorage.updateScanNotes(scanId, notes);
      setScans(prev => prev.map(scan => 
        scan.id === scanId ? { ...scan, notes } : scan
      ));
    } catch (error) {
      console.error('Error updating scan notes:', error);
      throw error;
    }
  }, []);

  const clearAllScans = useCallback(async () => {
    try {
      await LocalScanStorage.clearAllScans();
      setScans([]);
    } catch (error) {
      console.error('Error clearing scans:', error);
      throw error;
    }
  }, []);

  const getScanCount = useCallback(async () => {
    return await LocalScanStorage.getScanCount();
  }, []);

  useEffect(() => {
    loadScans();
  }, [loadScans]);

  return {
    scans,
    loading,
    deviceId,
    addScan,
    deleteScan,
    updateScanNotes,
    clearAllScans,
    getScanCount,
    refreshScans: loadScans
  };
};