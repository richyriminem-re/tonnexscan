import React from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';

export const OfflineIndicator: React.FC = () => {
  const { isOnline } = useOfflineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-destructive text-destructive-foreground px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium">
      <WifiOff className="h-4 w-4" />
      Offline Mode
    </div>
  );
};