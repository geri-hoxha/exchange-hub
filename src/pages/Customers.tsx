import { useState } from "react";
import { Plus, Pencil, Trash2, Search, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

const Customers = () => {
  const [data] = useState<Customer[]>(initialData);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = data.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.note.toLowerCase().includes(search.toLowerCase())
  );

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
        <div className="p-4 border-b border-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

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
                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
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
                      <div>
                        <p className="font-semibold">{c.name}</p>
                        {c.note && <p className="text-xs text-muted-foreground">{c.note}</p>}
                      </div>
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
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); }}>
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
                      <TableCell colSpan={9} className="bg-muted/30 px-6 py-4">
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
    </div>
  );
};

export default Customers;
