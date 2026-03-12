import { LineChart, Landmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts";

interface ProfitCustomerFees {
  totalExchanges: number;
  totalFeeLcy: number;
}

interface ProfitVendorFees {
  totalPurchases: number;
  totalFeeLcy: number;
  favorableDealsLcy: number;
  extraCostsLcy: number;
}

interface ProfitOwnerContributions {
  totalDepositsLcy: number;
  totalWithdrawalsLcy: number;
  netCompanyDebtLcy: number;
}

export interface ProfitReport {
  customerFees: ProfitCustomerFees;
  vendorFees: ProfitVendorFees;
  ownerContributions: ProfitOwnerContributions;
  grossProfitLcy: number;
  netProfitLcy: number;
  explanation: string;
}

const formatNum = (n: number) =>
  n.toLocaleString(undefined, { maximumFractionDigits: 20 });

const COLORS = [
  "hsl(217, 91%, 40%)",
  "hsl(160, 84%, 39%)",
  "hsl(0, 84%, 60%)",
  "hsl(38, 92%, 50%)",
];

interface Props {
  report: ProfitReport | null;
  error: string | null;
  loading: boolean;
  onRetry: () => void;
}

export const ProfitSection = ({ report, error, loading, onRetry }: Props) => {
  const stats = [
    { label: "Gross Profit (LCY)", value: formatNum(report?.grossProfitLcy ?? 0), icon: LineChart },
    { label: "Net Profit (LCY)", value: formatNum(report?.netProfitLcy ?? 0), icon: Landmark },
  ];

  const barData = report
    ? [
        { name: "Customer Fees", value: report.customerFees.totalFeeLcy },
        { name: "Vendor Fee", value: report.vendorFees.totalFeeLcy },
        { name: "Favorable Deals", value: report.vendorFees.favorableDealsLcy },
        { name: "Extra Costs", value: Math.abs(report.vendorFees.extraCostsLcy) },
      ]
    : [];

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-base font-semibold text-foreground">Profit Summary</h2>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 gap-3 p-4 border-b border-border">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <s.icon className="h-4 w-4 text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground leading-tight">{s.label}</p>
              <p className="text-sm font-bold font-mono truncate">{loading ? "..." : s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {error ? (
          <div className="p-4 flex items-center justify-between gap-3">
            <p className="text-sm text-destructive">{error}</p>
            <Button size="sm" onClick={onRetry}>Retry</Button>
          </div>
        ) : loading ? (
          <div className="p-4 text-sm text-muted-foreground">Loading...</div>
        ) : !report ? (
          <div className="p-4 text-sm text-muted-foreground">No data found.</div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Bar chart */}
            {barData.length > 0 && (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v: number) => formatNum(v)} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
                  <Tooltip formatter={(v: number) => formatNum(v)} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {barData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                customer fees: {formatNum(report.customerFees.totalFeeLcy)}
              </Badge>
              <Badge variant="outline" className="font-mono text-xs">
                vendor fee: {formatNum(report.vendorFees.totalFeeLcy)}
              </Badge>
              <Badge variant="outline" className="font-mono text-xs">
                withdrawals: {formatNum(report.ownerContributions.totalWithdrawalsLcy)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{report.explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
};
