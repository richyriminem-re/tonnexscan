import React from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';

export const OfflineIndicator: React.FC = () => {
  const { isOnline } = useOfflineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-destructive/60 text-destructive-foreground px-1.5 py-1 rounded shadow flex items-center gap-1 text-xs font-medium">
      <WifiOff className="h-3 w-3" />
      Offline Mode
    </div>
  );
};