import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, FileUp, Calendar, Hash, FileSpreadsheet, Search, SortAsc, SortDesc, FileType, Trash2, Database, Smartphone, Shield, FileText } from "lucide-react";
import { useDeviceScans } from "@/hooks/useDeviceScans";
import { Badge } from "@/components/ui/badge";
import { toast as sonnerToast } from "@/components/ui/sonner";
import * as XLSX from "xlsx";

interface SavedExport {
  id: string;
  name: string;
  type: "csv" | "xlsx";
  exportType: "both" | "serial" | "iuc";
  createdAt: string; // ISO
  rowCount: number;
  data: string; // csv text or base64 for xlsx
}

const STORAGE_KEY = "tonnex_exports";

const SavedData = () => {
  const { scans, loading, deleteScan } = useDeviceScans();
  const [exports, setExports] = useState<SavedExport[]>([]);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "csv" | "xlsx">("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "count" | "type">("date");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [exportOpen, setExportOpen] = useState(false);
  const [selectedScanId, setSelectedScanId] = useState<string>("");
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState<"csv" | "xlsx">("xlsx");
  const [exportType, setExportType] = useState<"both" | "serial" | "iuc">("both");

  // Toast adapter
  const notify = useCallback((opts: { title: string; description?: string; variant?: "destructive" | "default" }) => {
    const fn: any = opts.variant === "destructive" ? (sonnerToast as any).error : sonnerToast;
    if (opts.description) fn(opts.title, { description: opts.description }); else fn(opts.title);
  }, []);

  // SEO
  useEffect(() => {
    document.title = "Saved Scans | Tonnex BarScan";
    const desc = "View and export your saved barcode scans";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);
  }, []);

  const loadExports = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const list: SavedExport[] = raw ? JSON.parse(raw) : [];
      setExports(list);
    } catch {
      setExports([]);
    }
  }, []);

  useEffect(() => {
    loadExports();
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === STORAGE_KEY) loadExports();
    };
    const onCustom = () => loadExports();
    window.addEventListener("storage", onStorage);
    window.addEventListener("tonnex:exports-updated", onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("tonnex:exports-updated", onCustom as EventListener);
    };
  }, [loadExports]);

  const filteredExports = useMemo(() => {
    let list = [...exports];
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((e) => e.name.toLowerCase().includes(q));
    }
    if (typeFilter !== "all") {
      list = list.filter((e) => e.type === typeFilter);
    }

    list.sort((a, b) => {
      let val = 0;
      if (sortBy === "date") val = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === "name") val = a.name.localeCompare(b.name);
      if (sortBy === "count") val = a.rowCount - b.rowCount;
      if (sortBy === "type") val = a.type.localeCompare(b.type);
      return sortDir === "asc" ? val : -val;
    });

    return list;
  }, [exports, query, typeFilter, sortBy, sortDir]);

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const openExportDialog = (scanId: string) => {
    setSelectedScanId(scanId);
    
    // Generate filename with current date and time
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-'); // HH-MM-SS
    const suggested = `Tonnex_Scan_${dateStr}_${timeStr}`;
    
    setFileName(suggested);
    setFileType("xlsx");
    setExportType("both");
    setExportOpen(true);
  };

  const performExport = useCallback(() => {
    const selectedScan = scans.find(s => s.id === selectedScanId);
    if (!selectedScan) {
      notify({ title: "Error", description: "Scan not found", variant: "destructive" });
      return;
    }

    // Parse the scan content to extract serial and IUC
    const [serial, iuc] = selectedScan.content.split(',').map(s => s.trim());
    if (!serial || !iuc) {
      notify({ title: "Error", description: "Invalid scan data format", variant: "destructive" });
      return;
    }

    const safeName = (fileName || `Tonnex_Scan_${Date.now()}`).replace(/[^a-zA-Z0-9_\-]/g, "_");
    const createdAt = new Date().toISOString();
    const id = Date.now().toString();

    if (fileType === "csv") {
      let header: string;
      let row: string;
      
      if (exportType === "serial") {
        header = "Serial";
        row = serial;
      } else if (exportType === "iuc") {
        header = "IUC";
        row = iuc;
      } else {
        header = "Serial,IUC";
        row = `${serial},${iuc}`;
      }
      
      const csv = [header, row].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safeName}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Save export snapshot to localStorage
      const savedEntry: SavedExport = {
        id,
        name: `${safeName}.csv`,
        type: "csv",
        exportType,
        createdAt,
        rowCount: 1,
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
        data = [{ Serial: serial }];
      } else if (exportType === "iuc") {
        data = [{ IUC: iuc }];
      } else {
        data = [{ Serial: serial, IUC: iuc }];
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
          rowCount: 1,
          data: base64,
        };
        const existing = JSON.parse(localStorage.getItem("tonnex_exports") || "[]");
        const next = [savedEntry, ...existing];
        localStorage.setItem("tonnex_exports", JSON.stringify(next));
        window.dispatchEvent(new Event("tonnex:exports-updated"));
      } catch {}
    }

    notify({ title: "Exported", description: `Scan exported as ${safeName}.${fileType}` });
    setExportOpen(false);
  }, [selectedScanId, scans, fileName, fileType, exportType, notify]);

  const removeExport = (id: string) => {
    try {
      const next = exports.filter((e) => e.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setExports(next);
    } catch {}
  };

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
              <FileSpreadsheet className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold whitespace-nowrap">Saved Scans</h1>
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 py-6 max-w-full md:max-w-5xl mx-auto">
        {loading ? (
          <Card className="p-12 text-center">
            <div className="text-muted-foreground">
              <FileSpreadsheet className="h-16 w-16 mx-auto mb-4 opacity-50 animate-pulse" />
              <h3 className="text-xl font-semibold mb-2">Loading...</h3>
              <p className="text-sm">Loading your saved scans...</p>
            </div>
          </Card>
        ) : scans.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-muted-foreground">
              <FileSpreadsheet className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No saved scans</h3>
              <p className="text-sm mb-6">Scan some barcodes to see your data here.</p>
              <Button asChild>
                <Link to="/scanner">Go to Scanner</Link>
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Saved Scans */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                <Database className="h-4 w-4" />
                Saved Scans ({scans.length})
              </h4>
              {scans.map((scan) => {
                const [serial, iuc] = scan.content.split(',').map(s => s.trim());
                const scanDate = new Date(scan.timestamp);
                
                return (
                  <Card key={scan.id} className="p-4 md:p-5 hover:shadow-sm transition">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground font-medium">Serial:</span>
                            <span className="font-mono text-sm">{serial || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground font-medium">IUC:</span>
                            <span className="font-mono text-sm">{iuc || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{scanDate.toLocaleDateString()} {scanDate.toLocaleTimeString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4" />
                            <span className="truncate">{scan.deviceId.slice(-8)}</span>
                          </div>
                        </div>
                        {scan.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{scan.notes}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => openExportDialog(scan.id)}>
                          <FileUp className="mr-2 h-4 w-4" />
                          Export
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Delete saved scan">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Scan</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this scan? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteScan(scan.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Export Dialog */}
        <Dialog open={exportOpen} onOpenChange={setExportOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <FileUp className="h-4 w-4 text-primary" />
                Export Scan Data
              </DialogTitle>
              <DialogDescription className="text-sm">
                Configure export settings and download the selected scan.
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
                  <div>• 1 scan • {fileType.toUpperCase()} format</div>
                  <div>• {exportType === "both" ? "Serial & IUC" : exportType === "serial" ? "Serial only" : "IUC only"}</div>
                </div>
              </div>
            </div>
            
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setExportOpen(false)} className="flex-1 h-8">
                Cancel
              </Button>
              <Button onClick={performExport} className="flex-1 h-8">
                <FileUp className="mr-1 h-3 w-3" /> 
                Export
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default SavedData;
