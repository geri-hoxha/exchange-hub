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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

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

// --- Initial data ---
const initialOwners: Owner[] = [
  {
    id: 1, name: "Erin Hoxha", note: "note",
    createdAtUtc: "2026-03-06T02:28:46.0494545+00:00",
    balances: [
      { asset: "EUR", amount: 2000 },
      { asset: "USDT-TRC20", amount: 5014.7 },
    ],
  },
];

const initialContributions: Contribution[] = [
  {
    id: 1, ownerId: 1, contributedAtUtc: "2026-03-10T10:00:00Z",
    asset: "EUR", amount: 2000, unitValueLcy: 1, totalValueLcy: 2000,
    referenceNo: "REF-001", note: "Initial deposit",
    createdAtUtc: "2026-03-10T10:00:00Z",
  },
  {
    id: 2, ownerId: 1, contributedAtUtc: "2026-03-11T08:00:00Z",
    asset: "USDT-TRC20", amount: 5014.7, unitValueLcy: 0.92, totalValueLcy: 4613.52,
    referenceNo: "REF-002", note: "Crypto contribution",
    createdAtUtc: "2026-03-11T08:00:00Z",
  },
];

// --- Helpers ---
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const formatNum = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const emptyOwnerForm = { name: "", note: "" };

const emptyContribForm = {
  asset: "", amount: "", unitValueLcy: "", totalValueLcy: "",
  contributedAtUtc: new Date().toISOString().slice(0, 16),
  referenceNo: "", note: "",
};

type SortField = "name" | "createdAtUtc" | "balanceCount" | "contribCount";
type BalanceFilter = "all" | "has-balance" | "no-balance";
type ContribFilter = "all" | "has-contribs" | "no-contribs";

const Owners = () => {
  const [owners, setOwners] = useState<Owner[]>(initialOwners);
  const [contributions, setContributions] = useState<Contribution[]>(initialContributions);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [sortBy, setSortBy] = useState<SortField>("name");
  const [balanceFilter, setBalanceFilter] = useState<BalanceFilter>("all");
  const [contribFilter, setContribFilter] = useState<ContribFilter>("all");
  const [assetFilter, setAssetFilter] = useState<string>("all");

  // Owner modal
  const [ownerModalOpen, setOwnerModalOpen] = useState(false);
  const [editingOwner, setEditingOwner] = useState<Owner | null>(null);
  const [ownerForm, setOwnerForm] = useState(emptyOwnerForm);

  // Contribution modal
  const [contribModalOpen, setContribModalOpen] = useState(false);
  const [contribOwnerId, setContribOwnerId] = useState<number | null>(null);
  const [contribForm, setContribForm] = useState(emptyContribForm);

  // Delete contribution
  const [deleteContribId, setDeleteContribId] = useState<number | null>(null);

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
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // Owner CRUD
  const openAddOwner = () => { setEditingOwner(null); setOwnerForm(emptyOwnerForm); setOwnerModalOpen(true); };
  const openEditOwner = (o: Owner) => { setEditingOwner(o); setOwnerForm({ name: o.name, note: o.note }); setOwnerModalOpen(true); };
  const saveOwner = () => {
    if (!ownerForm.name.trim()) return;
    if (editingOwner) {
      setOwners((prev) => prev.map((o) => o.id === editingOwner.id ? { ...o, name: ownerForm.name, note: ownerForm.note } : o));
    } else {
      setOwners((prev) => [...prev, { id: Date.now(), name: ownerForm.name, note: ownerForm.note, createdAtUtc: new Date().toISOString(), balances: [] }]);
    }
    setOwnerModalOpen(false);
  };

  // Contribution CRUD
  const openAddContrib = (ownerId: number) => {
    setContribOwnerId(ownerId);
    setContribForm(emptyContribForm);
    setContribModalOpen(true);
  };
  const saveContrib = () => {
    if (!contribForm.asset.trim() || !contribOwnerId) return;
    const newContrib: Contribution = {
      id: Date.now(),
      ownerId: contribOwnerId,
      asset: contribForm.asset,
      amount: parseFloat(contribForm.amount) || 0,
      unitValueLcy: parseFloat(contribForm.unitValueLcy) || 0,
      totalValueLcy: parseFloat(contribForm.totalValueLcy) || 0,
      contributedAtUtc: new Date(contribForm.contributedAtUtc).toISOString(),
      referenceNo: contribForm.referenceNo,
      note: contribForm.note,
      createdAtUtc: new Date().toISOString(),
    };
    setContributions((prev) => [...prev, newContrib]);
    setContribModalOpen(false);
  };
  const confirmDeleteContrib = () => {
    if (deleteContribId !== null) {
      setContributions((prev) => prev.filter((c) => c.id !== deleteContribId));
      setDeleteContribId(null);
    }
  };

  const COL_COUNT = 6;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Owners</h1>
        <Button className="gap-2" onClick={openAddOwner}>
          <Plus className="h-4 w-4" /> Add Owner
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm">
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

          <Select value={balanceFilter} onValueChange={(v) => setBalanceFilter(v as BalanceFilter)}>
            <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="Balances" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All balances</SelectItem>
              <SelectItem value="has-balance">Has balance</SelectItem>
              <SelectItem value="no-balance">No balance</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortField)}>
            <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue placeholder="Sort by" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="createdAtUtc">Newest first</SelectItem>
              <SelectItem value="balanceCount">Most assets</SelectItem>
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
              <TableHead>Balances</TableHead>
              <TableHead className="text-right">Created</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COL_COUNT} className="text-center py-12 text-muted-foreground">No owners found.</TableCell>
              </TableRow>
            ) : (
              filtered.map((o) => {
                const isExpanded = expanded.has(o.id);
                const ownerContribs = contributions.filter((c) => c.ownerId === o.id);
                return (
                  <>
                    <TableRow key={o.id}>
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
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow key={`${o.id}-contribs`} className="bg-muted/30 hover:bg-muted/30">
                        <TableCell colSpan={COL_COUNT} className="p-0">
                          <div className="px-6 py-4 pl-12">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-sm font-semibold text-foreground">Contributions</h3>
                              <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={() => openAddContrib(o.id)}>
                                <Plus className="h-3 w-3" /> Add
                              </Button>
                            </div>

                            {ownerContribs.length === 0 ? (
                              <p className="text-sm text-muted-foreground py-4 text-center">No contributions yet.</p>
                            ) : (
                              <div className="rounded-lg border border-border overflow-hidden">
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
                                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteContribId(c.id)}>
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
            <Button variant="outline" onClick={() => setOwnerModalOpen(false)}>Cancel</Button>
            <Button onClick={saveOwner} disabled={!ownerForm.name.trim()}>{editingOwner ? "Save Changes" : "Add Owner"}</Button>
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
              <Input placeholder="e.g. EUR" value={contribForm.asset} onChange={(e) => setContribForm((f) => ({ ...f, asset: e.target.value }))} />
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
            <div className="space-y-2">
              <Label>Contributed At</Label>
              <Input type="datetime-local" value={contribForm.contributedAtUtc} onChange={(e) => setContribForm((f) => ({ ...f, contributedAtUtc: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Reference No</Label>
              <Input placeholder="REF-XXX" value={contribForm.referenceNo} onChange={(e) => setContribForm((f) => ({ ...f, referenceNo: e.target.value }))} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Note</Label>
              <Input placeholder="Optional note" value={contribForm.note} onChange={(e) => setContribForm((f) => ({ ...f, note: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContribModalOpen(false)}>Cancel</Button>
            <Button onClick={saveContrib} disabled={!contribForm.asset.trim()}>Add Contribution</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Contribution Confirm */}
      <AlertDialog open={deleteContribId !== null} onOpenChange={(open) => !open && setDeleteContribId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contribution</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. Are you sure?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteContrib} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Owners;
