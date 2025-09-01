import React, { useEffect, useRef, useCallback } from "react";
import { BrowserMultiFormatReader, BarcodeFormat } from "@zxing/browser";

interface BarcodeScannerProps {
  active: boolean;
  onResult: (text: string) => void;
  onError?: (error: unknown) => void;
  facingMode?: "environment" | "user";
  scanDelay?: number;
  enableCache?: boolean;
  scanRegion?: { x: number; y: number; width: number; height: number };
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  active,
  onResult,
  onError,
  facingMode = "environment",
  scanDelay = 100,
  enableCache = true,
  scanRegion,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastScanRef = useRef<string>("");
  const lastScanTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>();

  // Optimized camera setup
  const setupCamera = useCallback(async () => {
    if (!videoRef.current) return null;

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30 },
          focusMode: "continuous",
          exposureMode: "continuous",
          whiteBalanceMode: "continuous"
        } as any
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      
      return stream;
    } catch (error) {
      onError?.(error);
      return null;
    }
  }, [facingMode, onError]);

  // Optimized result handler with caching
  const handleScanResult = useCallback((text: string) => {
    const now = Date.now();
    
    // Cache check to prevent duplicate scans
    if (enableCache && lastScanRef.current === text && 
        now - lastScanTimeRef.current < scanDelay) {
      return;
    }
    
    lastScanRef.current = text;
    lastScanTimeRef.current = now;
    onResult(text);
  }, [onResult, enableCache, scanDelay]);

  useEffect(() => {
    // Stop camera + reader helper
    const stopAll = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (readerRef.current) {
        try {
          (readerRef.current as any).reset?.();
        } catch (e) {
          // Reset method may not exist in all versions
        }
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };

    if (!active || !videoRef.current) {
      stopAll();
      return;
    }

    let cancelled = false;
    
    const initializeScanner = async () => {
      try {
        const stream = await setupCamera();
        if (!stream || cancelled) return;

        // Enhanced reader with optimized settings
        const reader = new BrowserMultiFormatReader();
        
        readerRef.current = reader;

        // Start continuous scanning with optimizations
        reader.decodeFromVideoDevice(null, videoRef.current!, (result, err) => {
          if (cancelled) return;
          
          if (result) {
            handleScanResult(result.getText());
          }
          
          if (err && (err as any)?.name !== "NotFoundException") {
            onError?.(err);
          }
        });

      } catch (error) {
        if (!cancelled) {
          onError?.(error);
        }
      }
    };

    initializeScanner();

    return () => {
      cancelled = true;
      stopAll();
    };
  }, [active, setupCamera, handleScanResult, onError]);

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
};
