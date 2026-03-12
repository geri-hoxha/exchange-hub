import {
  ArrowLeftRight,
  HandCoins,
  Wallet,
  Crown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface AssetPairFee {
  receiveAsset: string;
  payAsset: string;
  exchangeCount: number;
  totalReceiveAmountLcy: number;
  totalPayAmountLcy: number;
  totalFeeLcy: number;
}

interface CustomerFeeSummary {
  customerId: number;
  customerName: string;
  totalExchanges: number;
  totalFeeLcy: number;
  assetPairs: AssetPairFee[];
}

export interface CustomerFeesReport {
  totalExchanges: number;
  totalFeeLcy: number;
  totalReceiveAmountLcy: number;
  totalPayAmountLcy: number;
  customers: CustomerFeeSummary[];
}

const formatNum = (n: number) =>
  n.toLocaleString(undefined, { maximumFractionDigits: 20 });

const RANK_COLORS = ["text-yellow-500", "text-muted-foreground", "text-amber-700"];

interface Props {
  report: CustomerFeesReport | null;
  error: string | null;
  loading: boolean;
  onRetry: () => void;
}

export const CustomerFeesSection = ({ report, error, loading, onRetry }: Props) => {
  const stats = [
    { label: "Exchanges", value: report?.totalExchanges.toLocaleString() ?? "0", icon: ArrowLeftRight },
    { label: "Fee (LCY)", value: formatNum(report?.totalFeeLcy ?? 0), icon: HandCoins },
    { label: "Receive (LCY)", value: formatNum(report?.totalReceiveAmountLcy ?? 0), icon: Wallet },
    { label: "Pay (LCY)", value: formatNum(report?.totalPayAmountLcy ?? 0), icon: Wallet },
  ];

  const topCustomers = [...(report?.customers ?? [])]
    .sort((a, b) => Math.abs(b.totalFeeLcy) - Math.abs(a.totalFeeLcy))
    .slice(0, 5);

  const maxFee = topCustomers.length ? Math.abs(topCustomers[0].totalFeeLcy) : 1;

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-base font-semibold text-foreground">Customer Fees</h2>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 gap-3 p-4 border-b border-border">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <s.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground leading-tight">{s.label}</p>
              <p className="text-sm font-bold font-mono truncate">{loading ? "..." : s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Top customers leaderboard */}
      {topCustomers.length > 0 && !loading && !error && (
        <div className="px-4 py-3 border-b border-border space-y-2">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Crown className="h-3 w-3" /> Top customers by fee
          </p>
          {topCustomers.map((c, i) => (
            <div key={c.customerId} className="flex items-center gap-2">
              <span className={`text-xs font-bold w-4 text-right ${RANK_COLORS[i] ?? "text-muted-foreground"}`}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-medium truncate">{c.customerName}</span>
                  <span className="text-[10px] font-mono text-muted-foreground ml-2 shrink-0">{formatNum(Math.abs(c.totalFeeLcy))}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${(Math.abs(c.totalFeeLcy) / maxFee) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {error ? (
          <div className="p-4 flex items-center justify-between gap-3">
            <p className="text-sm text-destructive">{error}</p>
            <Button size="sm" onClick={onRetry}>Retry</Button>
          </div>
        ) : loading ? (
          <div className="p-4 text-sm text-muted-foreground">Loading...</div>
        ) : !report?.customers?.length ? (
          <div className="p-4 text-sm text-muted-foreground">No data found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Exchanges</TableHead>
                <TableHead className="text-right">Fee (LCY)</TableHead>
                <TableHead>Pairs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.customers.map((c) => (
                <TableRow key={c.customerId}>
                  <TableCell className="font-medium text-sm">{c.customerName}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{c.totalExchanges}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatNum(c.totalFeeLcy)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {c.assetPairs.map((p) => (
                        <Badge key={`${p.receiveAsset}-${p.payAsset}`} variant="outline" className="font-mono text-[10px]">
                          {p.receiveAsset}→{p.payAsset} ({p.exchangeCount})
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};
