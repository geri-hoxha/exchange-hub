import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Landmark,
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

const RANK_COLORS = ["text-yellow-500", "text-muted-foreground", "text-amber-700"];

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

  const topOwners = [...(report?.owners ?? [])]
    .sort((a, b) => Math.abs(b.netContributionLcy) - Math.abs(a.netContributionLcy))
    .slice(0, 5);

  const maxContrib = topOwners.length ? Math.abs(topOwners[0].netContributionLcy) : 1;

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

      {topOwners.length > 0 && !loading && !error && (
        <div className="px-4 py-3 border-b border-border space-y-2">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Crown className="h-3 w-3" /> Top owners by contribution
          </p>
          {topOwners.map((o, i) => (
            <div key={o.ownerId} className="flex items-center gap-2">
              <span className={`text-xs font-bold w-4 text-right ${RANK_COLORS[i] ?? "text-muted-foreground"}`}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-medium truncate">{o.ownerName}</span>
                  <span className="text-[10px] font-mono text-muted-foreground ml-2 shrink-0">{formatNum(Math.abs(o.netContributionLcy))}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${(Math.abs(o.netContributionLcy) / maxContrib) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
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
                  <TableCell className="font-medium text-base ">{o.ownerName}</TableCell>
                  <TableCell className="text-right font-mono text-base">{formatNum(o.netContributionLcy)}</TableCell>
                  <TableCell>
                    <div className="space-y-1 md:w-60">
                      {o.directions.map((d) => (
                        <div key={d.direction} className="flex flex-wrap gap-1">
                          <Badge variant="secondary" className="text-xs">{d.direction}</Badge>
                          {d.assets.map((a) => (
                            <Badge key={a.asset} variant="outline" className="font-mono text-xs">
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
