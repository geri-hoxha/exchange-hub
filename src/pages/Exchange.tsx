import { useState, useEffect, useRef, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import { ArrowLeftRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { toPng } from "html-to-image";
import api from "@/lib/axios";
import { getApiErrorMessage } from "@/lib/apiError";
import { getAllAssets } from "@/services/assetsService";
import ExchangeStepOne from "./exchange/ExchangeStepOne";
import ExchangeStepTwo from "./exchange/ExchangeStepTwo";
import ExchangeSaveConfirmDialog from "./exchange/ExchangeSaveConfirmDialog";
import ExchangeReceiptDialog from "./exchange/ExchangeReceiptDialog";
import type {
  ExchangeAsset,
  ExchangeCustomer,
  ExchangeMode,
  ExchangeQuoteRequest,
  ExchangeQuoteResponse,
  ExchangeStepOneFormValues,
  SaveConfirmFormValues,
} from "./exchange/types";

const Exchange = () => {
  // Step 1
  const { control: stepOneControl, setValue: setStepOneValue, reset: resetStepOne } = useForm<ExchangeStepOneFormValues>({
    defaultValues: {
      mode: "wants",
      amount: "",
      buyCurrency: "",
      payCurrency: "",
    },
  });
  const mode = useWatch({ control: stepOneControl, name: "mode" }) ?? "wants";
  const amount = useWatch({ control: stepOneControl, name: "amount" }) ?? "";
  const buyCurrency = useWatch({ control: stepOneControl, name: "buyCurrency" }) ?? "";
  const payCurrency = useWatch({ control: stepOneControl, name: "payCurrency" }) ?? "";
  const previousModeRef = useRef<ExchangeMode>("wants");

  // Step 2
  const [step, setStep] = useState<1 | 2>(1);
  const [quote, setQuote] = useState<ExchangeQuoteResponse | null>(null);
  const [fetchingQuote, setFetchingQuote] = useState(false);
  const [savingExchange, setSavingExchange] = useState(false);
  const [customers, setCustomers] = useState<ExchangeCustomer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [saveConfirmInitialValues, setSaveConfirmInitialValues] = useState<SaveConfirmFormValues>({
    customerId: "",
    finalAmount: "",
    occurredAt: "",
    referenceNo: "",
    note: "",
    actualReceivedAmount: "",
    actualPaidAmount: "",
  });

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
    void api.post("/api/assets/rates/refresh")
      .finally(() => {
      setLastUpdated(new Date());
      setRefreshing(false);
      setTotalOverride("");
      toast.success("Rates refreshed");
    });
  };

  // currencies
  const [currencies, setCurrencies] = useState<ExchangeAsset[]>([]);

  useEffect(() => {
    getCurrencies()
  }, []);

  const getCurrencies = async () => {
    const response = await getAllAssets();
    setCurrencies(response as ExchangeAsset[]);
  };

  const getCustomers = useCallback(async (query: string) => {
    try {
      setLoadingCustomers(true);
      const response = await api.get<{ items?: ExchangeCustomer[] } | ExchangeCustomer[]>("/api/customers", {
        params: query.trim() ? { search: query.trim() } : undefined,
      });
      const items = Array.isArray(response.data) ? response.data : (response.data.items ?? []);
      setCustomers(items.map((customer) => ({ id: customer.id, name: customer.name })));
    } catch {
      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  }, []);


  const buyCurrencyData = currencies.find((c) => c.code === buyCurrency);
  const payCurrencyData = currencies.find((c) => c.code === payCurrency);
  const amountNum = parseFloat(amount) || 0;

  const quotedCustomerPaysAmount = quote?.customerPaysAmount ?? 0;
  const quotedCustomerReceivesAmount = quote?.customerReceivesAmount ?? 0;
  const quotedCustomerPaysAsset = quote?.customerPaysAsset ?? payCurrency;
  const quotedCustomerReceivesAsset = quote?.customerReceivesAsset ?? buyCurrency;
  const quotedCustomerPaysAssetType = currencies.find((c) => c.code === quotedCustomerPaysAsset)?.type;
  const quotedCustomerReceivesAssetType = currencies.find((c) => c.code === quotedCustomerReceivesAsset)?.type;

  const exchangeRate = quote?.agreedRate ?? 0;
  const feePercent = quote?.platformFeeRate ?? 0;
  const feeAmount = quote?.platformFeeAmount ?? 0;
  const effectiveFeePercent = feeOverride !== "" ? (parseFloat(feeOverride) || 0) : feePercent;
  const subtotalBase =
    mode === "wants"
      ? Math.max(quotedCustomerPaysAmount - feeAmount, 0)
      : quotedCustomerReceivesAmount + feeAmount;
  const effectiveFeeAmount = feeOverride !== "" ? (subtotalBase * effectiveFeePercent / 100) : feeAmount;
  const subtotal = subtotalBase;
  const computedDisplayTotal =
    mode === "wants"
      ? subtotal + effectiveFeeAmount
      : Math.max(subtotal - effectiveFeeAmount, 0);
  const totalDisplayAsset = mode === "wants" ? quotedCustomerPaysAsset : quotedCustomerReceivesAsset;

  const primaryAsset = mode === "wants" ? quotedCustomerReceivesAsset : quotedCustomerPaysAsset;
  const primaryAmount = mode === "wants" ? quotedCustomerReceivesAmount : quotedCustomerPaysAmount;

  // Effective total (might be overridden)
  const effectiveTotal = totalOverride !== "" ? (parseFloat(totalOverride) || 0) : computedDisplayTotal;
  const adjustment = effectiveTotal - computedDisplayTotal;
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
      setStepOneValue("buyCurrency", payCurrency);
      setStepOneValue("payCurrency", buyCurrency);
      previousModeRef.current = mode;
    }
  }, [mode, buyCurrency, payCurrency, setStepOneValue]);

  // Keep second selection valid: it must be the opposite type of the first one.
  useEffect(() => {
    if (!buyCurrencyData || !payCurrencyData) return;
    if (buyCurrencyData.type === payCurrencyData.type) {
      setStepOneValue("payCurrency", "");
    }
  }, [buyCurrency, payCurrency, buyCurrencyData, payCurrencyData, setStepOneValue]);

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
    resetStepOne({
      mode: "wants",
      amount: "",
      buyCurrency: "",
      payCurrency: "",
    });
    previousModeRef.current = "wants";
    setQuote(null);
    setTotalOverride("");
    setFeeOverride("");
    setEditingTotal(false);
    setEditingFee(false);
    setShowSaveConfirm(false);
  };

  const toDateTimeLocalValue = (date: Date) => {
    const pad = (v: number) => String(v).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const openSaveConfirmation = () => {
    if (!quote?.id) return;
    setSaveConfirmInitialValues({
      customerId: "",
      finalAmount: String(effectiveTotal),
      occurredAt: toDateTimeLocalValue(new Date()),
      referenceNo: "",
      note: "",
      actualReceivedAmount: "0",
      actualPaidAmount: "0",
    });
    setShowSaveConfirm(true);
  };

  const handleSave = async (values: SaveConfirmFormValues) => {
    if (!quote?.id) return;
    if (!values.customerId) {
      toast.error("Customer is required", {
        description: "Please select a customer before saving this exchange.",
      });
      return;
    }

    try {
      setSavingExchange(true);
      const occurredAtUtc = values.occurredAt
        ? new Date(values.occurredAt).toISOString()
        : new Date().toISOString();

      await api.post<{ id?: string }>(
        `/api/exchange-slips/from-quote`,
        {
          quoteId: quote.id,
          customerId: Number(values.customerId),
          finalAmount: parseFloat(values.finalAmount) || 0,
          occurredAtUtc,
          referenceNo: values.referenceNo,
          note: values.note,
          actualReceivedAmount: parseFloat(values.actualReceivedAmount) || 0,
          actualPaidAmount: parseFloat(values.actualPaidAmount) || 0,
        }
      );
      setShowSaveConfirm(false);
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
      description: `${formatNum(primaryAmount)} ${primaryAsset} → ${formatNum(effectiveTotal)} ${totalDisplayAsset}`,
    });
    setShowReceipt(false);
    setReceiptImage(null);
    handleDiscard();
  };

  const handleTotalEdit = () => {
    setEditingTotal(true);
    setTotalOverride(totalOverride || String(computedDisplayTotal));
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

  return (
    <div>
      {/* Hero */}
      <div className="dark:text-nav-foreground bg-transparent text-foreground -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-6 sm:pb-8 mb-2 dark:-mt-8 dark:pt-8 sm:dark:pt-12 dark:pb-28 sm:dark:pb-36 dark:mb-[-5rem] sm:dark:mb-[-7rem]">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center h-10 w-10 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-primary/20 mb-3 sm:mb-4">
            <ArrowLeftRight className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <h1 className="text-xl sm:text-3xl font-bold mb-1 sm:mb-2 tracking-tight">Exchange Recorder</h1>
          <p className="text-muted-foreground dark:text-nav-foreground/50 text-xs sm:text-sm">Record customer currency exchanges</p>
        </div>
      </div>

      {/* Refresh bar */}
      <div className="max-w-2xl mx-auto flex items-center justify-between mb-3 sm:mb-4">
        <p className="text-[10px] sm:text-xs text-muted-foreground">
          Rates: <span className="font-mono">{lastUpdated.toLocaleTimeString()}</span>
        </p>
        <Button
          size="sm"
          onClick={handleRefreshRates}
          disabled={refreshing}
          className="text-[10px] sm:text-xs gap-1 sm:gap-1.5 h-7 sm:h-8 px-2 sm:px-3 bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <RefreshCw className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Card */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-card rounded-xl sm:rounded-2xl shadow-xl border border-border p-4 sm:p-6 md:p-8">
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
            <ExchangeStepOne
              control={stepOneControl}
              mode={mode}
              currencies={currencies}
              payCurrencyTypeFilter={payCurrencyTypeFilter}
              payCurrencyOptions={payCurrencyOptions}
              canProceed={canProceed}
              fetchingQuote={fetchingQuote}
              onNext={() => void handleNext()}
            />
          )}

          {step === 2 && (
            <ExchangeStepTwo
              mode={mode}
              primaryAsset={primaryAsset}
              primaryAmount={primaryAmount}
              exchangeRate={exchangeRate}
              formatNum={formatNum}
              quoteSummaryAsset={totalDisplayAsset}
              subtotal={subtotal}
              editingFee={editingFee}
              feeOverride={feeOverride}
              onFeeOverrideChange={setFeeOverride}
              onFeeEditingChange={setEditingFee}
              effectiveFeePercent={effectiveFeePercent}
              effectiveFeeAmount={effectiveFeeAmount}
              hasAdjustment={hasAdjustment}
              adjustment={adjustment}
              editingTotal={editingTotal}
              totalOverride={totalOverride}
              onTotalOverrideChange={setTotalOverride}
              onTotalConfirm={handleTotalConfirm}
              onTotalEdit={handleTotalEdit}
              effectiveTotal={effectiveTotal}
              totalDisplayAsset={totalDisplayAsset}
              quoteHasSufficientInventory={quote?.hasSufficientInventory}
              onDiscard={handleDiscard}
              onSaveExchange={openSaveConfirmation}
              savingExchange={savingExchange}
              canSave={!!quote?.id}
            />
          )}
        </div>
      </div>

      <ExchangeSaveConfirmDialog
        open={showSaveConfirm}
        onOpenChange={setShowSaveConfirm}
        quoteId={quote?.id ?? ""}
        actualReceivedAssetLabel={`${quotedCustomerReceivesAsset}${quotedCustomerReceivesAssetType ? ` • ${quotedCustomerReceivesAssetType}` : ""}`}
        actualPaidAssetLabel={`${quotedCustomerPaysAsset}${quotedCustomerPaysAssetType ? ` • ${quotedCustomerPaysAssetType}` : ""}`}
        loadingCustomers={loadingCustomers}
        customers={customers}
        onSearchCustomers={getCustomers}
        savingExchange={savingExchange}
        initialValues={saveConfirmInitialValues}
        onSubmit={handleSave}
      />

      <ExchangeReceiptDialog
        open={showReceipt}
        onOpenChange={(open) => {
          if (!open) {
            setShowReceipt(false);
            setReceiptImage(null);
          }
        }}
        receiptRef={receiptRef}
        receiptImage={receiptImage}
        mode={mode}
        primaryAmount={primaryAmount}
        primaryAsset={primaryAsset}
        exchangeRate={exchangeRate}
        subtotal={subtotal}
        quoteSummaryAsset={totalDisplayAsset}
        feePercent={feePercent}
        feeAmount={feeAmount}
        effectiveTotal={effectiveTotal}
        totalDisplayAsset={totalDisplayAsset}
        formatNum={formatNum}
        onDownload={handleDownloadReceipt}
        onShare={handleShareReceipt}
        onConfirm={handleConfirmAndClose}
      />
    </div>
  );
};

export default Exchange;
