import { useState, useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast as sonnerToast } from "@/components/ui/sonner";
import { 
  ArrowLeft, 
  Camera, 
  Plus, 
  Trash2, 
  Download,
  SkipForward,
  Check,
  ScanLine,
  X,
  RotateCcw,
  AlertTriangle,
  QrCode,
  FileSpreadsheet,
  FileText
} from "lucide-react";
import logoMark from "@/assets/logo-mark.png";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import * as XLSX from "xlsx";
import { BarcodeScanner } from "@/components/scanner/BarcodeScanner";
import { LocalScanStorage, ScanRecord } from "@/services/localScanStorage";
import { DeviceIdService } from "@/services/deviceIdService";

interface ScanResult {
  id: string;
  serial: string;
  iuc: string;
  timestamp: Date;
  isDuplicate?: boolean;
  batchId?: number;
  deviceId?: string;
  notes?: string;
}

interface SavedExport {
  id: string;
  name: string;
  type: "csv" | "xlsx";
  exportType: "both" | "serial" | "iuc";
  createdAt: string; // ISO
  rowCount: number;
  data: string; // csv text or base64 for xlsx
}

const Scanner = () => {
  // Toast adapter (use Sonner)
  const notify = useCallback((opts: { title: string; description?: string; variant?: "destructive" | "default" }) => {
    const fn: any = opts.variant === "destructive" ? (sonnerToast as any).error : sonnerToast;
    if (opts.description) fn(opts.title, { description: opts.description }); else fn(opts.title);
  }, []);

  const [scans, setScans] = useState<ScanResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [showDelay, setShowDelay] = useState(false);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [lastScanId, setLastScanId] = useState<string | null>(null);

  // New UI/flow state
  const [rawText, setRawText] = useState("");
  const [isScanning, setIsScanning] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [undoConfirmOpen, setUndoConfirmOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState<"csv" | "xlsx">("xlsx");
  const [exportType, setExportType] = useState<"both" | "serial" | "iuc">("both");
  const [lastBatchCount, setLastBatchCount] = useState(0);
  const [lastBatchId, setLastBatchId] = useState<number | null>(null);

  // Touch helpers for gestures
  const touchStartX = useRef<number | null>(null);
  const touchMoved = useRef(false);
  const longPressTimer = useRef<number | null>(null);
  const longPressTriggered = useRef(false);

  // Validation patterns
  const SERIAL_REGEX = /^[A-Z]\d{9}X\d$/;
  const IUC_REGEX = /^\d{10}$/;

  // Load existing scans from device-specific storage
  useEffect(() => {
    const loadScans = async () => {
      try {
        const deviceId = await DeviceIdService.getDeviceId();
        console.log('Device ID initialized:', deviceId);
        
        const savedScans = await LocalScanStorage.getAllScans();
        setScans(savedScans.map((s) => ({ 
          id: s.id,
          serial: s.content.split(',')[0] || '',
          iuc: s.content.split(',')[1] || '',
          timestamp: new Date(s.timestamp),
          deviceId: s.deviceId,
          notes: s.notes,
          batchId: undefined // Legacy field
        })));
      } catch (error) {
        console.error('Error loading scans:', error);
      }
    };
    
    loadScans();
  }, []);

// Handle camera results (capture for review, don't auto-add)
const handleDetected = useCallback((text: string) => {
  if (showDelay) return;

  const raw = text.trim();
  if (!raw) return;

  // Append to rawText for review (dedupe consecutive identical scans)
  setRawText((prev) => {
    const next = prev ? `${prev}\n${raw}` : raw;
    return next;
  });

  // Provide feedback
  try { navigator.vibrate?.(30); } catch {}
  const lineCount = raw.split(/\n+/).filter(Boolean).length;
  notify({
    title: "Scan Captured",
    description: `${lineCount} line${lineCount > 1 ? "s" : ""} added to review`,
  });

  // Delay 4 seconds before next scan
  setShowDelay(true);
  setProgress(0);
  const progressInterval = setInterval(() => {
    setProgress((prev) => {
      if (prev >= 100) {
        clearInterval(progressInterval);
        setShowDelay(false);
        return 0;
      }
      return prev + 2.5; // 100% in 4 seconds
    });
  }, 100);
}, [showDelay, notify]);

  const skipDelay = useCallback(() => {
    setShowDelay(false);
    setProgress(0);
  }, []);


// Parsing helpers
const parseRawToEntries = useCallback(() => {
  const lines = rawText
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const valid: { serial: string; iuc: string }[] = [];
  let invalid = 0;

  for (const line of lines) {
    const [serialRaw, iucRaw] = line.split(/[\,\s]+/);
    const serial = (serialRaw || "").trim();
    const iuc = (iucRaw || "").trim();
    if (SERIAL_REGEX.test(serial) && IUC_REGEX.test(iuc)) {
      valid.push({ serial, iuc });
    } else {
      invalid++;
    }
  }

  return { valid, invalid, total: lines.length };
}, [rawText]);

const addParsedToTable = useCallback(async () => {
  const { valid, invalid, total } = parseRawToEntries();
  if (valid.length === 0) {
    notify({ title: "No valid rows", description: "Please rescan.", variant: "destructive" });
    return;
  }

  let added = 0;
  let skipped = 0;
  const now = Date.now();
  const batchId = now; // use timestamp as batch identifier
  const newEntries: ScanResult[] = [];
  
  try {
    // Check for duplicates and save each valid scan
    for (const [idx, v] of valid.entries()) {
      const isDuplicate = scans.some((s) => s.serial === v.serial);
      if (isDuplicate) {
        skipped++;
      } else {
        // Save to device-specific storage
        const scanRecord = await LocalScanStorage.saveScan(
          `${v.serial},${v.iuc}`, 
          'barcode'
        );
        
        const newEntry: ScanResult = {
          id: scanRecord.id,
          serial: v.serial,
          iuc: v.iuc,
          timestamp: new Date(scanRecord.timestamp),
          isDuplicate: false,
          batchId,
          deviceId: scanRecord.deviceId,
        };
        newEntries.push(newEntry);
        added++;
      }
    }
    
    // Update UI state
    setScans((prev) => [...newEntries, ...prev]);
    
    if (newEntries.length > 0) {
      setLastScanId(newEntries[0].id);
      setLastBatchId(batchId);
    }
    
    // Track last added batch count for undo
    setLastBatchCount(added);
    
    setRawText("");
    try { navigator.vibrate?.(50); } catch {}
    
    notify({ title: "Added to table", description: `${added} new scans saved securely` });
  } catch (error) {
    console.error('Error saving scans:', error);
    notify({ title: "Error", description: "Failed to save scans", variant: "destructive" });
  }
}, [parseRawToEntries, notify, scans]);

const clearRaw = useCallback(() => setRawText(""), []);

  const undoLastScan = useCallback(() => {
    if (scans.length === 0) return;

    console.log('Undo debug:', { 
      lastBatchId, 
      lastBatchCount, 
      scansLength: scans.length,
      firstFewScans: scans.slice(0, 3).map(s => ({ id: s.id, batchId: s.batchId }))
    });

    let removedCount = 0;

    if (lastBatchId != null) {
      setScans((prev) => {
        const toRemove = prev.filter((s) => s.batchId === lastBatchId);
        removedCount = toRemove.length;
        const remaining = prev.filter((s) => s.batchId !== lastBatchId);
        
        console.log('Removing by batchId:', { 
          lastBatchId, 
          toRemoveCount: toRemove.length, 
          remainingCount: remaining.length 
        });
        
        // Update lastScanId to the new most recent scan if any
        setLastScanId(remaining.length > 0 ? remaining[0].id : null);
        
        // Find the next most recent batch ID from remaining scans
        const nextBatch = remaining.find((s) => s.batchId != null);
        setLastBatchId(nextBatch?.batchId ?? null);
        
        return remaining;
      });
    } else {
      // Fallback: remove the most recent scans (up to lastBatchCount)
      const removeCount = Math.min(lastBatchCount > 0 ? lastBatchCount : 1, scans.length);
      removedCount = removeCount;
      console.log('Removing by count (fallback):', { removeCount, lastBatchCount });
      setScans((prev) => {
        const newScans = prev.slice(removeCount);
        // Update lastScanId to the new most recent scan if any
        setLastScanId(newScans.length > 0 ? newScans[0].id : null);
        return newScans;
      });
    }

    // Reset batch tracking after undo
    setLastBatchCount(0);
    setLastBatchId(null);

    // Haptic feedback
    try { navigator.vibrate?.(50); } catch {}

    notify({
      title: "Last batch undone",
      description: `Removed ${removedCount} scan${removedCount !== 1 ? 's' : ''}`,
    });
  }, [scans, lastBatchCount, lastBatchId, notify]);

  const clearAllResults = useCallback(async () => {
    try {
      await LocalScanStorage.clearAllScans();
      setScans([]);
      setLastScanId(null);
      setLastAddedId(null);
      setLastBatchCount(0);
      setLastBatchId(null);
      
      // Haptic feedback
      try { navigator.vibrate?.(100); } catch {}
      
      notify({
        title: "All results cleared",
        description: "Device-specific scans cleared securely"
      });
    } catch (error) {
      console.error('Error clearing scans:', error);
      notify({
        title: "Error",
        description: "Failed to clear scans",
        variant: "destructive"
      });
    }
  }, [notify]);
const exportData = useCallback(() => {
  if (scans.length === 0) {
    notify({ title: "No Data", description: "No scans to export.", variant: "destructive" });
    return;
  }
  
  // Generate filename with current date and time
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-'); // HH-MM-SS
  const suggested = `Tonnex_Scan_${dateStr}_${timeStr}`;
  
  setFileName((prev) => prev || suggested);
  setFileType("xlsx");
  setExportOpen(true);
}, [scans, notify]);

const performExport = useCallback(() => {
  const safeName = (fileName || `Tonnex_Scan_${Date.now()}`).replace(/[^a-zA-Z0-9_\-]/g, "_");
  const createdAt = new Date().toISOString();
  const id = Date.now().toString();

  if (fileType === "csv") {
    let header: string;
    let rows: string[];
    
    if (exportType === "serial") {
      header = "Serial";
      rows = scans.map((s) => s.serial);
    } else if (exportType === "iuc") {
      header = "IUC";
      rows = scans.map((s) => s.iuc);
    } else {
      header = "Serial,IUC";
      rows = scans.map((s) => `${s.serial},${s.iuc}`);
    }
    
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeName}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Save export snapshot to localStorage for Saved Scans page
    const savedEntry: SavedExport = {
      id,
      name: `${safeName}.csv`,
      type: "csv",
      exportType,
      createdAt,
      rowCount: rows.length,
      data: csv,
    };
    try {
      const existing = JSON.parse(localStorage.getItem("tonnex_exports") || "[]");
      const next = [savedEntry, ...existing];
      localStorage.setItem("tonnex_exports", JSON.stringify(next));
      window.dispatchEvent(new Event("tonnex:exports-updated"));
    } catch {}
  } else {
    let data: any[];
    
    if (exportType === "serial") {
      data = scans.map((s) => ({ Serial: s.serial }));
    } else if (exportType === "iuc") {
      data = scans.map((s) => ({ IUC: s.iuc }));
    } else {
      data = scans.map((s) => ({ 
        Serial: s.serial, 
        IUC: s.iuc
      }));
    }
    
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Set column widths to 13 units for all columns
    const colCount = Object.keys(data[0] || {}).length;
    ws['!cols'] = Array(colCount).fill({ wch: 13 });
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Scans");

    // Download file
    XLSX.writeFile(wb, `${safeName}.xlsx`);

    // Also save base64 snapshot to localStorage
    try {
      const base64 = XLSX.write(wb, { bookType: "xlsx", type: "base64" });
      const savedEntry: SavedExport = {
        id,
        name: `${safeName}.xlsx`,
        type: "xlsx",
        exportType,
        createdAt,
        rowCount: data.length,
        data: base64,
      };
      const existing = JSON.parse(localStorage.getItem("tonnex_exports") || "[]");
      const next = [savedEntry, ...existing];
      localStorage.setItem("tonnex_exports", JSON.stringify(next));
      window.dispatchEvent(new Event("tonnex:exports-updated"));
    } catch {}
  }

  notify({ title: "Exported", description: `${scans.length} rows saved as ${safeName}.${fileType}` });
  setExportOpen(false);
  
  // Clear scan results after successful export
  setScans([]);
  setLastAddedId(null);
}, [fileName, fileType, exportType, scans, notify]);

  return (
    <div className="min-h-screen bg-background fade-in">
      {/* Header */}
      <header className="bg-card border-b shadow-sm">
        <div className="px-4 py-4 relative flex items-center">
          <Button asChild variant="ghost" size="icon">
            <Link to="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          
          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-3">
            <div className="p-1.5 bg-gradient-primary rounded-xl">
              <QrCode className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold">Scanner</h1>
          </div>
        </div>
      </header>

<main className="px-4 py-6 pb-28 max-w-full mx-auto">
  {/* Scanner Section */}
  <Card className="p-4 md:p-6 mb-4 md:mb-6">
    <div className="text-center">
      {/* Camera Preview */}
      <div className="relative bg-muted rounded-xl h-[44vh] md:h-64 mb-4 md:mb-6 overflow-hidden">
        <BarcodeScanner active={!showDelay && isScanning} onResult={handleDetected} />

        {/* QR Scanner Animation Overlay */}
        {!showDelay && isScanning && (
          <div className="scanner-overlay">
            {/* Moving scan line */}
            <div className="scanner-line"></div>
            
            {/* Corner brackets */}
            <div className="scanner-corners">
              <div className="scanner-corner top-left"></div>
              <div className="scanner-corner top-right"></div>
              <div className="scanner-corner bottom-left"></div>
              <div className="scanner-corner bottom-right"></div>
            </div>
            
            {/* Target area */}
            <div className="scanner-target"></div>
            
            {/* Grid overlay */}
            <div className="scanner-grid"></div>
          </div>
        )}

        {/* Instructional hint */}
        <div className="absolute inset-x-0 bottom-4 text-center text-muted-foreground pointer-events-none">
          <p className="text-sm">Point camera at barcode to scan</p>
        </div>
      </div>

      {/* Progress Bar */}
      {showDelay && (
        <div className="mb-2 md:mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Next scan in...</p>
            <Button 
              onClick={skipDelay} 
              variant="outline" 
              size="sm"
            >
              <SkipForward className="mr-1 h-4 w-4" />
              Skip Delay
            </Button>
          </div>
          <Progress value={progress} className="h-2" data-animated="true" />
        </div>
      )}
    </div>
  </Card>

  {/* Raw scan review */}
  <Card className="p-4 md:p-6 mb-6">
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-semibold">Review Scan</h3>
      <span className="text-sm text-muted-foreground">
        {parseRawToEntries().valid.length} records detected
      </span>
    </div>
    <Textarea
      value={rawText}
      onChange={(e) => setRawText(e.target.value)}
      placeholder="Scanned text will appear here... Each line: SERIAL,IUC"
      className="min-h-[140px] font-mono"
    />
    <div className="flex gap-2 justify-end mt-3">
      <Button variant="outline" onClick={clearRaw} disabled={!rawText}>
        <X className="mr-2 h-4 w-4" /> Clear
      </Button>
      <Button onClick={addParsedToTable} disabled={!parseRawToEntries().valid.length}>
        <Plus className="mr-2 h-4 w-4" /> Add to Table
      </Button>
    </div>
  </Card>

        {/* Scan Results */}
        <div className="w-full">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Scan Results</h3>
              <span className="text-sm text-muted-foreground">{scans.length} scans</span>
            </div>
            
            {scans.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground">
                  <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No scans yet</p>
                  <p className="text-sm">Start scanning to see results here.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {scans.map((scan) => (
                  <div 
                    key={scan.id}
                    data-scan-id={scan.id}
                    className={`relative p-3 rounded-lg border flex items-center transition-all duration-200 ${
                      scan.isDuplicate ? 'bg-destructive/10 border-destructive/20' : 'bg-card hover:bg-muted/50 hover:shadow-md'
                    } ${lastAddedId === scan.id && !scan.isDuplicate ? 'ring-2 ring-success/50 success-pulse' : ''}`}
                  >
                    {lastAddedId === scan.id && !scan.isDuplicate && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-success text-success-foreground rounded-full p-1 shadow-md checkmark-pop">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4 flex-1 text-sm">
                      <div>
                        <span className="font-medium text-muted-foreground">Serial:</span>
                        <div className="font-mono">{scan.serial}</div>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">IUC:</span>
                        <div className="font-mono">{scan.iuc}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Action Buttons */}
            {scans.length > 0 && (
              <div className="space-y-3 mt-6 px-1">
                {/* First row: Undo Last and Clear Results side-by-side */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => setUndoConfirmOpen(true)}
                    variant="outline"
                    size="sm"
                    disabled={scans.length === 0}
                    className="min-h-[44px] touch-manipulation hover:bg-secondary-hover transition-colors"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Undo Last
                  </Button>
                  <Button
                    onClick={() => setClearConfirmOpen(true)}
                    variant="destructive"
                    size="sm"
                    className="min-h-[44px] touch-manipulation bg-destructive hover:bg-destructive/90 text-destructive-foreground transition-colors"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear Results
                  </Button>
                </div>
                
                {/* Second row: Export button centered */}
                <div className="flex justify-center">
                  <Button
                    onClick={exportData}
                    size="sm"
                    className="min-h-[44px] touch-manipulation bg-success hover:bg-success/90 text-success-foreground transition-colors px-8"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export ({scans.length})
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Credits Section */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground/70">
              THIS APP WAS DESIGNED AND VISIONED BY RICHY OGIEMUDIA
            </p>
          </div>
        </div>

        {/* Clear Confirmation Dialog */}
        <Dialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Clear All Results
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to clear all results? This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2">
              <Button 
                variant="ghost" 
                onClick={() => setClearConfirmOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => {
                  clearAllResults();
                  setClearConfirmOpen(false);
                }}
                className="flex-1"
              >
                Yes, Clear
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Undo Confirmation Dialog */}
        <Dialog open={undoConfirmOpen} onOpenChange={setUndoConfirmOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-primary" />
                Undo Last Scan
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to undo the last batch of scans? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2">
              <Button 
                variant="ghost" 
                onClick={() => setUndoConfirmOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  undoLastScan();
                  setUndoConfirmOpen(false);
                }}
                className="flex-1"
              >
                Yes, Undo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Export Dialog */}
        <Dialog open={exportOpen} onOpenChange={setExportOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Download className="h-4 w-4 text-primary" />
                Export Data
              </DialogTitle>
              <DialogDescription className="text-sm">
                Configure export settings and download scan results.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-3">
              {/* Export Type Section */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1">
                  <FileSpreadsheet className="h-3 w-3 text-primary" />
                  What to export
                </Label>
                <RadioGroup value={exportType} onValueChange={(value: "both" | "serial" | "iuc") => setExportType(value)} className="space-y-1">
                  <div className="flex items-center space-x-2 rounded border p-2 hover:bg-muted/50">
                    <RadioGroupItem value="both" id="both" className="h-3 w-3" />
                    <Label htmlFor="both" className="flex-1 cursor-pointer text-sm">
                      Serial & IUC Numbers
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 rounded border p-2 hover:bg-muted/50">
                    <RadioGroupItem value="serial" id="serial" className="h-3 w-3" />
                    <Label htmlFor="serial" className="flex-1 cursor-pointer text-sm">
                      Serial Numbers Only
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 rounded border p-2 hover:bg-muted/50">
                    <RadioGroupItem value="iuc" id="iuc" className="h-3 w-3" />
                    <Label htmlFor="iuc" className="flex-1 cursor-pointer text-sm">
                      IUC Numbers Only
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* File Format Section */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1">
                  <FileText className="h-3 w-3 text-primary" />
                  File format
                </Label>
                <RadioGroup value={fileType} onValueChange={(value: "csv" | "xlsx") => setFileType(value)} className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2 rounded border p-2 hover:bg-muted/50">
                    <RadioGroupItem value="xlsx" id="xlsx" className="h-3 w-3" />
                    <Label htmlFor="xlsx" className="cursor-pointer text-sm">Excel</Label>
                  </div>
                  <div className="flex items-center space-x-2 rounded border p-2 hover:bg-muted/50">
                    <RadioGroupItem value="csv" id="csv" className="h-3 w-3" />
                    <Label htmlFor="csv" className="cursor-pointer text-sm">CSV</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* File Name Section */}
              <div className="space-y-2">
                <Label htmlFor="filename" className="text-sm font-medium">File name</Label>
                <Input 
                  id="filename" 
                  value={fileName} 
                  onChange={(e) => setFileName(e.target.value)} 
                  placeholder="Enter file name" 
                  className="h-8"
                />
                <p className="text-xs text-muted-foreground">
                  Saved as: <span className="font-mono">{(fileName || "Tonnex_Scan").replace(/[^a-zA-Z0-9_\-]/g, "_")}.{fileType}</span>
                </p>
              </div>

              {/* Summary */}
              <div className="bg-muted/50 rounded p-2">
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <div>• {scans.length} scans • {fileType.toUpperCase()} format</div>
                  <div>• {exportType === "both" ? "Serial & IUC" : exportType === "serial" ? "Serial only" : "IUC only"}</div>
                </div>
              </div>
            </div>
            
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setExportOpen(false)} className="flex-1 h-8">
                Cancel
              </Button>
              <Button onClick={performExport} className="flex-1 h-8">
                <Download className="mr-1 h-3 w-3" /> 
                Export
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Scanner;
