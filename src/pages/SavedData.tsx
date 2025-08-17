import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, Download, Calendar, Hash, FileSpreadsheet, Search, SortAsc, SortDesc, FileType, Trash2, Database, Smartphone, Shield } from "lucide-react";
import { useDeviceScans } from "@/hooks/useDeviceScans";
import { Badge } from "@/components/ui/badge";

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
  const [exports, setExports] = useState<SavedExport[]>([]);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "csv" | "xlsx">("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "count" | "type">("date");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  // SEO
  useEffect(() => {
    document.title = "Saved Scans | Tonnex BarScan";
    const desc = "Browse, search, and download your saved scan exports";
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

  const downloadExport = (item: SavedExport) => {
    if (item.type === "csv") {
      const blob = new Blob([item.data], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = item.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      // base64 to Blob
      const byteChars = atob(item.data);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = item.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

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
            <h1 className="text-xl font-semibold whitespace-nowrap">Exported Files</h1>
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 py-6 max-w-full md:max-w-5xl mx-auto">
        {exports.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-muted-foreground">
              <FileSpreadsheet className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No exported files</h3>
              <p className="text-sm mb-6">Export your scan data to see files saved here.</p>
              <Button asChild>
                <Link to="/scanner">Go to Scanner</Link>
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Controls */}
            <Card className="p-4">
              <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                <div className="flex-1 flex items-center gap-2">
                  <div className="relative w-full md:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search by file name..."
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="xlsx">Excel</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="count">Rows</SelectItem>
                      <SelectItem value="type">Type</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="outline" size="icon" onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}>
                    {sortDir === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Export Files */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Export Files ({filteredExports.length})
              </h4>
              {filteredExports.map((item) => (
                <Card key={item.id} className="p-4 md:p-5 hover:shadow-sm transition">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold truncate">{item.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {item.type.toUpperCase()} • {item.exportType}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(item.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4" />
                          <span>{item.rowCount} rows</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => downloadExport(item)}>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Delete saved export">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Export</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{item.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => removeExport(item.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SavedData;
