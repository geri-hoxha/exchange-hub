import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import api from "@/lib/axios";
import { getApiErrorMessage } from "@/lib/apiError";
import { toast } from "sonner";

interface BalanceEntry {
  asset: string;
  amount: number;
}

interface Customer {
  id: number;
  name: string;
  note: string;
  createdAtUtc: string;
  tradeCount: number;
  totalReceivedLcy: number;
  totalPaidLcy: number;
  netFeeLcy: number;
  lastTradeAtUtc: string | null;
  theyOweUs: BalanceEntry[];
  weOweThem: BalanceEntry[];
}

interface CustomersResponse {
  items: Customer[];
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const formatNum = (n: number) =>
  n.toLocaleString(undefined, { maximumFractionDigits: 20 });

const BalanceList = ({ items, variant }: { items: BalanceEntry[]; variant: "owe" | "owed" }) => {
  if (!items.length) return <span className="text-muted-foreground text-xs">—</span>;
  return (
    <div className="space-y-1">
      {items.map((b, i) => (
        <Badge
          key={i}
          variant="outline"
          className={`font-mono text-xs ${
            variant === "owe"
              ? "border-destructive/30 text-destructive"
              : "border-accent/30 text-accent"
          }`}
        >
          {formatNum(b.amount)} {b.asset}
        </Badge>
      ))}
    </div>
  );
};

type BalanceFilter = "all" | "they-owe" | "we-owe" | "settled";
type TradeFilter = "all" | "1+" | "5+" | "10+";
type SortField = "name" | "tradeCount" | "netFeeLcy" | "lastTradeAtUtc";

const emptyCustomerForm = { name: "", note: "" };

const Customers = () => {
  const [data, setData] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [customersError, setCustomersError] = useState<string | null>(null);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerForm, setCustomerForm] = useState(emptyCustomerForm);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [balanceFilter, setBalanceFilter] = useState<BalanceFilter>("all");
  const [tradeFilter, setTradeFilter] = useState<TradeFilter>("all");
  const [sortBy, setSortBy] = useState<SortField>("name");

  const fetchCustomers = useCallback(async () => {
    try {
      setLoadingCustomers(true);
      setCustomersError(null);
      const response = await api.get<CustomersResponse | Customer[]>("/api/customers");
      const nextCustomers = Array.isArray(response.data) ? response.data : (response.data.items ?? []);
      setData(nextCustomers);
    } catch {
      setCustomersError("Failed to load customers.");
      setData([]);
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

  useEffect(() => {
    void fetchCustomers();
  }, [fetchCustomers]);

  const activeFilterCount = [balanceFilter !== "all", tradeFilter !== "all"].filter(Boolean).length;

  const clearFilters = () => {
    setSearch("");
    setBalanceFilter("all");
    setTradeFilter("all");
    setSortBy("name");
  };

  const filtered = useMemo(() => {
    let result = data.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.note.toLowerCase().includes(search.toLowerCase())
    );

    if (balanceFilter === "they-owe") result = result.filter((c) => c.theyOweUs.length > 0);
    else if (balanceFilter === "we-owe") result = result.filter((c) => c.weOweThem.length > 0);
    else if (balanceFilter === "settled") result = result.filter((c) => c.theyOweUs.length === 0 && c.weOweThem.length === 0);

    if (tradeFilter === "1+") result = result.filter((c) => c.tradeCount >= 1);
    else if (tradeFilter === "5+") result = result.filter((c) => c.tradeCount >= 5);
    else if (tradeFilter === "10+") result = result.filter((c) => c.tradeCount >= 10);

    result.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "tradeCount") return b.tradeCount - a.tradeCount;
      if (sortBy === "netFeeLcy") return b.netFeeLcy - a.netFeeLcy;
      if (sortBy === "lastTradeAtUtc") return new Date(b.lastTradeAtUtc ?? 0).getTime() - new Date(a.lastTradeAtUtc ?? 0).getTime();
      return 0;
    });

    return result;
  }, [data, search, balanceFilter, tradeFilter, sortBy]);

  const openAddCustomer = () => {
    setEditingCustomer(null);
    setCustomerForm(emptyCustomerForm);
    setCustomerModalOpen(true);
  };

  const openEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setCustomerForm({ name: customer.name, note: customer.note });
    setCustomerModalOpen(true);
  };

  const saveCustomer = async () => {
    if (!customerForm.name.trim()) return;

    const payload = {
      name: customerForm.name.trim(),
      note: customerForm.note.trim(),
    };

    try {
      setSavingCustomer(true);
      setCustomersError(null);
      if (editingCustomer) {
        await api.put(`/api/customers/${editingCustomer.id}`, payload);
      } else {
        await api.post("/api/customers", payload);
      }
      await fetchCustomers();
      setCustomerModalOpen(false);
      toast.success(editingCustomer ? "Customer updated" : "Customer created", {
        description: payload.name,
      });
    } catch (error) {
      setCustomersError(editingCustomer ? "Failed to update customer." : "Failed to create customer.");
      toast.error(editingCustomer ? "Failed to update customer" : "Failed to create customer", {
        description: getApiErrorMessage(error),
      });
    } finally {
      setSavingCustomer(false);
    }
  };

  const confirmDeleteCustomer = async () => {
    if (deleteId === null) return;

    try {
      setDeletingCustomer(true);
      setCustomersError(null);
      await api.delete(`/api/customers/${deleteId}`);
      await fetchCustomers();
      setDeleteId(null);
    } catch (error) {
      setCustomersError("Failed to delete customer.");
      toast.error("Failed to delete customer", {
        description: getApiErrorMessage(error),
      });
    } finally {
      setDeletingCustomer(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Customers</h1>
        <Button className="gap-2" onClick={openAddCustomer} disabled={loadingCustomers}>
          <Plus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-3 border-b border-border flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
              disabled={loadingCustomers}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>

          <Select value={balanceFilter} onValueChange={(v) => setBalanceFilter(v as BalanceFilter)} disabled={loadingCustomers}>
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue placeholder="Balance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All balances</SelectItem>
              <SelectItem value="they-owe">They owe us</SelectItem>
              <SelectItem value="we-owe">We owe them</SelectItem>
              <SelectItem value="settled">Settled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={tradeFilter} onValueChange={(v) => setTradeFilter(v as TradeFilter)} disabled={loadingCustomers}>
            <SelectTrigger className="h-8 w-[110px] text-xs">
              <SelectValue placeholder="Trades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All trades</SelectItem>
              <SelectItem value="1+">1+ trades</SelectItem>
              <SelectItem value="5+">5+ trades</SelectItem>
              <SelectItem value="10+">10+ trades</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortField)} disabled={loadingCustomers}>
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="tradeCount">Trade count</SelectItem>
              <SelectItem value="netFeeLcy">Net fee</SelectItem>
              <SelectItem value="lastTradeAtUtc">Last trade</SelectItem>
            </SelectContent>
          </Select>

          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs gap-1 text-muted-foreground">
              <X className="h-3 w-3" />
              Clear ({activeFilterCount})
            </Button>
          )}
        </div>

        {customersError && (
          <div className="px-4 py-2 text-sm text-destructive border-b border-border bg-destructive/5">
            {customersError}
          </div>
        )}

        <div className="overflow-x-auto">
        <Table className="min-w-[1300px]">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Note</TableHead>
              <TableHead className="text-center">Trades</TableHead>
              <TableHead className="text-right">Received (LCY)</TableHead>
              <TableHead className="text-right">Paid (LCY)</TableHead>
              <TableHead className="text-right">Net Fee (LCY)</TableHead>
              <TableHead>They Owe Us</TableHead>
              <TableHead>We Owe Them</TableHead>
              <TableHead className="text-right">Last Trade</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingCustomers ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                  Loading customers...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                  No customers found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <p className="font-semibold">{c.name}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-muted-foreground">{c.note || "—"}</p>
                  </TableCell>
                  <TableCell className="text-center font-mono">{c.tradeCount}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatNum(c.totalReceivedLcy)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatNum(c.totalPaidLcy)}</TableCell>
                  <TableCell className="text-right">
                    <span className="font-mono text-sm text-accent font-semibold">
                      {formatNum(c.netFeeLcy)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <BalanceList items={c.theyOweUs} variant="owe" />
                  </TableCell>
                  <TableCell>
                    <BalanceList items={c.weOweThem} variant="owed" />
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                    {c.lastTradeAtUtc ? formatDate(c.lastTradeAtUtc) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditCustomer(c)} disabled={loadingCustomers}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(c.id)} disabled={loadingCustomers}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </div>

      <Dialog open={customerModalOpen} onOpenChange={setCustomerModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? "Edit Customer" : "Add Customer"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="customer-name">Name</Label>
              <Input
                id="customer-name"
                placeholder="Customer name"
                value={customerForm.name}
                onChange={(e) => setCustomerForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-note">Note</Label>
              <Input
                id="customer-note"
                placeholder="Optional note"
                value={customerForm.note}
                onChange={(e) => setCustomerForm((prev) => ({ ...prev, note: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomerModalOpen(false)} disabled={savingCustomer}>
              Cancel
            </Button>
            <Button onClick={() => void saveCustomer()} disabled={!customerForm.name.trim() || savingCustomer}>
              {editingCustomer ? "Save Changes" : "Add Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. Are you sure?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingCustomer}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDeleteCustomer()} disabled={deletingCustomer} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Customers;
