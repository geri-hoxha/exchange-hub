import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
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
import DateTimePicker from "@/components/ui/date-time-picker";
import api from "@/lib/axios";
import { getApiErrorMessage } from "@/lib/apiError";
import { getAllAssets, type Asset } from "@/services/assetsService";
import { toast } from "sonner";

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
  actualTotalCostLcy?: number;
  boughtAssetCostLcy?: number;
  paidWithAssetCostLcy?: number;
  unitCostLcy?: number;
  vendorFeeLcy?: number;
  createdAtUtc: string;
}

interface Vendor {
  id: number;
  name: string;
  createdAtUtc: string;
  tradeCount: number;
  totalVolumeLcy: number;
  netFeeLcy: number;
  lastTradeAtUtc: string | null;
  volumes: VolumeEntry[];
}

interface VendorsResponse {
  items: Vendor[];
}

interface VendorPurchasesResponse {
  items: VendorPurchase[];
}

// --- Helpers ---
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const formatNum = (n: number) =>
  n.toLocaleString(undefined, { maximumFractionDigits: 20 });

type SortField = "name" | "tradeCount" | "totalVolumeLcy" | "netFeeLcy" | "lastTradeAtUtc";
type TradeFilter = "all" | "1+" | "5+" | "10+";
type FeeFilter = "all" | "positive" | "negative";

const emptyVendorForm = { name: "" };

const emptyPurchaseForm = {
  asset: "", quantity: "", paidWithAsset: "", paidWithQuantity: "",
  actualTotalCostLcy: "",
  occurredAtUtc: new Date().toISOString(),
  referenceNo: "", note: "",
};

type PurchasePaymentAction = "receive" | "pay";

const COL_COUNT = 8;

const Vendors = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [purchasesByVendor, setPurchasesByVendor] = useState<Record<number, VendorPurchase[]>>({});
  const [loadingPurchaseVendorIds, setLoadingPurchaseVendorIds] = useState<Set<number>>(new Set());
  const [savingPurchase, setSavingPurchase] = useState(false);
  const [deletingPurchase, setDeletingPurchase] = useState(false);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [vendorsError, setVendorsError] = useState<string | null>(null);
  const [savingVendor, setSavingVendor] = useState(false);
  const [deletingVendor, setDeletingVendor] = useState(false);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [sortBy, setSortBy] = useState<SortField>("name");
  const [tradeFilter, setTradeFilter] = useState<TradeFilter>("all");
  const [feeFilter, setFeeFilter] = useState<FeeFilter>("all");
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);

  // Vendor modal
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [vendorForm, setVendorForm] = useState(emptyVendorForm);

  // Purchase modal
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [purchaseVendorId, setPurchaseVendorId] = useState<number | null>(null);
  const [purchaseForm, setPurchaseForm] = useState(emptyPurchaseForm);
  const [purchasePaymentModalOpen, setPurchasePaymentModalOpen] = useState(false);
  const [purchasePaymentAction, setPurchasePaymentAction] = useState<PurchasePaymentAction>("receive");
  const [purchasePaymentAmount, setPurchasePaymentAmount] = useState("");
  const [purchasePaymentTarget, setPurchasePaymentTarget] = useState<{ slipId: number; vendorId: number; asset: string } | null>(null);
  const [processingPurchasePayment, setProcessingPurchasePayment] = useState(false);

  // Delete
  const [deleteVendorId, setDeleteVendorId] = useState<number | null>(null);
  const [deletePurchase, setDeletePurchase] = useState<{ id: number; vendorId: number } | null>(null);

  const fetchVendors = useCallback(async () => {
    try {
      setLoadingVendors(true);
      setVendorsError(null);
      const response = await api.get<VendorsResponse>("/api/vendors");
      setVendors(response.data.items ?? []);
    } catch {
      setVendorsError("Failed to load vendors.");
      setVendors([]);
    } finally {
      setLoadingVendors(false);
    }
  }, []);

  useEffect(() => {
    void fetchVendors();
  }, [fetchVendors]);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const assets = await getAllAssets();
        setAvailableAssets(assets);
      } catch {
        // Keep purchase form usable even if assets cannot be loaded.
        setAvailableAssets([]);
      }
    };

    void fetchAssets();
  }, []);

  const fetchVendorPurchases = useCallback(async (vendorId: number) => {
    try {
      setLoadingPurchaseVendorIds((prev) => {
        const next = new Set(prev);
        next.add(vendorId);
        return next;
      });

      const response = await api.get<VendorPurchasesResponse | VendorPurchase[]>("/api/vendor-purchases", {
        params: { vendorId },
      });
      const items = Array.isArray(response.data) ? response.data : (response.data.items ?? []);
      setPurchasesByVendor((prev) => ({ ...prev, [vendorId]: items }));
    } catch {
      setVendorsError("Failed to load vendor purchases.");
      setPurchasesByVendor((prev) => ({ ...prev, [vendorId]: [] }));
    } finally {
      setLoadingPurchaseVendorIds((prev) => {
        const next = new Set(prev);
        next.delete(vendorId);
        return next;
      });
    }
  }, []);

  const activeFilterCount = [tradeFilter !== "all", feeFilter !== "all"].filter(Boolean).length;
  const clearFilters = () => { setSearch(""); setTradeFilter("all"); setFeeFilter("all"); setSortBy("name"); };

  const toggleExpand = (id: number) => {
    const willExpand = !expanded.has(id);
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

    if (willExpand && purchasesByVendor[id] === undefined) {
      void fetchVendorPurchases(id);
    }
  };

  const filtered = useMemo(() => {
    let result = vendors.filter((v) =>
      v.name.toLowerCase().includes(search.toLowerCase())
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
      if (sortBy === "lastTradeAtUtc") return new Date(b.lastTradeAtUtc ?? 0).getTime() - new Date(a.lastTradeAtUtc ?? 0).getTime();
      return 0;
    });
    return result;
  }, [vendors, search, tradeFilter, feeFilter, sortBy]);

  // Vendor CRUD
  const openAddVendor = () => { setEditingVendor(null); setVendorForm(emptyVendorForm); setVendorModalOpen(true); };
  const openEditVendor = (v: Vendor) => { setEditingVendor(v); setVendorForm({ name: v.name }); setVendorModalOpen(true); };
  const saveVendor = async () => {
    if (!vendorForm.name.trim()) return;

    const payload = { name: vendorForm.name.trim() };

    try {
      setSavingVendor(true);
      if (editingVendor) {
        await api.put(`/api/vendors/${editingVendor.id}`, payload);
      } else {
        await api.post("/api/vendors", payload);
      }
      await fetchVendors();
      setVendorModalOpen(false);
      toast.success(editingVendor ? "Vendor updated" : "Vendor created", {
        description: payload.name,
      });
    } catch (error) {
      setVendorsError(editingVendor ? "Failed to update vendor." : "Failed to create vendor.");
      toast.error(editingVendor ? "Failed to update vendor" : "Failed to create vendor", {
        description: getApiErrorMessage(error),
      });
    } finally {
      setSavingVendor(false);
    }
  };

  const confirmDeleteVendor = async () => {
    if (deleteVendorId === null) return;

    try {
      setDeletingVendor(true);
      await api.delete(`/api/vendors/${deleteVendorId}`);
      setPurchasesByVendor((prev) => {
        const next = { ...prev };
        delete next[deleteVendorId];
        return next;
      });
      await fetchVendors();
      setDeleteVendorId(null);
    } catch (error) {
      setVendorsError("Failed to delete vendor.");
      toast.error("Failed to delete vendor", {
        description: getApiErrorMessage(error),
      });
    } finally {
      setDeletingVendor(false);
    }
  };

  // Purchase CRUD
  const openAddPurchase = (vendorId: number) => {
    setPurchaseVendorId(vendorId);
    setPurchaseForm(emptyPurchaseForm);
    setPurchaseModalOpen(true);
  };
  const savePurchase = async () => {
    if (!purchaseForm.asset.trim() || !purchaseVendorId) return;

    const payload = {
      vendorId: purchaseVendorId,
      asset: purchaseForm.asset.trim(),
      quantity: parseFloat(purchaseForm.quantity) || 0,
      paidWithAsset: purchaseForm.paidWithAsset.trim(),
      paidWithQuantity: parseFloat(purchaseForm.paidWithQuantity) || 0,
      actualTotalCostLcy: parseFloat(purchaseForm.actualTotalCostLcy) || 0,
      occurredAtUtc: new Date(purchaseForm.occurredAtUtc).toISOString(),
      referenceNo: purchaseForm.referenceNo.trim(),
      note: purchaseForm.note.trim(),
    };

    try {
      setSavingPurchase(true);
      await api.post("/api/vendor-purchases", payload);
      await Promise.all([fetchVendorPurchases(purchaseVendorId), fetchVendors()]);
      setPurchaseModalOpen(false);
      toast.success("Purchase created", {
        description: `${formatNum(payload.quantity)} ${payload.asset}`,
      });
    } catch (error) {
      setVendorsError("Failed to create purchase.");
      toast.error("Failed to create purchase", {
        description: getApiErrorMessage(error),
      });
    } finally {
      setSavingPurchase(false);
    }
  };

  const openPurchasePaymentModal = (purchase: VendorPurchase, action: PurchasePaymentAction) => {
    setPurchasePaymentTarget({
      slipId: purchase.id,
      vendorId: purchase.vendorId,
      asset: purchase.asset,
    });
    setPurchasePaymentAction(action);
    setPurchasePaymentAmount("");
    setPurchasePaymentModalOpen(true);
  };

  const submitPurchasePayment = async () => {
    if (!purchasePaymentTarget) return;

    const amount = parseFloat(purchasePaymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    const endpoint = purchasePaymentAction === "receive" ? "receive-payments" : "pay-payments";

    try {
      setProcessingPurchasePayment(true);
      await api.post(`/api/exchange-slips/${purchasePaymentTarget.slipId}/${endpoint}`, { amount });
      await Promise.all([
        fetchVendorPurchases(purchasePaymentTarget.vendorId),
        fetchVendors(),
      ]);
      setPurchasePaymentModalOpen(false);
      setPurchasePaymentTarget(null);
      setPurchasePaymentAmount("");
      toast.success(
        purchasePaymentAction === "receive" ? "Payment received" : "Payment paid",
        {
          description: `${formatNum(amount)} ${purchasePaymentTarget.asset}`,
        }
      );
    } catch (error) {
      toast.error(
        purchasePaymentAction === "receive" ? "Failed to receive payment" : "Failed to pay payment",
        {
          description: getApiErrorMessage(error),
        }
      );
    } finally {
      setProcessingPurchasePayment(false);
    }
  };

  const confirmDeletePurchase = async () => {
    if (!deletePurchase) return;

    try {
      setDeletingPurchase(true);
      await api.delete(`/api/vendor-purchases/${deletePurchase.id}`);
      await Promise.all([fetchVendorPurchases(deletePurchase.vendorId), fetchVendors()]);
      setDeletePurchase(null);
    } catch (error) {
      setVendorsError("Failed to delete purchase.");
      toast.error("Failed to delete purchase", {
        description: getApiErrorMessage(error),
      });
    } finally {
      setDeletingPurchase(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Vendors</h1>
        <Button className="gap-2" onClick={openAddVendor} disabled={loadingVendors}>
          <Plus className="h-4 w-4" /> Add Vendor
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="p-3 border-b border-border flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-sm" disabled={loadingVendors} />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>

          <Select value={tradeFilter} onValueChange={(v) => setTradeFilter(v as TradeFilter)} disabled={loadingVendors}>
            <SelectTrigger className="h-8 w-[110px] text-xs"><SelectValue placeholder="Trades" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All trades</SelectItem>
              <SelectItem value="1+">1+ trades</SelectItem>
              <SelectItem value="5+">5+ trades</SelectItem>
              <SelectItem value="10+">10+ trades</SelectItem>
            </SelectContent>
          </Select>

          <Select value={feeFilter} onValueChange={(v) => setFeeFilter(v as FeeFilter)} disabled={loadingVendors}>
            <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue placeholder="Net Fee" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All fees</SelectItem>
              <SelectItem value="positive">Positive fee</SelectItem>
              <SelectItem value="negative">Negative fee</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortField)} disabled={loadingVendors}>
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

        {vendorsError && (
          <div className="px-4 py-2 text-sm text-destructive border-b border-border bg-destructive/5">
            {vendorsError}
          </div>
        )}

        <div className="overflow-x-auto">
        <Table className="min-w-[1080px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]" />
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
            {loadingVendors ? (
              <TableRow>
                <TableCell colSpan={COL_COUNT} className="text-center py-12 text-muted-foreground">Loading vendors...</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COL_COUNT} className="text-center py-12 text-muted-foreground">No vendors found.</TableCell>
              </TableRow>
            ) : (
              filtered.map((v) => {
                const isExpanded = expanded.has(v.id);
                const vendorPurchases = purchasesByVendor[v.id] ?? [];
                const loadingVendorPurchases = loadingPurchaseVendorIds.has(v.id);
                return (
                  <Fragment key={v.id}>
                    <TableRow>
                      <TableCell className="pr-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleExpand(v.id)}>
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                      </TableCell>
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
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditVendor(v)} disabled={loadingVendors}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteVendorId(v.id)} disabled={loadingVendors}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableCell colSpan={COL_COUNT} className="p-0">
                          <div className="px-6 py-4 pl-12">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-sm font-semibold text-foreground">Purchases</h3>
                              <Button size="sm"  className="gap-1.5 h-7 text-xs" onClick={() => openAddPurchase(v.id)} disabled={loadingVendorPurchases}>
                                <Plus className="h-3 w-3" /> Add
                              </Button>
                            </div>

                            {loadingVendorPurchases ? (
                              <p className="text-sm text-muted-foreground py-4 text-center">Loading purchases...</p>
                            ) : vendorPurchases.length === 0 ? (
                              <p className="text-sm text-muted-foreground py-4 text-center">No purchases yet.</p>
                            ) : (
                              <div className="rounded-lg border border-border overflow-hidden overflow-x-auto">
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
                                      <TableHead className="text-xs w-[210px] text-right">Actions</TableHead>
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
                                        <TableCell className="text-right font-mono text-sm">{formatNum(p.actualTotalCostLcy ?? p.boughtAssetCostLcy ?? 0)}</TableCell>
                                        <TableCell className="text-right font-mono text-xs text-muted-foreground">{formatNum(p.unitCostLcy ?? 0)}</TableCell>
                                        <TableCell className="text-right">
                                          <span className={`font-mono text-sm font-medium ${(p.vendorFeeLcy ?? 0) >= 0 ? "text-accent" : "text-destructive"}`}>
                                            {formatNum(p.vendorFeeLcy ?? 0)}
                                          </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                          <div className="flex items-center justify-end gap-1">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="h-7 px-2 text-[11px]"
                                              onClick={() => openPurchasePaymentModal(p, "receive")}
                                              disabled={processingPurchasePayment}
                                            >
                                              Receive
                                            </Button>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="h-7 px-2 text-[11px]"
                                              onClick={() => openPurchasePaymentModal(p, "pay")}
                                              disabled={processingPurchasePayment}
                                            >
                                              Pay
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeletePurchase({ id: p.id, vendorId: v.id })} disabled={deletingPurchase || processingPurchasePayment}>
                                            <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </div>
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
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
        </div>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVendorModalOpen(false)} disabled={savingVendor}>Cancel</Button>
            <Button onClick={() => void saveVendor()} disabled={!vendorForm.name.trim() || savingVendor}>{editingVendor ? "Save Changes" : "Add Vendor"}</Button>
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
              <Select
                value={purchaseForm.asset}
                onValueChange={(value) => setPurchaseForm((f) => ({ ...f, asset: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select bought asset" />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest">Crypto</div>
                  {availableAssets.filter((a) => a.type === "crypto").map((a) => (
                    <SelectItem key={a.code} value={a.code}>
                      {a.code}
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Fiat</div>
                  {availableAssets.filter((a) => a.type === "fiat").map((a) => (
                    <SelectItem key={a.code} value={a.code}>
                      {a.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input type="number" placeholder="0.00" value={purchaseForm.quantity} onChange={(e) => setPurchaseForm((f) => ({ ...f, quantity: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Paid With Asset</Label>
              <Select
                value={purchaseForm.paidWithAsset}
                onValueChange={(value) => setPurchaseForm((f) => ({ ...f, paidWithAsset: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment asset" />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest">Crypto</div>
                  {availableAssets.filter((a) => a.type === "crypto").map((a) => (
                    <SelectItem key={a.code} value={a.code}>
                      {a.code}
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Fiat</div>
                  {availableAssets.filter((a) => a.type === "fiat").map((a) => (
                    <SelectItem key={a.code} value={a.code}>
                      {a.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Paid With Quantity</Label>
              <Input type="number" placeholder="0.00" value={purchaseForm.paidWithQuantity} onChange={(e) => setPurchaseForm((f) => ({ ...f, paidWithQuantity: e.target.value }))} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Actual Total Cost (LCY)</Label>
              <Input type="number" placeholder="0.00" value={purchaseForm.actualTotalCostLcy} onChange={(e) => setPurchaseForm((f) => ({ ...f, actualTotalCostLcy: e.target.value }))} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Occurred At</Label>
              <DateTimePicker
                value={purchaseForm.occurredAtUtc}
                onChange={(value) => setPurchaseForm((f) => ({ ...f, occurredAtUtc: value }))}
                placeholder="Pick purchase date"
              />
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
            <Button variant="outline" onClick={() => setPurchaseModalOpen(false)} disabled={savingPurchase}>Cancel</Button>
            <Button onClick={() => void savePurchase()} disabled={!purchaseForm.asset.trim() || savingPurchase}>Add Purchase</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Purchase Payment Modal */}
      <Dialog
        open={purchasePaymentModalOpen}
        onOpenChange={(open) => {
          setPurchasePaymentModalOpen(open);
          if (!open) {
            setPurchasePaymentTarget(null);
            setPurchasePaymentAmount("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{purchasePaymentAction === "receive" ? "Receive Payment" : "Pay Payment"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="purchase-payment-amount">Amount</Label>
              <Input
                id="purchase-payment-amount"
                type="number"
                min="0"
                step="any"
                placeholder="0.00"
                className="h-11 text-base"
                value={purchasePaymentAmount}
                onChange={(e) => setPurchasePaymentAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPurchasePaymentModalOpen(false)}
              disabled={processingPurchasePayment}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void submitPurchasePayment()}
              disabled={processingPurchasePayment || !purchasePaymentAmount.trim()}
            >
              {purchasePaymentAction === "receive" ? "Receive" : "Pay"}
            </Button>
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
            <AlertDialogCancel disabled={deletingVendor}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDeleteVendor()} disabled={deletingVendor} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Purchase Confirm */}
      <AlertDialog open={deletePurchase !== null} onOpenChange={(open) => !open && setDeletePurchase(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Purchase</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. Are you sure?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingPurchase}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDeletePurchase()} disabled={deletingPurchase} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Vendors;
