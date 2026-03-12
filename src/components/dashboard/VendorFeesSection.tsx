import {
  Building2,
  HandCoins,
  ArrowDownToLine,
  ArrowUpFromLine,
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

interface VendorAssetFee {
  asset: string;
  purchaseCount: number;
  totalQuantity: number;
  totalPaidLcy: number;
  totalFeeLcy: number;
}

interface VendorFeeSummary {
  vendorId: number;
  vendorName: string;
  totalPurchases: number;
  totalFeeLcy: number;
  assets: VendorAssetFee[];
}

export interface VendorFeesReport {
  totalPurchases: number;
  totalFeeLcy: number;
  totalFavorableDealsLcy: number;
  totalExtraCostsLcy: number;
  vendors: VendorFeeSummary[];
}

const formatNum = (n: number) =>
  n.toLocaleString(undefined, { maximumFractionDigits: 20 });

const RANK_COLORS = ["text-yellow-500", "text-muted-foreground", "text-amber-700"];

interface Props {
  report: VendorFeesReport | null;
  error: string | null;
  loading: boolean;
  onRetry: () => void;
}

export const VendorFeesSection = ({ report, error, loading, onRetry }: Props) => {
  const stats = [
    { label: "Purchases", value: report?.totalPurchases.toLocaleString() ?? "0", icon: Building2 },
    { label: "Fee (LCY)", value: formatNum(report?.totalFeeLcy ?? 0), icon: HandCoins },
    { label: "Favorable (LCY)", value: formatNum(report?.totalFavorableDealsLcy ?? 0), icon: ArrowDownToLine },
    { label: "Extra Costs (LCY)", value: formatNum(report?.totalExtraCostsLcy ?? 0), icon: ArrowUpFromLine },
  ];

  const pieData = report?.vendors?.map((v) => ({
    name: v.vendorName,
    value: Math.abs(v.totalFeeLcy),
  })) ?? [];

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-base font-semibold text-foreground">Vendor Fees</h2>
      </div>

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

      {pieData.length > 0 && !loading && !error && (
        <div className="px-4 pt-3 pb-1 border-b border-border">
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={30} outerRadius={55} paddingAngle={2}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatNum(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {error ? (
          <div className="p-4 flex items-center justify-between gap-3">
            <p className="text-sm text-destructive">{error}</p>
            <Button size="sm" onClick={onRetry}>Retry</Button>
          </div>
        ) : loading ? (
          <div className="p-4 text-sm text-muted-foreground">Loading...</div>
        ) : !report?.vendors?.length ? (
          <div className="p-4 text-sm text-muted-foreground">No data found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead className="text-right">Purchases</TableHead>
                <TableHead className="text-right">Fee (LCY)</TableHead>
                <TableHead>Assets</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.vendors.map((v) => (
                <TableRow key={v.vendorId}>
                  <TableCell className="font-medium text-sm">{v.vendorName}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{v.totalPurchases}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatNum(v.totalFeeLcy)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {v.assets.map((a) => (
                        <Badge key={a.asset} variant="outline" className="font-mono text-[10px]">
                          {a.asset}: {a.purchaseCount}×, fee {formatNum(a.totalFeeLcy)}
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
