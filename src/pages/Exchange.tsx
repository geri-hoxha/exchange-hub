import { useState, useEffect, useRef } from "react";
import { ArrowLeftRight, ArrowRight, Check, X, Pencil, Download, Share2, RefreshCw, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { toPng } from "html-to-image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import api from "@/lib/axios";
import { getApiErrorMessage } from "@/lib/apiError";
import { cn } from "@/lib/utils";
import { CurrencyIcon } from "@/components/CurrencyIcon";
import { getAllAssets, type Asset } from "@/services/assetsService";

 
 
 
type ExchangeAsset = Asset & {
  symbol?: string;
  icon?: string;
};

interface ExchangeQuoteRequest {
  customerPaysAsset: string;
  customerReceivesAsset: string;
  customerPaysAmount: number;
  customerReceivesAmount: number;
}

interface ExchangeQuoteResponse {
  id: string;
  inputMode: string;
  customerPaysAsset: string;
  customerPaysAmount: number;
  customerPaysAmountLcy: number;
  customerReceivesAsset: string;
  customerReceivesAmount: number;
  customerReceivesAmountLcy: number;
  agreedRate: number;
  feeLcy: number;
  marginFeeRate: number;
  platformFeeRate: number;
  marginFeeAmount: number;
  platformFeeAmount: number;
  hasSufficientInventory: boolean;
}

interface ExchangeCustomer {
  id: number;
  name: string;
}

const Exchange = () => {
  // Step 1
  const [mode, setMode] = useState<"wants" | "has">("wants");
  const [amount, setAmount] = useState("");
  const [buyCurrency, setBuyCurrency] = useState("");
  const [payCurrency, setPayCurrency] = useState("");
  const previousModeRef = useRef<"wants" | "has">("wants");

  // Step 2
  const [step, setStep] = useState<1 | 2>(1);
  const [gasFee, setGasFee] = useState("");
  const [quote, setQuote] = useState<ExchangeQuoteResponse | null>(null);
  const [fetchingQuote, setFetchingQuote] = useState(false);
  const [savingExchange, setSavingExchange] = useState(false);
  const [customers, setCustomers] = useState<ExchangeCustomer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);

  // Editable total
  const [editingTotal, setEditingTotal] = useState(false);
  const [totalOverride, setTotalOverride] = useState<string>("");

  // Editable platform fee
  const [editingFee, setEditingFee] = useState(false);
  const [feeOverride, setFeeOverride] = useState<string>("");

  // Receipt preview
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Rates refresh
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const handleRefreshRates = () => {
    setRefreshing(true);
    // Simulate rate refresh — replace with real API call later
    setTimeout(() => {
      setLastUpdated(new Date());
      setRefreshing(false);
      setTotalOverride("");
      toast.success("Rates refreshed");
    }, 600);
  };

  // currencies
  const [currencies, setCurrencies] = useState<ExchangeAsset[]>([]);

  useEffect(() => {
    getCurrencies()
  }, []);

  useEffect(() => {
    void getCustomers();
  }, []);

  const getCurrencies = async () => {
    const response = await getAllAssets();
    setCurrencies(response as ExchangeAsset[]);
  };

  const getCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const response = await api.get<{ items?: ExchangeCustomer[] } | ExchangeCustomer[]>("/api/customers");
      const items = Array.isArray(response.data) ? response.data : (response.data.items ?? []);
      setCustomers(items.map((customer) => ({ id: customer.id, name: customer.name })));
    } catch {
      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  };


  const buyCurrencyData = currencies.find((c) => c.code === buyCurrency);
  const payCurrencyData = currencies.find((c) => c.code === payCurrency);
  const amountNum = parseFloat(amount) || 0;

  const quotedCustomerPaysAmount = quote?.customerPaysAmount ?? 0;
  const quotedCustomerReceivesAmount = quote?.customerReceivesAmount ?? 0;
  const quotedCustomerPaysAsset = quote?.customerPaysAsset ?? payCurrency;
  const quotedCustomerReceivesAsset = quote?.customerReceivesAsset ?? buyCurrency;

  const isBuyingFiat = buyCurrencyData?.type === "fiat";
  const exchangeRate = quote?.agreedRate ?? 0;
  const feePercent = quote?.platformFeeRate ?? 0;
  const feeAmount = quote?.platformFeeAmount ?? 0;
  const effectiveFeePercent = feeOverride !== "" ? (parseFloat(feeOverride) || 0) : feePercent;
  const subtotalBase = quotedCustomerPaysAmount - feeAmount;
  const effectiveFeeAmount = feeOverride !== "" ? (subtotalBase * effectiveFeePercent / 100) : feeAmount;
  const subtotal = Math.max(quotedCustomerPaysAmount - effectiveFeeAmount, 0);
  const computedTotal = subtotal + effectiveFeeAmount;

  const primaryAsset = mode === "wants" ? quotedCustomerReceivesAsset : quotedCustomerPaysAsset;
  const primaryAmount = mode === "wants" ? quotedCustomerReceivesAmount : quotedCustomerPaysAmount;
  const primaryCurrencyData = currencies.find((c) => c.code === primaryAsset);
  const quotedPayCurrencyData = currencies.find((c) => c.code === quotedCustomerPaysAsset);
  const gasFeeNum = parseFloat(gasFee) || 0;

  // Effective total (might be overridden)
  const effectiveTotal = totalOverride !== "" ? (parseFloat(totalOverride) || 0) : computedTotal;
  const adjustment = effectiveTotal - computedTotal;
  const hasAdjustment = totalOverride !== "" && Math.abs(adjustment) > 0.001;

  const selectedPairHasOppositeTypes =
    !!buyCurrencyData &&
    !!payCurrencyData &&
    buyCurrencyData.type !== payCurrencyData.type;

  const canProceed =
    !!amount &&
    amountNum > 0 &&
    !!buyCurrency &&
    !!payCurrency &&
    buyCurrency !== payCurrency &&
    selectedPairHasOppositeTypes;

  // Reset manual override when quote changes.
  useEffect(() => {
    setTotalOverride("");
    setFeeOverride("");
  }, [quote?.id]);

  // When toggling between "wants" and "has", flip selected currencies.
  useEffect(() => {
    if (previousModeRef.current !== mode) {
      setBuyCurrency(payCurrency);
      setPayCurrency(buyCurrency);
      previousModeRef.current = mode;
    }
  }, [mode, buyCurrency, payCurrency]);

  // Keep second selection valid: it must be the opposite type of the first one.
  useEffect(() => {
    if (!buyCurrencyData || !payCurrencyData) return;
    if (buyCurrencyData.type === payCurrencyData.type) {
      setPayCurrency("");
    }
  }, [buyCurrency, payCurrency, buyCurrencyData, payCurrencyData]);

  const handleNext = async () => {
    if (!canProceed) return;

    const payload: ExchangeQuoteRequest =
      mode === "wants"
        ? {
            customerPaysAsset: payCurrency,
            customerReceivesAsset: buyCurrency,
            customerPaysAmount: 0,
            customerReceivesAmount: amountNum,
          }
        : {
            customerPaysAsset: buyCurrency,
            customerReceivesAsset: payCurrency,
            customerPaysAmount: amountNum,
            customerReceivesAmount: 0,
          };

    try {
      setFetchingQuote(true);
      const response = await api.post<ExchangeQuoteResponse>("/api/exchange-slips/preview", payload);
      setQuote(response.data);
      setStep(2);
      setTotalOverride("");
    } catch (error) {
      toast.error("Failed to get exchange quote", {
        description: getApiErrorMessage(error),
      });
    } finally {
      setFetchingQuote(false);
    }
  };

  const handleDiscard = () => {
    setStep(1);
    setAmount("");
    setBuyCurrency("");
    setPayCurrency("");
    setGasFee("");
    setQuote(null);
    setTotalOverride("");
    setFeeOverride("");
    setEditingTotal(false);
    setEditingFee(false);
    setCustomerId(null);
    setCustomerPickerOpen(false);
  };

  const handleSave = async () => {
    if (!quote?.id) return;
    if (!customerId) {
      toast.error("Customer is required", {
        description: "Please select a customer before saving this exchange.",
      });
      return;
    }

    const paymentPath = (exchangeSlipId: string) =>
      mode === "has"
        ? `/api/exchange-slips/${exchangeSlipId}/pay-payments`
        : `/api/exchange-slips/${exchangeSlipId}/receive-payments`;

    try {
      setSavingExchange(true);
      const fromQuoteResponse = await api.post<{ id?: string }>(
        `/api/exchange-slips/${quote.id}/from-quote`,
        { customerId }
      );
      const exchangeSlipId = fromQuoteResponse.data?.id || quote.id;
      await api.post(paymentPath(exchangeSlipId), {});

      setShowReceipt(true);
      // Generate image after dialog renders
      setTimeout(async () => {
        if (receiptRef.current) {
          try {
            const dataUrl = await toPng(receiptRef.current, {
              backgroundColor: "#0d1117",
              pixelRatio: 2,
            });
            setReceiptImage(dataUrl);
          } catch (err) {
            console.error("Failed to generate receipt image", err);
          }
        }
      }, 300);
    } catch (error) {
      toast.error("Failed to finalize exchange", {
        description: getApiErrorMessage(error),
      });
    } finally {
      setSavingExchange(false);
    }
  };

  const handleDownloadReceipt = () => {
    if (!receiptImage) return;
    const link = document.createElement("a");
    link.download = `exchange-${quotedCustomerReceivesAsset}-${quotedCustomerPaysAsset}-${Date.now()}.png`;
    link.href = receiptImage;
    link.click();
  };

  const handleShareReceipt = async () => {
    if (!receiptImage) return;
    try {
      const blob = await (await fetch(receiptImage)).blob();
      const file = new File([blob], `exchange-receipt.png`, { type: "image/png" });
      if (navigator.share) {
        await navigator.share({ files: [file], title: "Exchange Receipt" });
      } else {
        handleDownloadReceipt();
      }
    } catch {
      handleDownloadReceipt();
    }
  };

  const handleConfirmAndClose = () => {
    toast.success("Exchange recorded successfully", {
      description: `${formatNum(quotedCustomerReceivesAmount)} ${quotedCustomerReceivesAsset} → ${formatNum(effectiveTotal)} ${quotedCustomerPaysAsset}`,
    });
    setShowReceipt(false);
    setReceiptImage(null);
    handleDiscard();
  };

  const handleTotalEdit = () => {
    setEditingTotal(true);
    setTotalOverride(totalOverride || String(computedTotal));
  };

  const handleTotalConfirm = () => {
    setEditingTotal(false);
  };

  const formatNum = (n: number) =>
    n.toLocaleString(undefined, { maximumFractionDigits: 20 });

  const payCurrencyTypeFilter =
    buyCurrencyData?.type === "crypto"
      ? "fiat"
      : buyCurrencyData?.type === "fiat"
        ? "crypto"
        : null;

  const payCurrencyOptions = payCurrencyTypeFilter
    ? currencies.filter((c) => c.type === payCurrencyTypeFilter)
    : currencies;
  const selectedCustomer = customers.find((customer) => customer.id === customerId);
  const renderCurrencyOption = (asset: ExchangeAsset) => (
    <SelectItem key={asset.code} value={asset.code}>
      <div className="flex items-center gap-2">
        <CurrencyIcon code={asset.code} />
        <span className="font-mono">{asset.code}</span>
      </div>
    </SelectItem>
  );

  return (
    <div>
      {/* Hero */}
      <div className="dark:text-nav-foreground bg-transparent text-foreground -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-6 pb-8 mb-2 dark:-mt-8 dark:pt-12 dark:pb-36 dark:mb-[-7rem]">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/20 mb-4">
            <ArrowLeftRight className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">Exchange Recorder</h1>
          <p className="text-muted-foreground dark:text-nav-foreground/50 text-sm">Record customer currency exchanges</p>
        </div>
      </div>

      {/* Refresh bar */}
      <div className="max-w-2xl mx-auto flex items-center justify-between mb-4">
        <p className="text-xs text-muted-foreground">
          Rates updated: <span className="font-mono">{lastUpdated.toLocaleTimeString()}</span>
        </p>
        <Button
          size="sm"
          onClick={handleRefreshRates}
          disabled={refreshing}
          className="text-xs gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh Rates
        </Button>
      </div>

      {/* Card */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-card rounded-2xl shadow-xl border border-border p-6 sm:p-8">
          {/* Steps indicator */}
          <div className="flex items-center gap-3 mb-6">
            <div className={`flex items-center gap-2 text-sm font-semibold ${step >= 1 ? "text-primary" : "text-muted-foreground"}`}>
              <span className={`h-6 w-6 rounded-full text-xs flex items-center justify-center font-bold ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>1</span>
              Input
            </div>
            <div className="flex-1 h-px bg-border" />
            <div className={`flex items-center gap-2 text-sm font-semibold ${step >= 2 ? "text-primary" : "text-muted-foreground"}`}>
              <span className={`h-6 w-6 rounded-full text-xs flex items-center justify-center font-bold ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>2</span>
              Quote
            </div>
          </div>

          {step === 1 && (
            <>
              {/* Mode toggle */}
              <div className="flex rounded-lg bg-muted p-1 mb-6">
                <button
                  onClick={() => setMode("wants")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all ${
                    mode === "wants"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Customer Wants
                </button>
                <button
                  onClick={() => setMode("has")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all ${
                    mode === "has"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Customer Has
                </button>
              </div>

              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                {mode === "wants" ? "Customer wants to buy" : "Customer has"}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 mb-6">
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-12 bg-background font-mono text-base"
                  placeholder="Amount"
                />
                <Select value={buyCurrency} onValueChange={setBuyCurrency}>
                  <SelectTrigger className="h-12 bg-background font-medium">
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest">Crypto</div>
                    {currencies.filter(c => c.type === "crypto").map((c) => renderCurrencyOption(c))}
                    <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Fiat</div>
                    {currencies.filter(c => c.type === "fiat").map((c) => renderCurrencyOption(c))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-border" />
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  <ArrowRight className="h-3.5 w-3.5" />
                  {mode === "wants" ? "PAYING WITH" : "WANTS TO GET"}
                </div>
                <div className="flex-1 h-px bg-border" />
              </div>

              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                {mode === "wants" ? "Payment currency" : "Target currency"}
              </label>
              <div className="mt-2 mb-8">
                <Select value={payCurrency} onValueChange={setPayCurrency}>
                  <SelectTrigger className="h-12 bg-background font-medium">
                    <SelectValue placeholder="Select payment currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      {payCurrencyTypeFilter === "crypto" ? "Crypto" : payCurrencyTypeFilter === "fiat" ? "Fiat" : "All"}
                    </div>
                    {payCurrencyOptions.map((c) => renderCurrencyOption(c))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={() => void handleNext()}
                size="lg"
                className="w-full h-12 text-base font-bold"
                disabled={!canProceed || fetchingQuote}
              >
                {fetchingQuote ? "Getting Quote..." : "Next"}
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              {/* Header */}
              <div className="flex items-center gap-2 mb-6">
                <Check className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">Review Exchange</h2>
              </div>

               {/* Breakdown table */}
               <div className="rounded-xl border border-border overflow-hidden mb-4">
                {/* Row: Customer Wants To Buy */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                  <span className="text-xs font-medium text-muted-foreground">{mode === "wants" ? "Customer Wants To Buy" : "Customer Has"}</span>
                  <div className="flex items-center gap-1.5">
                    {primaryAsset && <CurrencyIcon code={primaryAsset} />}
                    <span className="font-mono font-semibold text-sm">
                      {formatNum(primaryAmount)} {primaryAsset}
                    </span>
                  </div>
                </div>

                {/* Row: Exchange Rate */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <span className="text-xs font-medium text-muted-foreground">Exchange Rate</span>
                  <span className="font-mono font-semibold text-sm">
                    {formatNum(exchangeRate)}
                  </span>
                </div>

                {/* Row: Subtotal */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <span className="text-xs font-medium text-muted-foreground">Subtotal</span>
                  <div className="flex items-center gap-1.5">
                    {quotedCustomerPaysAsset && <CurrencyIcon code={quotedCustomerPaysAsset} />}
                    <span className="font-mono font-semibold text-sm">
                      {formatNum(subtotal)} {quotedCustomerPaysAsset}
                    </span>
                  </div>
                </div>

                {/* Row: Platform Fee — editable percentage on click */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border last:border-b-0">
                  <span className="text-xs font-medium text-muted-foreground">Platform Fee</span>
                  {editingFee ? (
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        value={feeOverride}
                        onChange={(e) => setFeeOverride(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && setEditingFee(false)}
                        className="w-20 h-8 text-right font-mono text-sm bg-background"
                        autoFocus
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                      <Button size="sm" variant="ghost" onClick={() => setEditingFee(false)} className="h-7 w-7 p-0">
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingFee(true); setFeeOverride(feeOverride || String(effectiveFeePercent)); }} className="group flex items-center gap-1.5 cursor-pointer">
                      <span className="text-primary font-semibold text-sm">{formatNum(effectiveFeePercent)}%</span>
                      <span className="text-muted-foreground text-xs">→</span>
                      <span className="font-mono font-semibold text-sm">
                        {formatNum(effectiveFeeAmount)} {quotedCustomerPaysAsset}
                      </span>
                      <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  )}
                </div>

                {/* Row: Gas Fee (only when buying fiat) */}
                {isBuyingFiat && (
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border last:border-b-0">
                    <span className="text-xs font-medium text-muted-foreground">Gas Fee (absorbed)</span>
                    <Input
                      type="number"
                      value={gasFee}
                      onChange={(e) => setGasFee(e.target.value)}
                      className="w-28 h-8 text-right font-mono text-sm bg-background"
                      placeholder="0.00"
                    />
                  </div>
                )}

                {/* Row: Adjustment (only if total overridden) */}
                {hasAdjustment && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className={`text-xs font-medium ${adjustment > 0 ? "text-accent" : "text-destructive"}`}>
                      Adjustment
                    </span>
                    <span className={`font-mono font-semibold text-sm ${adjustment > 0 ? "text-accent" : "text-destructive"}`}>
                      {adjustment > 0 ? "+" : ""}{formatNum(adjustment)} {quotedCustomerPaysAsset}
                    </span>
                  </div>
                )}
              </div>

              {/* Total Customer Pays — compact box, editable */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-4 mb-4">
                {editingTotal ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold whitespace-nowrap">Total Customer Pays</span>
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        value={totalOverride}
                        onChange={(e) => setTotalOverride(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleTotalConfirm()}
                        className="w-40 h-9 text-right font-mono text-base font-bold bg-background"
                        autoFocus
                      />
                      <span className="text-xs font-semibold text-muted-foreground">{quotedCustomerPaysAsset}</span>
                      <Button size="sm" variant="ghost" onClick={handleTotalConfirm} className="h-8 w-8 p-0">
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button onClick={handleTotalEdit} className="w-full group cursor-pointer text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">Total Customer Pays</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xl tracking-tight">
                          {formatNum(effectiveTotal)}
                        </span>
                        <span className="text-xs font-semibold text-muted-foreground">{quotedCustomerPaysAsset}</span>
                        <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </button>
                )}
              </div>

              {isBuyingFiat && gasFeeNum > 0 && (
                <div className="flex justify-between text-xs text-destructive mb-4 px-1">
                  <span>Gas fee loss (our cost)</span>
                  <span className="font-mono font-semibold">{formatNum(gasFeeNum)} {quotedCustomerPaysAsset}</span>
                </div>
              )}

              <div className="mb-4">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">
                  Customer
                </label>
                <Popover open={customerPickerOpen} onOpenChange={setCustomerPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={customerPickerOpen}
                      className="w-full justify-between h-11"
                      disabled={loadingCustomers}
                    >
                      {selectedCustomer ? selectedCustomer.name : (loadingCustomers ? "Loading customers..." : "Search customer by name")}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                      <CommandInput placeholder="Type customer name..." />
                      <CommandList>
                        <CommandEmpty>No customer found.</CommandEmpty>
                        <CommandGroup>
                          {customers.map((customer) => (
                            <CommandItem
                              key={customer.id}
                              value={customer.name}
                              onSelect={() => {
                                setCustomerId(customer.id);
                                setCustomerPickerOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  customerId === customer.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {customer.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {quote && !quote.hasSufficientInventory && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2.5 text-sm text-destructive mb-4">
                  Insufficient inventory for this quote.
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleDiscard}
                  size="lg"
                  className="flex-1 h-12 text-base font-bold"
                >
                  <X className="h-4 w-4 mr-2" />
                  Discard
                </Button>
                <Button
                  onClick={() => void handleSave()}
                  size="lg"
                  className="flex-1 h-12 text-base font-bold"
                  disabled={savingExchange || !customerId}
                >
                  <Check className="h-4 w-4 mr-2" />
                  {savingExchange ? "Saving..." : "Save Exchange"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Receipt Preview Dialog */}
      <Dialog open={showReceipt} onOpenChange={(open) => { if (!open) { setShowReceipt(false); setReceiptImage(null); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Exchange Receipt</DialogTitle>
          </DialogHeader>

          {/* Source for screenshot — hidden once image is generated */}
          <div ref={receiptRef} className={`bg-[#0d1117] text-white p-6 rounded-xl ${receiptImage ? "hidden" : ""}`} style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
            <div className="text-center mb-5">
              <div className="flex items-center justify-center gap-2 mb-2">
                <ArrowLeftRight className="h-5 w-5 text-[#3b82f6]" />
                <span className="text-lg font-bold">CryptoXchange</span>
              </div>
              <p className="text-xs text-gray-400">Exchange Receipt</p>
              <p className="text-xs text-gray-500 mt-1">{new Date().toLocaleString()}</p>
            </div>

            <div className="border border-gray-700 rounded-lg overflow-hidden mb-4">
              <div className="flex justify-between px-4 py-2.5 border-b border-gray-700">
                <span className="text-xs text-gray-400">{mode === "wants" ? "Customer Wants To Buy" : "Customer Has"}</span>
                <span className="text-sm font-mono font-semibold">{formatNum(primaryAmount)} {primaryAsset}</span>
              </div>
              <div className="flex justify-between px-4 py-2.5 border-b border-gray-700">
                <span className="text-xs text-gray-400">Exchange Rate</span>
                <span className="text-sm font-mono font-semibold">{formatNum(exchangeRate)}</span>
              </div>
              <div className="flex justify-between px-4 py-2.5 border-b border-gray-700">
                <span className="text-xs text-gray-400">Subtotal</span>
                <span className="text-sm font-mono font-semibold">{formatNum(subtotal)} {quotedCustomerPaysAsset}</span>
              </div>
              <div className="flex justify-between px-4 py-2.5 border-b border-gray-700">
                <span className="text-xs text-gray-400">Fee ({feePercent}%)</span>
                <span className="text-sm font-mono font-semibold">{formatNum(feeAmount)} {quotedCustomerPaysAsset}</span>
              </div>
              {hasAdjustment && (
                <div className="flex justify-between px-4 py-2.5 border-b border-gray-700">
                  <span className="text-xs text-gray-400">Adjustment</span>
                  <span className="text-sm font-mono font-semibold">{adjustment > 0 ? "+" : ""}{formatNum(adjustment)} {quotedCustomerPaysAsset}</span>
                </div>
              )}
            </div>

            <div className="bg-[#161b22] border border-[#3b82f6]/30 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Total Customer Pays</p>
              <p className="text-2xl font-mono font-bold">{formatNum(effectiveTotal)}</p>
              <p className="text-sm font-bold text-gray-400">{quotedCustomerPaysAsset}</p>
            </div>
          </div>

          {/* Generated image preview */}
          {receiptImage && (
            <div className="rounded-lg overflow-hidden border border-border">
              <img src={receiptImage} alt="Receipt preview" className="w-full" />
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={handleDownloadReceipt} disabled={!receiptImage} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" onClick={handleShareReceipt} disabled={!receiptImage} className="flex-1">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button onClick={handleConfirmAndClose} className="flex-1">
              <Check className="h-4 w-4 mr-2" />
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Exchange;
