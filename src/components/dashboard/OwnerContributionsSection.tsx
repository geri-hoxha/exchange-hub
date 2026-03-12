import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Landmark,
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

interface OwnerDirectionAsset {
  asset: string;
  amount: number;
  totalValueLcy: number;
}

interface OwnerDirectionSummary {
  direction: string;
  totalAmount: number;
  totalValueLcy: number;
  assets: OwnerDirectionAsset[];
}

interface OwnerContributionSummary {
  ownerId: number;
  ownerName: string;
  netContributionLcy: number;
  directions: OwnerDirectionSummary[];
}

export interface OwnerContributionsReport {
  totalDepositsLcy: number;
  totalWithdrawalsLcy: number;
  netCompanyDebtLcy: number;
  owners: OwnerContributionSummary[];
}

const formatNum = (n: number) =>
  n.toLocaleString(undefined, { maximumFractionDigits: 20 });

const COLORS = [
  "hsl(217, 91%, 40%)",
  "hsl(160, 84%, 39%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 84%, 60%)",
];

interface Props {
  report: OwnerContributionsReport | null;
  error: string | null;
  loading: boolean;
  onRetry: () => void;
}

export const OwnerContributionsSection = ({ report, error, loading, onRetry }: Props) => {
  const stats = [
    { label: "Deposits (LCY)", value: formatNum(report?.totalDepositsLcy ?? 0), icon: ArrowDownToLine },
    { label: "Withdrawals (LCY)", value: formatNum(report?.totalWithdrawalsLcy ?? 0), icon: ArrowUpFromLine },
    { label: "Net Debt (LCY)", value: formatNum(report?.netCompanyDebtLcy ?? 0), icon: Landmark },
  ];

  const barData = report?.owners?.map((o) => ({
    name: o.ownerName,
    value: o.netContributionLcy,
  })) ?? [];

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-base font-semibold text-foreground">Owner Contributions</h2>
      </div>

      <div className="grid grid-cols-3 gap-3 p-4 border-b border-border">
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

      {barData.length > 0 && !loading && !error && (
        <div className="px-4 pt-3 pb-1 border-b border-border">
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={barData} margin={{ left: 10, right: 10 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => formatNum(v)} />
              <Tooltip formatter={(v: number) => formatNum(v)} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {barData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
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
        ) : !report?.owners?.length ? (
          <div className="p-4 text-sm text-muted-foreground">No data found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Owner</TableHead>
                <TableHead className="text-right">Net (LCY)</TableHead>
                <TableHead>Directions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.owners.map((o) => (
                <TableRow key={o.ownerId}>
                  <TableCell className="font-medium text-sm">{o.ownerName}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatNum(o.netContributionLcy)}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {o.directions.map((d) => (
                        <div key={d.direction} className="flex flex-wrap gap-1">
                          <Badge variant="secondary" className="text-[10px]">{d.direction}</Badge>
                          {d.assets.map((a) => (
                            <Badge key={a.asset} variant="outline" className="font-mono text-[10px]">
                              {a.asset}: {formatNum(a.amount)}
                            </Badge>
                          ))}
                        </div>
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
