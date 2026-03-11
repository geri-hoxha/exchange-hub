import { useState } from "react";
import { Plus, Pencil, Trash2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
                          <span key={i} className="font-mono text-xs text-foreground">
                            {formatNum(b.amount)} <span className="text-muted-foreground">{b.asset}</span>
                          </span>
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
