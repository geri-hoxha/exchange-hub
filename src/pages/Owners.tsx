import { useState } from "react";
import { Plus, Pencil, Trash2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface BalanceEntry {
  asset: string;
  amount: number;
}

interface Owner {
  id: number;
  name: string;
  note: string;
  createdAtUtc: string;
  balances: BalanceEntry[];
}

const initialData: Owner[] = [
  {
    id: 1,
    name: "Erin Hoxha",
    note: "note",
    createdAtUtc: "2026-03-06T02:28:46.0494545+00:00",
    balances: [
      { asset: "EUR", amount: 2000 },
      { asset: "USDT-TRC20", amount: 5014.7 },
    ],
  },
];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const formatNum = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Owners = () => {
  const [data] = useState<Owner[]>(initialData);
  const [search, setSearch] = useState("");

  const filtered = data.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.note.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Owners</h1>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Owner
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm">
        <div className="p-3 border-b border-border">
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
        </div>

        <Table>
          <TableHeader>
            <TableRow>
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
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  No owners found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((o) => (
                <TableRow key={o.id}>
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
                  <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(o.createdAtUtc)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
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
  );
};

export default Owners;
