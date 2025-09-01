import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Clock, Target, Zap } from 'lucide-react';

interface ScanStatisticsProps {
  totalScans: number;
  sessionStartTime: number;
}

export const ScanStatistics: React.FC<ScanStatisticsProps> = ({ 
  totalScans, 
  sessionStartTime 
}) => {
  const [sessionDuration, setSessionDuration] = useState(0);
  const [scansPerMinute, setScansPerMinute] = useState(0);

  useEffect(() => {
    const updateStats = () => {
      const now = Date.now();
      const duration = (now - sessionStartTime) / 1000; // seconds
      setSessionDuration(duration);
      
      if (duration > 0) {
        const spm = (totalScans / duration) * 60;
        setScansPerMinute(Math.round(spm * 10) / 10);
      }
    };

    const interval = setInterval(updateStats, 1000);
    updateStats();

    return () => clearInterval(interval);
  }, [totalScans, sessionStartTime]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPerformanceLevel = (): { level: string; color: string } => {
    if (scansPerMinute >= 30) return { level: 'Excellent', color: 'bg-green-500' };
    if (scansPerMinute >= 20) return { level: 'Good', color: 'bg-blue-500' };
    if (scansPerMinute >= 10) return { level: 'Average', color: 'bg-yellow-500' };
    return { level: 'Starting', color: 'bg-gray-500' };
  };

  const performance = getPerformanceLevel();

  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Target className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Scans</p>
            <p className="text-lg font-bold">{totalScans}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Clock className="h-4 w-4 text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Session</p>
            <p className="text-lg font-bold">{formatDuration(sessionDuration)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <Zap className="h-4 w-4 text-green-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Speed</p>
            <p className="text-lg font-bold">{scansPerMinute}/min</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Performance</p>
            <Badge className={`${performance.color} text-white text-xs`}>
              {performance.level}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
};