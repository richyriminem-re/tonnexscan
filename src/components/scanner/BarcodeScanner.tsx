import React, { useEffect, useRef } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

interface BarcodeScannerProps {
  active: boolean;
  onResult: (text: string) => void;
  onError?: (error: unknown) => void;
  facingMode?: "environment" | "user";
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  active,
  onResult,
  onError,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Stop camera + reader helper
    const stopAll = () => {
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
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    reader
      .decodeFromVideoDevice(null, videoRef.current, (result, err) => {
        if (cancelled) return;
        if (result) {
          onResult(result.getText());
        }
        if (err && (err as any)?.name !== "NotFoundException") {
          onError?.(err);
        }
      })
      .then(() => {
        const v = videoRef.current;
        if (v && v.srcObject) {
          streamRef.current = v.srcObject as MediaStream;
        }
      })
      .catch((e) => onError?.(e));

    return () => {
      cancelled = true;
      stopAll();
    };
  }, [active, onResult, onError]);

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
