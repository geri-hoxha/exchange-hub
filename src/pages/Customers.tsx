import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Search, X, ChevronDown, ChevronUp, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  lastTradeAtUtc: string;
  theyOweUs: BalanceEntry[];
  weOweThem: BalanceEntry[];
}

const initialData: Customer[] = [
  {
    id: 1,
    name: "Erin Hoxha",
    note: "VIP client",
    createdAtUtc: "2026-03-06T18:43:22.300Z",
    tradeCount: 6,
    totalReceivedLcy: 10710.77640189,
    totalPaidLcy: 9891.04985733,
    netFeeLcy: 819.72654456,
    lastTradeAtUtc: "2026-03-06T18:42:30.525Z",
    theyOweUs: [{ asset: "USDT-TRC20", amount: 12403.986684 }],
    weOweThem: [{ asset: "EUR", amount: 9895 }],
  },
  {
    id: 2,
    name: "Marco Rossi",
    note: "",
    createdAtUtc: "2026-02-15T10:20:00.000Z",
    tradeCount: 3,
    totalReceivedLcy: 5200.50,
    totalPaidLcy: 4980.25,
    netFeeLcy: 220.25,
    lastTradeAtUtc: "2026-03-01T14:30:00.000Z",
    theyOweUs: [],
    weOweThem: [{ asset: "USD", amount: 350 }],
  },
];

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const formatNum = (n: number, decimals = 2) =>
  n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

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
          {formatNum(b.amount, 2)} {b.asset}
        </Badge>
      ))}
    </div>
  );
};

type BalanceFilter = "all" | "they-owe" | "we-owe" | "settled";
type TradeFilter = "all" | "1+" | "5+" | "10+";
type SortField = "name" | "tradeCount" | "netFeeLcy" | "lastTradeAtUtc";

const Customers = () => {
  const [data] = useState<Customer[]>(initialData);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [balanceFilter, setBalanceFilter] = useState<BalanceFilter>("all");
  const [tradeFilter, setTradeFilter] = useState<TradeFilter>("all");
  const [sortBy, setSortBy] = useState<SortField>("name");

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
      if (sortBy === "lastTradeAtUtc") return new Date(b.lastTradeAtUtc).getTime() - new Date(a.lastTradeAtUtc).getTime();
      return 0;
    });

    return result;
  }, [data, search, balanceFilter, tradeFilter, sortBy]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Customers</h1>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm">
        <div className="p-3 border-b border-border flex flex-wrap items-center gap-2">
          <div className="relative w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>

          <Select value={balanceFilter} onValueChange={(v) => setBalanceFilter(v as BalanceFilter)}>
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

          <Select value={tradeFilter} onValueChange={(v) => setTradeFilter(v as TradeFilter)}>
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

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortField)}>
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

        <div className="overflow-x-auto">
        <Table>
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
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                  No customers found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <>
                  <TableRow
                    key={c.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                  >
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
                      {formatDate(c.lastTradeAtUtc)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(c.id); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        {expandedId === c.id ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground mt-2" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground mt-2" />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Expanded details */}
                  {expandedId === c.id && (
                    <TableRow key={`${c.id}-expanded`}>
                      <TableCell colSpan={10} className="bg-muted/30 px-6 py-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Created</p>
                            <p className="font-mono">{formatDate(c.createdAtUtc)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Total Received</p>
                            <p className="font-mono">{formatNum(c.totalReceivedLcy, 8)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Total Paid</p>
                            <p className="font-mono">{formatNum(c.totalPaidLcy, 8)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Net Fee</p>
                            <p className="font-mono text-accent font-semibold">{formatNum(c.netFeeLcy, 8)}</p>
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

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. Are you sure?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => setDeleteId(null)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Customers;
