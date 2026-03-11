import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Search, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// --- Asset colors ---
const assetColors: Record<string, string> = {
  EUR: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  USD: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
  "USDT-TRC20": "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800",
  "USDT-ERC20": "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800",
  BTC: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
  ETH: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
  GBP: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800",
};
const fallbackColors = [
  "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-800",
  "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
  "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800",
];
const getAssetColor = (asset: string) =>
  assetColors[asset] || fallbackColors[Math.abs([...asset].reduce((a, c) => a + c.charCodeAt(0), 0)) % fallbackColors.length];

interface VolumeEntry { asset: string; quantity: number; }

interface Vendor {
  id: number;
  name: string;
  note: string;
  createdAtUtc: string;
  tradeCount: number;
  totalVolumeLcy: number;
  netFeeLcy: number;
  lastTradeAtUtc: string;
  volumes: VolumeEntry[];
}

const initialData: Vendor[] = [
  {
    id: 1, name: "Jax", note: "",
    createdAtUtc: "2026-03-06T03:20:09.1658196+00:00",
    tradeCount: 1, totalVolumeLcy: 1000, netFeeLcy: -49.52,
    lastTradeAtUtc: "2026-03-06T14:49:00+00:00",
    volumes: [{ asset: "EUR", quantity: 1000 }],
  },
];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const formatNum = (n: number, dec = 2) =>
  n.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec });

type SortField = "name" | "tradeCount" | "totalVolumeLcy" | "netFeeLcy" | "lastTradeAtUtc";
type TradeFilter = "all" | "1+" | "5+" | "10+";
type FeeFilter = "all" | "positive" | "negative";

const emptyForm = { name: "" };

const Vendors = () => {
  const [data, setData] = useState<Vendor[]>(initialData);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortField>("name");
  const [tradeFilter, setTradeFilter] = useState<TradeFilter>("all");
  const [feeFilter, setFeeFilter] = useState<FeeFilter>("all");

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const activeFilterCount = [tradeFilter !== "all", feeFilter !== "all"].filter(Boolean).length;

  const clearFilters = () => { setSearch(""); setTradeFilter("all"); setFeeFilter("all"); setSortBy("name"); };

  const filtered = useMemo(() => {
    let result = data.filter((v) => v.name.toLowerCase().includes(search.toLowerCase()));

    if (tradeFilter === "1+") result = result.filter((v) => v.tradeCount >= 1);
    else if (tradeFilter === "5+") result = result.filter((v) => v.tradeCount >= 5);
    else if (tradeFilter === "10+") result = result.filter((v) => v.tradeCount >= 10);

    if (feeFilter === "positive") result = result.filter((v) => v.netFeeLcy >= 0);
    else if (feeFilter === "negative") result = result.filter((v) => v.netFeeLcy < 0);

    result.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "tradeCount") return b.tradeCount - a.tradeCount;
      if (sortBy === "totalVolumeLcy") return b.totalVolumeLcy - a.totalVolumeLcy;
      if (sortBy === "netFeeLcy") return b.netFeeLcy - a.netFeeLcy;
      if (sortBy === "lastTradeAtUtc") return new Date(b.lastTradeAtUtc).getTime() - new Date(a.lastTradeAtUtc).getTime();
      return 0;
    });
    return result;
  }, [data, search, tradeFilter, feeFilter, sortBy]);

  const openAdd = () => { setEditingVendor(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (v: Vendor) => { setEditingVendor(v); setForm({ name: v.name }); setModalOpen(true); };
  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editingVendor) {
      setData((prev) => prev.map((v) => v.id === editingVendor.id ? { ...v, name: form.name } : v));
    } else {
      setData((prev) => [...prev, {
        id: Date.now(), name: form.name, createdAtUtc: new Date().toISOString(),
        tradeCount: 0, totalVolumeLcy: 0, netFeeLcy: 0, lastTradeAtUtc: "", volumes: [],
      }]);
    }
    setModalOpen(false);
  };
  const confirmDelete = () => {
    if (deleteId !== null) {
      setData((prev) => prev.filter((v) => v.id !== deleteId));
      setDeleteId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Vendors</h1>
        <Button className="gap-2" onClick={openAdd}>
          <Plus className="h-4 w-4" /> Add Vendor
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm">
        {/* Filters */}
        <div className="p-3 border-b border-border flex flex-wrap items-center gap-2">
          <div className="relative w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-sm" />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>

          <Select value={tradeFilter} onValueChange={(v) => setTradeFilter(v as TradeFilter)}>
            <SelectTrigger className="h-8 w-[110px] text-xs"><SelectValue placeholder="Trades" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All trades</SelectItem>
              <SelectItem value="1+">1+ trades</SelectItem>
              <SelectItem value="5+">5+ trades</SelectItem>
              <SelectItem value="10+">10+ trades</SelectItem>
            </SelectContent>
          </Select>

          <Select value={feeFilter} onValueChange={(v) => setFeeFilter(v as FeeFilter)}>
            <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue placeholder="Net Fee" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All fees</SelectItem>
              <SelectItem value="positive">Positive fee</SelectItem>
              <SelectItem value="negative">Negative fee</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortField)}>
            <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="Sort by" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="tradeCount">Trade count</SelectItem>
              <SelectItem value="totalVolumeLcy">Volume</SelectItem>
              <SelectItem value="netFeeLcy">Net fee</SelectItem>
              <SelectItem value="lastTradeAtUtc">Last trade</SelectItem>
            </SelectContent>
          </Select>

          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs gap-1 text-muted-foreground">
              <X className="h-3 w-3" /> Clear ({activeFilterCount})
            </Button>
          )}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-center">Trades</TableHead>
              <TableHead className="text-right">Volume (LCY)</TableHead>
              <TableHead className="text-right">Net Fee (LCY)</TableHead>
              <TableHead>Volumes</TableHead>
              <TableHead className="text-right">Last Trade</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No vendors found.</TableCell>
              </TableRow>
            ) : (
              filtered.map((v) => (
                <>
                  <TableRow key={v.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}>
                    <TableCell className="font-semibold">{v.name}</TableCell>
                    <TableCell className="text-center font-mono">{v.tradeCount}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatNum(v.totalVolumeLcy)}</TableCell>
                    <TableCell className="text-right">
                      <span className={`font-mono text-sm font-semibold ${v.netFeeLcy >= 0 ? "text-accent" : "text-destructive"}`}>
                        {formatNum(v.netFeeLcy)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {v.volumes.length === 0 ? (
                        <span className="text-muted-foreground text-xs">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {v.volumes.map((vol, i) => (
                            <Badge key={i} variant="outline" className={`font-mono text-sm font-medium ${getAssetColor(vol.asset)}`}>
                              {formatNum(vol.quantity)} {vol.asset}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                      {v.lastTradeAtUtc ? formatDate(v.lastTradeAtUtc) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEdit(v); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(v.id); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        {expandedId === v.id ? <ChevronUp className="h-4 w-4 text-muted-foreground mt-2" /> : <ChevronDown className="h-4 w-4 text-muted-foreground mt-2" />}
                      </div>
                    </TableCell>
                  </TableRow>

                  {expandedId === v.id && (
                    <TableRow key={`${v.id}-exp`}>
                      <TableCell colSpan={7} className="bg-muted/30 px-6 py-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Created</p>
                            <p className="font-mono">{formatDate(v.createdAtUtc)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Total Volume</p>
                            <p className="font-mono">{formatNum(v.totalVolumeLcy)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Net Fee</p>
                            <p className={`font-mono font-semibold ${v.netFeeLcy >= 0 ? "text-accent" : "text-destructive"}`}>{formatNum(v.netFeeLcy)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Trade Count</p>
                            <p className="font-mono">{v.tradeCount}</p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingVendor ? "Edit Vendor" : "Add Vendor"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="vendor-name">Name</Label>
              <Input id="vendor-name" placeholder="Vendor name" value={form.name} onChange={(e) => setForm({ name: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name.trim()}>{editingVendor ? "Save Changes" : "Add Vendor"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. Are you sure?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Vendors;
