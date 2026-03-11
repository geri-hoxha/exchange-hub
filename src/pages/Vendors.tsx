import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Search, X, ChevronDown, ChevronRight } from "lucide-react";
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

// --- Types ---
interface VolumeEntry { asset: string; quantity: number; }

interface VendorPurchase {
  id: number;
  vendorId: number;
  occurredAtUtc: string;
  asset: string;
  quantity: number;
  paidWithAsset: string;
  paidWithQuantity: number;
  boughtAssetCostLcy: number;
  paidWithAssetCostLcy: number;
  unitCostLcy: number;
  vendorFeeLcy: number;
  createdAtUtc: string;
}

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

// --- Initial data ---
const initialVendors: Vendor[] = [
  {
    id: 1, name: "Jax", note: "",
    createdAtUtc: "2026-03-06T03:20:09.1658196+00:00",
    tradeCount: 1, totalVolumeLcy: 1000, netFeeLcy: -49.52,
    lastTradeAtUtc: "2026-03-06T14:49:00+00:00",
    volumes: [{ asset: "EUR", quantity: 1000 }],
  },
];

const initialPurchases: VendorPurchase[] = [
  {
    id: 10003, vendorId: 1, occurredAtUtc: "2026-03-06T14:49:00+00:00",
    asset: "EUR", quantity: 1000, paidWithAsset: "USDT-TRC20", paidWithQuantity: 1100,
    boughtAssetCostLcy: 1000, paidWithAssetCostLcy: 950.48, unitCostLcy: 0.95048,
    vendorFeeLcy: -49.52, createdAtUtc: "2026-03-06T15:49:43.0878695+00:00",
  },
];

// --- Helpers ---
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const formatNum = (n: number, dec = 2) =>
  n.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec });

type SortField = "name" | "tradeCount" | "totalVolumeLcy" | "netFeeLcy" | "lastTradeAtUtc";
type TradeFilter = "all" | "1+" | "5+" | "10+";
type FeeFilter = "all" | "positive" | "negative";

const emptyVendorForm = { name: "", note: "" };

const emptyPurchaseForm = {
  asset: "", quantity: "", paidWithAsset: "", paidWithQuantity: "",
  actualTotalCostLcy: "",
  occurredAtUtc: new Date().toISOString().slice(0, 16),
  referenceNo: "", note: "",
};

const COL_COUNT = 9;

const Vendors = () => {
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [purchases, setPurchases] = useState<VendorPurchase[]>(initialPurchases);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [sortBy, setSortBy] = useState<SortField>("name");
  const [tradeFilter, setTradeFilter] = useState<TradeFilter>("all");
  const [feeFilter, setFeeFilter] = useState<FeeFilter>("all");

  // Vendor modal
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [vendorForm, setVendorForm] = useState(emptyVendorForm);

  // Purchase modal
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [purchaseVendorId, setPurchaseVendorId] = useState<number | null>(null);
  const [purchaseForm, setPurchaseForm] = useState(emptyPurchaseForm);

  // Delete
  const [deleteVendorId, setDeleteVendorId] = useState<number | null>(null);
  const [deletePurchaseId, setDeletePurchaseId] = useState<number | null>(null);

  const activeFilterCount = [tradeFilter !== "all", feeFilter !== "all"].filter(Boolean).length;
  const clearFilters = () => { setSearch(""); setTradeFilter("all"); setFeeFilter("all"); setSortBy("name"); };

  const toggleExpand = (id: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const filtered = useMemo(() => {
    let result = vendors.filter((v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.note.toLowerCase().includes(search.toLowerCase())
    );

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
  }, [vendors, search, tradeFilter, feeFilter, sortBy]);

  // Vendor CRUD
  const openAddVendor = () => { setEditingVendor(null); setVendorForm(emptyVendorForm); setVendorModalOpen(true); };
  const openEditVendor = (v: Vendor) => { setEditingVendor(v); setVendorForm({ name: v.name, note: v.note }); setVendorModalOpen(true); };
  const saveVendor = () => {
    if (!vendorForm.name.trim()) return;
    if (editingVendor) {
      setVendors((prev) => prev.map((v) => v.id === editingVendor.id ? { ...v, name: vendorForm.name, note: vendorForm.note } : v));
    } else {
      setVendors((prev) => [...prev, {
        id: Date.now(), name: vendorForm.name, note: vendorForm.note, createdAtUtc: new Date().toISOString(),
        tradeCount: 0, totalVolumeLcy: 0, netFeeLcy: 0, lastTradeAtUtc: "", volumes: [],
      }]);
    }
    setVendorModalOpen(false);
  };
  const confirmDeleteVendor = () => {
    if (deleteVendorId !== null) {
      setVendors((prev) => prev.filter((v) => v.id !== deleteVendorId));
      setPurchases((prev) => prev.filter((p) => p.vendorId !== deleteVendorId));
      setDeleteVendorId(null);
    }
  };

  // Purchase CRUD
  const openAddPurchase = (vendorId: number) => {
    setPurchaseVendorId(vendorId);
    setPurchaseForm(emptyPurchaseForm);
    setPurchaseModalOpen(true);
  };
  const savePurchase = () => {
    if (!purchaseForm.asset.trim() || !purchaseVendorId) return;
    const newPurchase: VendorPurchase = {
      id: Date.now(),
      vendorId: purchaseVendorId,
      asset: purchaseForm.asset,
      quantity: parseFloat(purchaseForm.quantity) || 0,
      paidWithAsset: purchaseForm.paidWithAsset,
      paidWithQuantity: parseFloat(purchaseForm.paidWithQuantity) || 0,
      boughtAssetCostLcy: parseFloat(purchaseForm.actualTotalCostLcy) || 0,
      paidWithAssetCostLcy: 0,
      unitCostLcy: 0,
      vendorFeeLcy: 0,
      occurredAtUtc: new Date(purchaseForm.occurredAtUtc).toISOString(),
      createdAtUtc: new Date().toISOString(),
    };
    setPurchases((prev) => [...prev, newPurchase]);
    setPurchaseModalOpen(false);
  };
  const confirmDeletePurchase = () => {
    if (deletePurchaseId !== null) {
      setPurchases((prev) => prev.filter((p) => p.id !== deletePurchaseId));
      setDeletePurchaseId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Vendors</h1>
        <Button className="gap-2" onClick={openAddVendor}>
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
              <TableHead className="w-[40px]" />
              <TableHead>Name</TableHead>
              <TableHead>Note</TableHead>
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
                <TableCell colSpan={COL_COUNT} className="text-center py-12 text-muted-foreground">No vendors found.</TableCell>
              </TableRow>
            ) : (
              filtered.map((v) => {
                const isExpanded = expanded.has(v.id);
                const vendorPurchases = purchases.filter((p) => p.vendorId === v.id);
                return (
                  <>
                    <TableRow key={v.id}>
                      <TableCell className="pr-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleExpand(v.id)}>
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                      </TableCell>
                      <TableCell className="font-semibold">{v.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{v.note || "—"}</TableCell>
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
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditVendor(v)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteVendorId(v.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow key={`${v.id}-purchases`} className="bg-muted/30 hover:bg-muted/30">
                        <TableCell colSpan={COL_COUNT} className="p-0">
                          <div className="px-6 py-4 pl-12">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-sm font-semibold text-foreground">Purchases</h3>
                              <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={() => openAddPurchase(v.id)}>
                                <Plus className="h-3 w-3" /> Add
                              </Button>
                            </div>

                            {vendorPurchases.length === 0 ? (
                              <p className="text-sm text-muted-foreground py-4 text-center">No purchases yet.</p>
                            ) : (
                              <div className="rounded-lg border border-border overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="bg-muted/50">
                                      <TableHead className="text-xs">Date</TableHead>
                                      <TableHead className="text-xs">Bought</TableHead>
                                      <TableHead className="text-xs text-right">Qty</TableHead>
                                      <TableHead className="text-xs">Paid With</TableHead>
                                      <TableHead className="text-xs text-right">Paid Qty</TableHead>
                                      <TableHead className="text-xs text-right">Cost (LCY)</TableHead>
                                      <TableHead className="text-xs text-right">Unit Cost</TableHead>
                                      <TableHead className="text-xs text-right">Fee (LCY)</TableHead>
                                      <TableHead className="text-xs w-[50px]" />
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {vendorPurchases.map((p) => (
                                      <TableRow key={p.id}>
                                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(p.occurredAtUtc)}</TableCell>
                                        <TableCell>
                                          <Badge variant="outline" className={`font-mono text-xs ${getAssetColor(p.asset)}`}>{p.asset}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm">{formatNum(p.quantity)}</TableCell>
                                        <TableCell>
                                          <Badge variant="outline" className={`font-mono text-xs ${getAssetColor(p.paidWithAsset)}`}>{p.paidWithAsset}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm">{formatNum(p.paidWithQuantity)}</TableCell>
                                        <TableCell className="text-right font-mono text-sm">{formatNum(p.boughtAssetCostLcy)}</TableCell>
                                        <TableCell className="text-right font-mono text-xs text-muted-foreground">{formatNum(p.unitCostLcy, 5)}</TableCell>
                                        <TableCell className="text-right">
                                          <span className={`font-mono text-sm font-medium ${p.vendorFeeLcy >= 0 ? "text-accent" : "text-destructive"}`}>
                                            {formatNum(p.vendorFeeLcy)}
                                          </span>
                                        </TableCell>
                                        <TableCell>
                                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeletePurchaseId(p.id)}>
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Vendor Add/Edit Modal */}
      <Dialog open={vendorModalOpen} onOpenChange={setVendorModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingVendor ? "Edit Vendor" : "Add Vendor"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="vendor-name">Name</Label>
              <Input id="vendor-name" placeholder="Vendor name" value={vendorForm.name} onChange={(e) => setVendorForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor-note">Note</Label>
              <Input id="vendor-note" placeholder="Optional note" value={vendorForm.note} onChange={(e) => setVendorForm((f) => ({ ...f, note: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVendorModalOpen(false)}>Cancel</Button>
            <Button onClick={saveVendor} disabled={!vendorForm.name.trim()}>{editingVendor ? "Save Changes" : "Add Vendor"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Purchase Add Modal */}
      <Dialog open={purchaseModalOpen} onOpenChange={setPurchaseModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Purchase</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label>Asset (Bought)</Label>
              <Input placeholder="e.g. EUR" value={purchaseForm.asset} onChange={(e) => setPurchaseForm((f) => ({ ...f, asset: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input type="number" placeholder="0.00" value={purchaseForm.quantity} onChange={(e) => setPurchaseForm((f) => ({ ...f, quantity: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Paid With Asset</Label>
              <Input placeholder="e.g. USDT-TRC20" value={purchaseForm.paidWithAsset} onChange={(e) => setPurchaseForm((f) => ({ ...f, paidWithAsset: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Paid With Quantity</Label>
              <Input type="number" placeholder="0.00" value={purchaseForm.paidWithQuantity} onChange={(e) => setPurchaseForm((f) => ({ ...f, paidWithQuantity: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Actual Total Cost (LCY)</Label>
              <Input type="number" placeholder="0.00" value={purchaseForm.actualTotalCostLcy} onChange={(e) => setPurchaseForm((f) => ({ ...f, actualTotalCostLcy: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Occurred At</Label>
              <Input type="datetime-local" value={purchaseForm.occurredAtUtc} onChange={(e) => setPurchaseForm((f) => ({ ...f, occurredAtUtc: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Reference No</Label>
              <Input placeholder="REF-XXX" value={purchaseForm.referenceNo} onChange={(e) => setPurchaseForm((f) => ({ ...f, referenceNo: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Note</Label>
              <Input placeholder="Optional note" value={purchaseForm.note} onChange={(e) => setPurchaseForm((f) => ({ ...f, note: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPurchaseModalOpen(false)}>Cancel</Button>
            <Button onClick={savePurchase} disabled={!purchaseForm.asset.trim()}>Add Purchase</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Vendor Confirm */}
      <AlertDialog open={deleteVendorId !== null} onOpenChange={(open) => !open && setDeleteVendorId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
            <AlertDialogDescription>This will also delete all associated purchases. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteVendor} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Purchase Confirm */}
      <AlertDialog open={deletePurchaseId !== null} onOpenChange={(open) => !open && setDeletePurchaseId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Purchase</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. Are you sure?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePurchase} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Vendors;
