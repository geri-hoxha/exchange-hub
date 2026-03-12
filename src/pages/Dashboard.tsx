import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeftRight,
  HandCoins,
  Wallet,
  RefreshCw,
  Landmark,
  ArrowDownToLine,
  ArrowUpFromLine,
  LineChart,
  Building2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import api from "@/lib/axios";

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

interface CustomerFeesReport {
  totalExchanges: number;
  totalFeeLcy: number;
  totalReceiveAmountLcy: number;
  totalPayAmountLcy: number;
  customers: CustomerFeeSummary[];
}

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

interface OwnerContributionsReport {
  totalDepositsLcy: number;
  totalWithdrawalsLcy: number;
  netCompanyDebtLcy: number;
  owners: OwnerContributionSummary[];
}

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

interface VendorFeesReport {
  totalPurchases: number;
  totalFeeLcy: number;
  totalFavorableDealsLcy: number;
  totalExtraCostsLcy: number;
  vendors: VendorFeeSummary[];
}

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

interface ProfitReport {
  customerFees: ProfitCustomerFees;
  vendorFees: ProfitVendorFees;
  ownerContributions: ProfitOwnerContributions;
  grossProfitLcy: number;
  netProfitLcy: number;
  explanation: string;
}

const formatNum = (n: number) =>
  n.toLocaleString(undefined, { maximumFractionDigits: 20 });

const Dashboard = () => {
  const [customerFeesReport, setCustomerFeesReport] = useState<CustomerFeesReport | null>(null);
  const [ownerContributionsReport, setOwnerContributionsReport] = useState<OwnerContributionsReport | null>(null);
  const [vendorFeesReport, setVendorFeesReport] = useState<VendorFeesReport | null>(null);
  const [profitReport, setProfitReport] = useState<ProfitReport | null>(null);
  const [loadingReports, setLoadingReports] = useState(true);
  const [customerFeesError, setCustomerFeesError] = useState<string | null>(null);
  const [ownerContributionsError, setOwnerContributionsError] = useState<string | null>(null);
  const [vendorFeesError, setVendorFeesError] = useState<string | null>(null);
  const [profitError, setProfitError] = useState<string | null>(null);

  const fetchDashboardReports = useCallback(async () => {
    setLoadingReports(true);
    setCustomerFeesError(null);
    setOwnerContributionsError(null);
    setVendorFeesError(null);
    setProfitError(null);

    const [customerFeesRes, ownerContributionsRes, vendorFeesRes, profitRes] = await Promise.allSettled([
      api.get<CustomerFeesReport>("/api/reports/customer-fees"),
      api.get<OwnerContributionsReport>("/api/reports/owner-contributions"),
      api.get<VendorFeesReport>("/api/reports/vendor-fees"),
      api.get<ProfitReport>("/api/reports/profit"),
    ]);

    if (customerFeesRes.status === "fulfilled") {
      setCustomerFeesReport(customerFeesRes.value.data);
    } else {
      setCustomerFeesError("Failed to load customer fees report.");
      setCustomerFeesReport(null);
    }

    if (ownerContributionsRes.status === "fulfilled") {
      setOwnerContributionsReport(ownerContributionsRes.value.data);
    } else {
      setOwnerContributionsError("Failed to load owner contributions report.");
      setOwnerContributionsReport(null);
    }

    if (vendorFeesRes.status === "fulfilled") {
      setVendorFeesReport(vendorFeesRes.value.data);
    } else {
      setVendorFeesError("Failed to load vendor fees report.");
      setVendorFeesReport(null);
    }

    if (profitRes.status === "fulfilled") {
      setProfitReport(profitRes.value.data);
    } else {
      setProfitError("Failed to load profit report.");
      setProfitReport(null);
    }

    setLoadingReports(false);
  }, []);

  useEffect(() => {
    void fetchDashboardReports();
  }, [fetchDashboardReports]);

  const customerStatCards = useMemo(
    () => [
      {
        title: "Total Exchanges",
        value: customerFeesReport?.totalExchanges.toLocaleString() ?? "0",
        icon: ArrowLeftRight,
        color: "text-primary",
        bg: "bg-primary/10",
      },
      {
        title: "Total Fee (LCY)",
        value: formatNum(customerFeesReport?.totalFeeLcy ?? 0),
        icon: HandCoins,
        color: "text-accent",
        bg: "bg-accent/10",
      },
      {
        title: "Total Receive (LCY)",
        value: formatNum(customerFeesReport?.totalReceiveAmountLcy ?? 0),
        icon: Wallet,
        color: "text-primary",
        bg: "bg-primary/10",
      },
      {
        title: "Total Pay (LCY)",
        value: formatNum(customerFeesReport?.totalPayAmountLcy ?? 0),
        icon: Wallet,
        color: "text-accent",
        bg: "bg-accent/10",
      },
    ],
    [customerFeesReport]
  );

  const ownerStatCards = useMemo(
    () => [
      {
        title: "Total Deposits (LCY)",
        value: formatNum(ownerContributionsReport?.totalDepositsLcy ?? 0),
        icon: ArrowDownToLine,
        color: "text-primary",
        bg: "bg-primary/10",
      },
      {
        title: "Total Withdrawals (LCY)",
        value: formatNum(ownerContributionsReport?.totalWithdrawalsLcy ?? 0),
        icon: ArrowUpFromLine,
        color: "text-accent",
        bg: "bg-accent/10",
      },
      {
        title: "Net Company Debt (LCY)",
        value: formatNum(ownerContributionsReport?.netCompanyDebtLcy ?? 0),
        icon: Landmark,
        color: "text-primary",
        bg: "bg-primary/10",
      },
    ],
    [ownerContributionsReport]
  );

  const vendorStatCards = useMemo(
    () => [
      {
        title: "Total Purchases",
        value: vendorFeesReport?.totalPurchases.toLocaleString() ?? "0",
        icon: Building2,
        color: "text-primary",
        bg: "bg-primary/10",
      },
      {
        title: "Vendor Fee (LCY)",
        value: formatNum(vendorFeesReport?.totalFeeLcy ?? 0),
        icon: HandCoins,
        color: "text-accent",
        bg: "bg-accent/10",
      },
      {
        title: "Favorable Deals (LCY)",
        value: formatNum(vendorFeesReport?.totalFavorableDealsLcy ?? 0),
        icon: ArrowDownToLine,
        color: "text-primary",
        bg: "bg-primary/10",
      },
      {
        title: "Extra Costs (LCY)",
        value: formatNum(vendorFeesReport?.totalExtraCostsLcy ?? 0),
        icon: ArrowUpFromLine,
        color: "text-accent",
        bg: "bg-accent/10",
      },
    ],
    [vendorFeesReport]
  );

  const profitStatCards = useMemo(
    () => [
      {
        title: "Gross Profit (LCY)",
        value: formatNum(profitReport?.grossProfitLcy ?? 0),
        icon: LineChart,
        color: "text-primary",
        bg: "bg-primary/10",
      },
      {
        title: "Net Profit (LCY)",
        value: formatNum(profitReport?.netProfitLcy ?? 0),
        icon: Landmark,
        color: "text-accent",
        bg: "bg-accent/10",
      },
    ],
    [profitReport]
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Customer, vendor, owner and profit overview</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 self-start sm:self-auto"
          onClick={() => void fetchDashboardReports()}
          disabled={loadingReports}
        >
          <RefreshCw className={`h-4 w-4 ${loadingReports ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {customerStatCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold font-mono">{loadingReports ? "..." : stat.value}</p>
                </div>
                <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {profitStatCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold font-mono">{loadingReports ? "..." : stat.value}</p>
                </div>
                <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Profit Summary</h2>
        </div>
        {profitError ? (
          <div className="p-6 flex items-center justify-between gap-3">
            <p className="text-sm text-destructive">{profitError}</p>
            <Button size="sm" onClick={() => void fetchDashboardReports()} disabled={loadingReports}>
              Retry
            </Button>
          </div>
        ) : loadingReports ? (
          <div className="p-6 text-sm text-muted-foreground">Loading profit report...</div>
        ) : !profitReport ? (
          <div className="p-6 text-sm text-muted-foreground">No profit data found.</div>
        ) : (
          <div className="p-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                customer fees: {formatNum(profitReport.customerFees.totalFeeLcy)}
              </Badge>
              <Badge variant="outline" className="font-mono text-xs">
                vendor fee: {formatNum(profitReport.vendorFees.totalFeeLcy)}
              </Badge>
              <Badge variant="outline" className="font-mono text-xs">
                owner withdrawals: {formatNum(profitReport.ownerContributions.totalWithdrawalsLcy)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{profitReport.explanation}</p>
          </div>
        )}
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Customers Breakdown</h2>
          {!!customerFeesReport?.customers?.length && (
            <Badge variant="secondary">{customerFeesReport.customers.length} customers</Badge>
          )}
        </div>

        {customerFeesError ? (
          <div className="p-6 flex items-center justify-between gap-3">
            <p className="text-sm text-destructive">{customerFeesError}</p>
            <Button size="sm" onClick={() => void fetchDashboardReports()} disabled={loadingReports}>
              Retry
            </Button>
          </div>
        ) : loadingReports ? (
          <div className="p-6 text-sm text-muted-foreground">Loading report...</div>
        ) : !customerFeesReport?.customers?.length ? (
          <div className="p-6 text-sm text-muted-foreground">No customer fee data found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Exchanges</TableHead>
                <TableHead className="text-right">Fee (LCY)</TableHead>
                <TableHead>Asset Pairs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customerFeesReport.customers.map((customer) => (
                <TableRow key={customer.customerId}>
                  <TableCell className="font-medium">{customer.customerName}</TableCell>
                  <TableCell className="text-right font-mono">{customer.totalExchanges}</TableCell>
                  <TableCell className="text-right font-mono">{formatNum(customer.totalFeeLcy)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {customer.assetPairs.map((pair) => (
                        <Badge
                          key={`${customer.customerId}-${pair.receiveAsset}-${pair.payAsset}`}
                          variant="outline"
                          className="font-mono text-xs"
                        >
                          {pair.receiveAsset} → {pair.payAsset} ({pair.exchangeCount})
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 mb-6">
        {vendorStatCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold font-mono">{loadingReports ? "..." : stat.value}</p>
                </div>
                <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Vendor Fees Breakdown</h2>
          {!!vendorFeesReport?.vendors?.length && (
            <Badge variant="secondary">{vendorFeesReport.vendors.length} vendors</Badge>
          )}
        </div>

        {vendorFeesError ? (
          <div className="p-6 flex items-center justify-between gap-3">
            <p className="text-sm text-destructive">{vendorFeesError}</p>
            <Button size="sm" onClick={() => void fetchDashboardReports()} disabled={loadingReports}>
              Retry
            </Button>
          </div>
        ) : loadingReports ? (
          <div className="p-6 text-sm text-muted-foreground">Loading vendor fees...</div>
        ) : !vendorFeesReport?.vendors?.length ? (
          <div className="p-6 text-sm text-muted-foreground">No vendor fee data found.</div>
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
              {vendorFeesReport.vendors.map((vendor) => (
                <TableRow key={vendor.vendorId}>
                  <TableCell className="font-medium">{vendor.vendorName}</TableCell>
                  <TableCell className="text-right font-mono">{vendor.totalPurchases}</TableCell>
                  <TableCell className="text-right font-mono">{formatNum(vendor.totalFeeLcy)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {vendor.assets.map((asset) => (
                        <Badge
                          key={`${vendor.vendorId}-${asset.asset}`}
                          variant="outline"
                          className="font-mono text-xs"
                        >
                          {asset.asset}: {asset.purchaseCount} buys, qty {formatNum(asset.totalQuantity)}, paid {formatNum(asset.totalPaidLcy)}, fee {formatNum(asset.totalFeeLcy)}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {ownerStatCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold font-mono">{loadingReports ? "..." : stat.value}</p>
                </div>
                <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Owner Contributions Breakdown</h2>
          {!!ownerContributionsReport?.owners?.length && (
            <Badge variant="secondary">{ownerContributionsReport.owners.length} owners</Badge>
          )}
        </div>

        {ownerContributionsError ? (
          <div className="p-6 flex items-center justify-between gap-3">
            <p className="text-sm text-destructive">{ownerContributionsError}</p>
            <Button size="sm" onClick={() => void fetchDashboardReports()} disabled={loadingReports}>
              Retry
            </Button>
          </div>
        ) : loadingReports ? (
          <div className="p-6 text-sm text-muted-foreground">Loading owner contributions...</div>
        ) : !ownerContributionsReport?.owners?.length ? (
          <div className="p-6 text-sm text-muted-foreground">No owner contribution data found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Owner</TableHead>
                <TableHead className="text-right">Net Contribution (LCY)</TableHead>
                <TableHead>Directions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ownerContributionsReport.owners.map((owner) => (
                <TableRow key={owner.ownerId}>
                  <TableCell className="font-medium">{owner.ownerName}</TableCell>
                  <TableCell className="text-right font-mono">{formatNum(owner.netContributionLcy)}</TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      {owner.directions.map((direction) => (
                        <div key={`${owner.ownerId}-${direction.direction}`} className="rounded-md border border-border p-2">
                          <div className="flex flex-wrap gap-2 mb-2">
                            <Badge variant="secondary">{direction.direction}</Badge>
                            <Badge variant="outline" className="font-mono text-xs">
                              amount: {formatNum(direction.totalAmount)}
                            </Badge>
                            <Badge variant="outline" className="font-mono text-xs">
                              lcy: {formatNum(direction.totalValueLcy)}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {direction.assets.map((asset) => (
                              <Badge
                                key={`${owner.ownerId}-${direction.direction}-${asset.asset}`}
                                variant="outline"
                                className="font-mono text-xs"
                              >
                                {asset.asset}: {formatNum(asset.amount)} ({formatNum(asset.totalValueLcy)} LCY)
                              </Badge>
                            ))}
                          </div>
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

export default Dashboard;
