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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
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
interface Contribution {
  id: number;
  ownerId: number;
  contributedAtUtc: string;
  asset: string;
  amount: number;
  unitValueLcy: number;
  totalValueLcy: number;
  referenceNo: string;
  note: string;
  createdAtUtc: string;
}

interface BalanceEntry { asset: string; amount: number; }

interface Owner {
  id: number;
  name: string;
  note: string;
  createdAtUtc: string;
  balances: BalanceEntry[];
}

interface OwnersResponse {
  items: Owner[];
}

interface OwnerContributionsResponse {
  items: Contribution[];
}

// --- Helpers ---
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const formatNum = (n: number) =>
  n.toLocaleString(undefined, { maximumFractionDigits: 20 });

const emptyOwnerForm = { name: "", note: "" };

const emptyContribForm = {
  asset: "", amount: "", unitValueLcy: "", totalValueLcy: "",
  contributedAtUtc: new Date().toISOString(),
  referenceNo: "", note: "",
};

type SortField = "name" | "createdAtUtc" | "balanceCount" | "contribCount";
type BalanceFilter = "all" | "has-balance" | "no-balance";
type ContribFilter = "all" | "has-contribs" | "no-contribs";

const Owners = () => {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [contributionsByOwner, setContributionsByOwner] = useState<Record<number, Contribution[]>>({});
  const [loadingContribByOwner, setLoadingContribByOwner] = useState<Record<number, boolean>>({});
  const [loadingOwners, setLoadingOwners] = useState(true);
  const [ownersError, setOwnersError] = useState<string | null>(null);
  const [contributionsError, setContributionsError] = useState<string | null>(null);
  const [savingOwner, setSavingOwner] = useState(false);
  const [deletingOwner, setDeletingOwner] = useState(false);
  const [savingContrib, setSavingContrib] = useState(false);
  const [deletingContrib, setDeletingContrib] = useState(false);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [sortBy, setSortBy] = useState<SortField>("name");
  const [balanceFilter, setBalanceFilter] = useState<BalanceFilter>("all");
  const [contribFilter, setContribFilter] = useState<ContribFilter>("all");
  const [assetFilter, setAssetFilter] = useState<string>("all");
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);

  // Owner modal
  const [ownerModalOpen, setOwnerModalOpen] = useState(false);
  const [editingOwner, setEditingOwner] = useState<Owner | null>(null);
  const [ownerForm, setOwnerForm] = useState(emptyOwnerForm);

  // Contribution modal
  const [contribModalOpen, setContribModalOpen] = useState(false);
  const [contribOwnerId, setContribOwnerId] = useState<number | null>(null);
  const [contribForm, setContribForm] = useState(emptyContribForm);

  // Delete contribution
  const [deleteContribTarget, setDeleteContribTarget] = useState<{ id: number; ownerId: number } | null>(null);
  const [deleteOwnerId, setDeleteOwnerId] = useState<number | null>(null);

  const contributions = useMemo(
    () => Object.values(contributionsByOwner).flat(),
    [contributionsByOwner]
  );

  const getContributionsFromResponse = (
    data: OwnerContributionsResponse | Contribution[]
  ): Contribution[] => (Array.isArray(data) ? data : data.items ?? []);

  const fetchContributionsForOwner = useCallback(async (ownerId: number) => {
    try {
      setLoadingContribByOwner((prev) => ({ ...prev, [ownerId]: true }));
      const response = await api.get<OwnerContributionsResponse | Contribution[]>("/api/owner-contributions", {
        params: { ownerId },
      });
      setContributionsByOwner((prev) => ({
        ...prev,
        [ownerId]: getContributionsFromResponse(response.data),
      }));
    } catch {
      setContributionsError("Failed to load owner contributions.");
      setContributionsByOwner((prev) => ({ ...prev, [ownerId]: [] }));
    } finally {
      setLoadingContribByOwner((prev) => ({ ...prev, [ownerId]: false }));
    }
  }, []);

  const fetchOwners = useCallback(async () => {
    try {
      setLoadingOwners(true);
      setOwnersError(null);
      setContributionsError(null);
      const response = await api.get<OwnersResponse>("/api/owners");
      const nextOwners = response.data.items ?? [];
      setOwners(nextOwners);
    } catch {
      setOwnersError("Failed to load owners.");
      setOwners([]);
      setContributionsByOwner({});
    } finally {
      setLoadingOwners(false);
    }
  }, []);

  useEffect(() => {
    void fetchOwners();
  }, [fetchOwners]);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const assets = await getAllAssets();
        setAvailableAssets(assets);
      } catch {
        // Keep contribution form usable even if assets cannot be loaded.
        setAvailableAssets([]);
      }
    };

    void fetchAssets();
  }, []);

  // Collect all unique assets across owners
  const allAssets = useMemo(() => {
    const set = new Set<string>();
    owners.forEach((o) => o.balances.forEach((b) => set.add(b.asset)));
    return Array.from(set).sort();
  }, [owners]);

  const activeFilterCount = [balanceFilter !== "all", contribFilter !== "all", assetFilter !== "all"].filter(Boolean).length;
  const clearFilters = () => { setSearch(""); setBalanceFilter("all"); setContribFilter("all"); setAssetFilter("all"); setSortBy("name"); };

  const filtered = useMemo(() => {
    let result = owners.filter(
      (o) =>
        o.name.toLowerCase().includes(search.toLowerCase()) ||
        o.note.toLowerCase().includes(search.toLowerCase())
    );

    if (balanceFilter === "has-balance") result = result.filter((o) => o.balances.length > 0);
    else if (balanceFilter === "no-balance") result = result.filter((o) => o.balances.length === 0);

    if (assetFilter !== "all") result = result.filter((o) => o.balances.some((b) => b.asset === assetFilter));

    if (contribFilter === "has-contribs") result = result.filter((o) => contributions.some((c) => c.ownerId === o.id));
    else if (contribFilter === "no-contribs") result = result.filter((o) => !contributions.some((c) => c.ownerId === o.id));

    result.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "createdAtUtc") return new Date(b.createdAtUtc).getTime() - new Date(a.createdAtUtc).getTime();
      if (sortBy === "balanceCount") return b.balances.length - a.balances.length;
      if (sortBy === "contribCount") {
        const ac = contributions.filter((c) => c.ownerId === a.id).length;
        const bc = contributions.filter((c) => c.ownerId === b.id).length;
        return bc - ac;
      }
      return 0;
    });

    return result;
  }, [owners, contributions, search, balanceFilter, contribFilter, assetFilter, sortBy]);

  const toggleExpand = (id: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        if (!contributionsByOwner[id] && !loadingContribByOwner[id]) {
          void fetchContributionsForOwner(id);
        }
      }
      return next;
    });

  // Owner CRUD
  const openAddOwner = () => { setEditingOwner(null); setOwnerForm(emptyOwnerForm); setOwnerModalOpen(true); };
  const openEditOwner = (o: Owner) => { setEditingOwner(o); setOwnerForm({ name: o.name, note: o.note }); setOwnerModalOpen(true); };
  const saveOwner = async () => {
    if (!ownerForm.name.trim()) return;

    const payload = {
      name: ownerForm.name.trim(),
      note: ownerForm.note.trim(),
    };

    try {
      setSavingOwner(true);
      if (editingOwner) {
        await api.put(`/api/owners/${editingOwner.id}`, payload);
      } else {
        await api.post("/api/owners", payload);
      }
      await fetchOwners();
      setOwnerModalOpen(false);
      toast.success(editingOwner ? "Owner updated" : "Owner created", {
        description: payload.name,
      });
    } catch (error) {
      setOwnersError(editingOwner ? "Failed to update owner." : "Failed to create owner.");
      toast.error(editingOwner ? "Failed to update owner" : "Failed to create owner", {
        description: getApiErrorMessage(error),
      });
    } finally {
      setSavingOwner(false);
    }
  };

  const confirmDeleteOwner = async () => {
    if (deleteOwnerId === null) return;

    try {
      setDeletingOwner(true);
      await api.delete(`/api/owners/${deleteOwnerId}`);
      await fetchOwners();
      setDeleteOwnerId(null);
    } catch (error) {
      setOwnersError("Failed to delete owner.");
      toast.error("Failed to delete owner", {
        description: getApiErrorMessage(error),
      });
    } finally {
      setDeletingOwner(false);
    }
  };

  // Contribution CRUD
  const openAddContrib = (ownerId: number) => {
    setContributionsError(null);
    setContribOwnerId(ownerId);
    setContribForm(emptyContribForm);
    setContribModalOpen(true);
  };
  const saveContrib = async () => {
    if (!contribForm.asset.trim() || !contribOwnerId) return;

    const payload = {
      ownerId: contribOwnerId,
      asset: contribForm.asset.trim(),
      amount: parseFloat(contribForm.amount) || 0,
      unitValueLcy: parseFloat(contribForm.unitValueLcy) || 0,
      totalValueLcy: parseFloat(contribForm.totalValueLcy) || 0,
      contributedAtUtc: new Date(contribForm.contributedAtUtc).toISOString(),
      referenceNo: contribForm.referenceNo.trim(),
      note: contribForm.note.trim(),
    };

    try {
      setSavingContrib(true);
      setContributionsError(null);
      await api.post("/api/owner-contributions", payload);
      await Promise.all([fetchOwners(), fetchContributionsForOwner(contribOwnerId)]);
      setContribModalOpen(false);
      toast.success("Contribution created", {
        description: `${formatNum(payload.amount)} ${payload.asset}`,
      });
    } catch (error) {
      setContributionsError("Failed to create contribution.");
      toast.error("Failed to create contribution", {
        description: getApiErrorMessage(error),
      });
    } finally {
      setSavingContrib(false);
    }
  };
  const confirmDeleteContrib = async () => {
    if (!deleteContribTarget) return;

    try {
      setDeletingContrib(true);
      setContributionsError(null);
      await api.delete(`/api/owner-contributions/${deleteContribTarget.id}`);
      await Promise.all([fetchOwners(), fetchContributionsForOwner(deleteContribTarget.ownerId)]);
      setDeleteContribTarget(null);
    } catch (error) {
      setContributionsError("Failed to delete contribution.");
      toast.error("Failed to delete contribution", {
        description: getApiErrorMessage(error),
      });
    } finally {
      setDeletingContrib(false);
    }
  };

  const COL_COUNT = 6;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Owners</h1>
        <Button className="gap-2" onClick={openAddOwner} disabled={loadingOwners}>
          <Plus className="h-4 w-4" /> Add Owner
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-3 border-b border-border flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-sm" disabled={loadingOwners} />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>

          <Select value={balanceFilter} onValueChange={(v) => setBalanceFilter(v as BalanceFilter)} disabled={loadingOwners}>
            <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="Balances" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All balances</SelectItem>
              <SelectItem value="has-balance">Has balance</SelectItem>
              <SelectItem value="no-balance">No balance</SelectItem>
            </SelectContent>
          </Select>

          <Select value={contribFilter} onValueChange={(v) => setContribFilter(v as ContribFilter)} disabled={loadingOwners}>
            <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="Contributions" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All contributions</SelectItem>
              <SelectItem value="has-contribs">Has contributions</SelectItem>
              <SelectItem value="no-contribs">No contributions</SelectItem>
            </SelectContent>
          </Select>

          {allAssets.length > 0 && (
            <Select value={assetFilter} onValueChange={setAssetFilter} disabled={loadingOwners}>
              <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="Asset" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All assets</SelectItem>
                {allAssets.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortField)} disabled={loadingOwners}>
            <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="Sort by" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="createdAtUtc">Newest first</SelectItem>
              <SelectItem value="balanceCount">Most assets</SelectItem>
              <SelectItem value="contribCount">Most contribs</SelectItem>
            </SelectContent>
          </Select>

          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs gap-1 text-muted-foreground">
              <X className="h-3 w-3" /> Clear ({activeFilterCount})
            </Button>
          )}
        </div>

        {ownersError && (
          <div className="px-4 py-2 text-sm text-destructive border-b border-border bg-destructive/5">
            {ownersError}
          </div>
        )}
        {contributionsError && (
          <div className="px-4 py-2 text-sm text-destructive border-b border-border bg-destructive/5">
            {contributionsError}
          </div>
        )}

        <div className="overflow-x-auto">
        <Table className="min-w-[980px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]" />
              <TableHead>Name</TableHead>
              <TableHead>Note</TableHead>
              <TableHead>Balances</TableHead>
              <TableHead className="text-right">Created</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingOwners ? (
              <TableRow>
                <TableCell colSpan={COL_COUNT} className="text-center py-12 text-muted-foreground">Loading owners...</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COL_COUNT} className="text-center py-12 text-muted-foreground">No owners found.</TableCell>
              </TableRow>
            ) : (
              filtered.map((o) => {
                const isExpanded = expanded.has(o.id);
                const ownerContribs = contributionsByOwner[o.id] ?? [];
                const isLoadingContribs = loadingContribByOwner[o.id];
                return (
                  <Fragment key={o.id}>
                    <TableRow>
                      <TableCell className="pr-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleExpand(o.id)}>
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                      </TableCell>
                      <TableCell className="font-semibold">{o.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{o.note || "—"}</TableCell>
                      <TableCell>
                        {o.balances.length === 0 ? (
                          <span className="text-muted-foreground text-xs">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {o.balances.map((b, i) => (
                              <Badge key={i} variant="outline" className={`font-mono text-sm font-medium ${getAssetColor(b.asset)}`}>
                                {formatNum(b.amount)} {b.asset}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">{formatDate(o.createdAtUtc)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditOwner(o)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteOwnerId(o.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableCell colSpan={COL_COUNT} className="p-0">
                          <div className="px-6 py-4 pl-12">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-sm font-semibold text-foreground">Contributions</h3>
                              <Button size="sm"   className="gap-1.5 h-7 text-xs" onClick={() => openAddContrib(o.id)}>
                                <Plus className="h-3 w-3" /> Add
                              </Button>
                            </div>

                            {isLoadingContribs ? (
                              <p className="text-sm text-muted-foreground py-4 text-center">Loading contributions...</p>
                            ) : ownerContribs.length === 0 ? (
                              <p className="text-sm text-muted-foreground py-4 text-center">No contributions yet.</p>
                            ) : (
                              <div className="rounded-lg border border-border overflow-hidden overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="bg-muted/50">
                                      <TableHead className="text-xs">Date</TableHead>
                                      <TableHead className="text-xs">Asset</TableHead>
                                      <TableHead className="text-xs text-right">Amount</TableHead>
                                      <TableHead className="text-xs text-right">Unit LCY</TableHead>
                                      <TableHead className="text-xs text-right">Total LCY</TableHead>
                                      <TableHead className="text-xs">Ref</TableHead>
                                      <TableHead className="text-xs">Note</TableHead>
                                      <TableHead className="text-xs w-[50px]" />
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {ownerContribs.map((c) => (
                                      <TableRow key={c.id}>
                                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(c.contributedAtUtc)}</TableCell>
                                        <TableCell>
                                          <Badge variant="outline" className={`font-mono text-xs ${getAssetColor(c.asset)}`}>{c.asset}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm">{formatNum(c.amount)}</TableCell>
                                        <TableCell className="text-right font-mono text-xs text-muted-foreground">{formatNum(c.unitValueLcy)}</TableCell>
                                        <TableCell className="text-right font-mono text-sm font-medium">{formatNum(c.totalValueLcy)}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{c.referenceNo || "—"}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{c.note || "—"}</TableCell>
                                        <TableCell>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-destructive hover:text-destructive"
                                            onClick={() => setDeleteContribTarget({ id: c.id, ownerId: o.id })}
                                          >
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
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
        </div>
      </div>

      {/* Owner Modal */}
      <Dialog open={ownerModalOpen} onOpenChange={setOwnerModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingOwner ? "Edit Owner" : "Add Owner"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="owner-name">Name</Label>
              <Input id="owner-name" placeholder="Owner name" value={ownerForm.name} onChange={(e) => setOwnerForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner-note">Note</Label>
              <Input id="owner-note" placeholder="Optional note" value={ownerForm.note} onChange={(e) => setOwnerForm((f) => ({ ...f, note: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOwnerModalOpen(false)} disabled={savingOwner}>Cancel</Button>
            <Button onClick={() => void saveOwner()} disabled={!ownerForm.name.trim() || savingOwner}>{editingOwner ? "Save Changes" : "Add Owner"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contribution Modal */}
      <Dialog open={contribModalOpen} onOpenChange={setContribModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Contribution</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label>Asset</Label>
              <Select
                value={contribForm.asset}
                onValueChange={(value) => setContribForm((f) => ({ ...f, asset: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select asset" />
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
              <Label>Amount</Label>
              <Input type="number" placeholder="0.00" value={contribForm.amount} onChange={(e) => setContribForm((f) => ({ ...f, amount: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Unit Value (LCY)</Label>
              <Input type="number" placeholder="0.00" value={contribForm.unitValueLcy} onChange={(e) => setContribForm((f) => ({ ...f, unitValueLcy: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Total Value (LCY)</Label>
              <Input type="number" placeholder="0.00" value={contribForm.totalValueLcy} onChange={(e) => setContribForm((f) => ({ ...f, totalValueLcy: e.target.value }))} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Contributed At</Label>
              <DateTimePicker
                value={contribForm.contributedAtUtc}
                onChange={(value) => setContribForm((f) => ({ ...f, contributedAtUtc: value }))}
                placeholder="Pick contribution date"
              />
            </div>
          
            <div className="space-y-2">
              <Label>Reference No</Label>
              <Input placeholder="REF-XXX" value={contribForm.referenceNo} onChange={(e) => setContribForm((f) => ({ ...f, referenceNo: e.target.value }))} />
            </div>
            <div className="  space-y-2">
              <Label>Note</Label>
              <Input placeholder="Optional note" value={contribForm.note} onChange={(e) => setContribForm((f) => ({ ...f, note: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContribModalOpen(false)} disabled={savingContrib}>Cancel</Button>
            <Button onClick={() => void saveContrib()} disabled={!contribForm.asset.trim() || savingContrib}>Add Contribution</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Contribution Confirm */}
      <AlertDialog open={deleteContribTarget !== null} onOpenChange={(open) => !open && setDeleteContribTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contribution</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. Are you sure?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingContrib}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDeleteContrib()} disabled={deletingContrib} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Owner Confirm */}
      <AlertDialog open={deleteOwnerId !== null} onOpenChange={(open) => !open && setDeleteOwnerId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Owner</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. Are you sure?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingOwner}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDeleteOwner()} disabled={deletingOwner} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Owners;
