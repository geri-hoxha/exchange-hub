import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios";
import { CustomerFeesSection, type CustomerFeesReport } from "@/components/dashboard/CustomerFeesSection";
import { ProfitSection, type ProfitReport } from "@/components/dashboard/ProfitSection";
import { VendorFeesSection, type VendorFeesReport } from "@/components/dashboard/VendorFeesSection";
import { OwnerContributionsSection, type OwnerContributionsReport } from "@/components/dashboard/OwnerContributionsSection";

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

  const retry = () => void fetchDashboardReports();

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Customer, vendor, owner and profit overview</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 self-start sm:self-auto"
          onClick={retry}
          disabled={loadingReports}
        >
          <RefreshCw className={`h-4 w-4 ${loadingReports ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CustomerFeesSection
          report={customerFeesReport}
          error={customerFeesError}
          loading={loadingReports}
          onRetry={retry}
        />
        <ProfitSection
          report={profitReport}
          error={profitError}
          loading={loadingReports}
          onRetry={retry}
        />
        <VendorFeesSection
          report={vendorFeesReport}
          error={vendorFeesError}
          loading={loadingReports}
          onRetry={retry}
        />
        <OwnerContributionsSection
          report={ownerContributionsReport}
          error={ownerContributionsError}
          loading={loadingReports}
          onRetry={retry}
        />
      </div>
    </div>
  );
};

export default Dashboard;
