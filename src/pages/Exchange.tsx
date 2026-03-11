import { useState, useEffect } from "react";
import { ArrowLeftRight, ArrowRight, Check, X, Pencil, Bitcoin, DollarSign, Euro, PoundSterling, JapaneseYen, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const currencies = [
  { code: "USDT-TRC20", name: "Tether TRC20", type: "crypto", symbol: "₮", icon: "usdt" },
  { code: "USDT-ERC20", name: "Tether ERC20", type: "crypto", symbol: "₮", icon: "usdt" },
  { code: "BTC", name: "Bitcoin", type: "crypto", symbol: "₿", icon: "btc" },
  { code: "ETH", name: "Ethereum", type: "crypto", symbol: "Ξ", icon: "eth" },
  { code: "BNB", name: "BNB", type: "crypto", symbol: "⬡", icon: "bnb" },
  { code: "SOL", name: "Solana", type: "crypto", symbol: "◎", icon: "sol" },
  { code: "XRP", name: "Ripple", type: "crypto", symbol: "✕", icon: "xrp" },
  { code: "ADA", name: "Cardano", type: "crypto", symbol: "₳", icon: "ada" },
  { code: "USD", name: "US Dollar", type: "fiat", symbol: "$", icon: "usd" },
  { code: "EUR", name: "Euro", type: "fiat", symbol: "€", icon: "eur" },
  { code: "GBP", name: "British Pound", type: "fiat", symbol: "£", icon: "gbp" },
  { code: "ARS", name: "Argentine Peso", type: "fiat", symbol: "$", icon: "ars" },
  { code: "BRL", name: "Brazilian Real", type: "fiat", symbol: "R$", icon: "brl" },
];

const rates: Record<string, number> = {
  "USDT-TRC20": 1, "USDT-ERC20": 1,
  BTC: 67500, ETH: 3450, BNB: 580, SOL: 145, XRP: 0.62, ADA: 0.45,
  USD: 1, EUR: 1.08, GBP: 1.27, ARS: 0.0012, BRL: 0.20,
};

const FEE_OPTIONS = [0.5, 1, 1.5, 2, 2.5, 3, 5];

// Color map for currency icons
const iconColors: Record<string, string> = {
  btc: "text-orange-500 bg-orange-500/15",
  eth: "text-indigo-400 bg-indigo-400/15",
  usdt: "text-emerald-500 bg-emerald-500/15",
  bnb: "text-yellow-500 bg-yellow-500/15",
  sol: "text-purple-400 bg-purple-400/15",
  xrp: "text-blue-400 bg-blue-400/15",
  ada: "text-sky-400 bg-sky-400/15",
  usd: "text-green-500 bg-green-500/15",
  eur: "text-blue-500 bg-blue-500/15",
  gbp: "text-violet-500 bg-violet-500/15",
  ars: "text-cyan-500 bg-cyan-500/15",
  brl: "text-lime-500 bg-lime-500/15",
};

const CurrencyIcon = ({ icon, size = "md" }: { icon: string; size?: "sm" | "md" }) => {
  const sizeClass = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const colors = iconColors[icon] || "text-muted-foreground bg-muted";

  const IconComponent = () => {
    switch (icon) {
      case "btc": return <Bitcoin className={iconSize} />;
      case "eth": return <Coins className={iconSize} />;
      case "usd": return <DollarSign className={iconSize} />;
      case "eur": return <Euro className={iconSize} />;
      case "gbp": return <PoundSterling className={iconSize} />;
      case "ars": return <DollarSign className={iconSize} />;
      case "brl": return <DollarSign className={iconSize} />;
      default: return <Coins className={iconSize} />;
    }
  };

  return (
    <div className={`${sizeClass} rounded-full flex items-center justify-center ${colors} shrink-0`}>
      <IconComponent />
    </div>
  );
};

const Exchange = () => {
  // Step 1
  const [amount, setAmount] = useState("");
  const [buyCurrency, setBuyCurrency] = useState("");
  const [payCurrency, setPayCurrency] = useState("");

  // Step 2
  const [step, setStep] = useState<1 | 2>(1);
  const [feePercent, setFeePercent] = useState(2);
  const [editingFee, setEditingFee] = useState(false);
  const [feeInput, setFeeInput] = useState("2");
  const [gasFee, setGasFee] = useState("");

  // Editable total
  const [editingTotal, setEditingTotal] = useState(false);
  const [totalOverride, setTotalOverride] = useState<string>("");

  const buyCurrencyData = currencies.find((c) => c.code === buyCurrency);
  const payCurrencyData = currencies.find((c) => c.code === payCurrency);
  const isBuyingFiat = buyCurrencyData?.type === "fiat";

  // Conversion math
  const amountNum = parseFloat(amount) || 0;
  const buyRateUsd = rates[buyCurrency] || 1;
  const payRateUsd = rates[payCurrency] || 1;
  const baseCost = (amountNum * buyRateUsd) / payRateUsd;
  const feeAmount = baseCost * (feePercent / 100);
  const gasFeeNum = parseFloat(gasFee) || 0;
  const computedTotal = baseCost + feeAmount;

  // Effective total (might be overridden)
  const effectiveTotal = totalOverride !== "" ? (parseFloat(totalOverride) || 0) : computedTotal;
  const adjustment = effectiveTotal - computedTotal;
  const hasAdjustment = totalOverride !== "" && Math.abs(adjustment) > 0.001;

  const canProceed = !!amount && amountNum > 0 && !!buyCurrency && !!payCurrency && buyCurrency !== payCurrency;

  // Reset total override when fee changes
  useEffect(() => {
    setTotalOverride("");
  }, [feePercent]);

  const handleNext = () => {
    if (!canProceed) return;
    setStep(2);
    setTotalOverride("");
  };

  const handleDiscard = () => {
    setStep(1);
    setAmount("");
    setBuyCurrency("");
    setPayCurrency("");
    setGasFee("");
    setFeePercent(2);
    setFeeInput("2");
    setTotalOverride("");
    setEditingFee(false);
    setEditingTotal(false);
  };

  const handleSave = () => {
    toast.success("Exchange recorded successfully", {
      description: `${amountNum.toLocaleString()} ${buyCurrency} → ${effectiveTotal.toFixed(2)} ${payCurrency}`,
    });
    handleDiscard();
  };

  const handleFeeEdit = () => {
    setEditingFee(true);
    setFeeInput(String(feePercent));
  };

  const handleFeeConfirm = () => {
    const val = parseFloat(feeInput);
    if (!isNaN(val) && val >= 0 && val <= 100) {
      setFeePercent(val);
    }
    setEditingFee(false);
  };

  const handleTotalEdit = () => {
    setEditingTotal(true);
    setTotalOverride(totalOverride || String(computedTotal.toFixed(2)));
  };

  const handleTotalConfirm = () => {
    setEditingTotal(false);
  };

  const formatNum = (n: number, decimals = 2) =>
    n < 0.01 && n > 0 ? n.toFixed(8) : n.toLocaleString(undefined, { maximumFractionDigits: decimals });

  return (
    <div>
      {/* Hero */}
      <div className="dark:bg-nav dark:text-nav-foreground bg-transparent text-foreground -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-6 pb-8 mb-2 dark:-mt-8 dark:pt-12 dark:pb-36 dark:mb-[-7rem]">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/20 mb-4">
            <ArrowLeftRight className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">Exchange Recorder</h1>
          <p className="text-muted-foreground dark:text-nav-foreground/50 text-sm">Record customer currency exchanges</p>
        </div>
      </div>

      {/* Card */}
      <div className="max-w-2xl mx-auto">
        <div className="dark:bg-card dark:border-border dark:shadow-xl bg-transparent border-transparent shadow-none rounded-2xl border p-6 sm:p-8">
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
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Customer wants to buy
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
                    {currencies.filter(c => c.type === "crypto").map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        <span className="font-mono mr-1">{c.symbol}</span> {c.code}
                      </SelectItem>
                    ))}
                    <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Fiat</div>
                    {currencies.filter(c => c.type === "fiat").map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        <span className="font-mono mr-1">{c.symbol}</span> {c.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-border" />
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  <ArrowRight className="h-3.5 w-3.5" />
                  PAYING WITH
                </div>
                <div className="flex-1 h-px bg-border" />
              </div>

              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Payment currency
              </label>
              <div className="mt-2 mb-8">
                <Select value={payCurrency} onValueChange={setPayCurrency}>
                  <SelectTrigger className="h-12 bg-background font-medium">
                    <SelectValue placeholder="Select payment currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest">Crypto</div>
                    {currencies.filter(c => c.type === "crypto").map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        <span className="font-mono mr-1">{c.symbol}</span> {c.code}
                      </SelectItem>
                    ))}
                    <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Fiat</div>
                    {currencies.filter(c => c.type === "fiat").map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        <span className="font-mono mr-1">{c.symbol}</span> {c.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleNext}
                size="lg"
                className="w-full h-12 text-base font-bold"
                disabled={!canProceed}
              >
                Next
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              {/* Recap with icons */}
              <div className="p-4 bg-muted rounded-xl border border-border mb-6">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-3">Customer wants to buy</p>
                <div className="flex items-center gap-3">
                  {buyCurrencyData && <CurrencyIcon icon={buyCurrencyData.icon} />}
                  <div>
                    <p className="text-xl font-bold font-mono">
                      {buyCurrencyData?.symbol}{formatNum(amountNum)}
                      <span className="text-sm text-muted-foreground font-sans ml-2">{buyCurrency}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Paying with</span>
                  {payCurrencyData && <CurrencyIcon icon={payCurrencyData.icon} size="sm" />}
                  <span className="font-semibold text-sm">{payCurrency}</span>
                </div>
              </div>

              {/* Fee selector — presets + editable */}
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Platform fee
              </label>
              <div className="flex flex-wrap items-center gap-2 mt-2 mb-4">
                {FEE_OPTIONS.map((f) => (
                  <button
                    key={f}
                    onClick={() => { setFeePercent(f); setEditingFee(false); setFeeInput(String(f)); }}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      !editingFee && feePercent === f
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                    }`}
                  >
                    {f}%
                  </button>
                ))}
                {/* Custom fee */}
                {editingFee ? (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={feeInput}
                      onChange={(e) => setFeeInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleFeeConfirm()}
                      className="w-20 h-9 text-sm font-mono text-center bg-background"
                      autoFocus
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                    <Button size="sm" variant="ghost" onClick={handleFeeConfirm} className="h-8 w-8 p-0">
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={handleFeeEdit}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                      !FEE_OPTIONS.includes(feePercent)
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                    }`}
                  >
                    <Pencil className="h-3 w-3" />
                    {!FEE_OPTIONS.includes(feePercent) ? `${feePercent}%` : "Custom"}
                  </button>
                )}
              </div>

              {/* Breakdown */}
              <div className="space-y-3 py-4 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Base cost</span>
                  <span className="font-mono font-semibold">{payCurrencyData?.symbol}{formatNum(baseCost)} {payCurrency}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Platform fee ({feePercent}%)</span>
                  <span className="font-mono font-semibold">{payCurrencyData?.symbol}{formatNum(feeAmount)} {payCurrency}</span>
                </div>

                {isBuyingFiat && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Gas fee (absorbed)</span>
                    <Input
                      type="number"
                      value={gasFee}
                      onChange={(e) => setGasFee(e.target.value)}
                      className="w-32 h-8 text-right font-mono text-sm bg-background"
                      placeholder="0.00"
                    />
                  </div>
                )}

                {hasAdjustment && (
                  <div className="flex justify-between text-sm">
                    <span className={adjustment > 0 ? "text-accent" : "text-destructive"}>
                      Adjustment
                    </span>
                    <span className={`font-mono font-semibold ${adjustment > 0 ? "text-accent" : "text-destructive"}`}>
                      {adjustment > 0 ? "+" : ""}{payCurrencyData?.symbol}{formatNum(adjustment)} {payCurrency}
                    </span>
                  </div>
                )}

                {/* Total — editable on click */}
                <div className="flex justify-between items-center text-base pt-3 border-t border-border">
                  <span className="font-semibold">Total customer pays</span>
                  {editingTotal ? (
                    <div className="flex items-center gap-1">
                      <span className="text-primary font-mono font-bold">{payCurrencyData?.symbol}</span>
                      <Input
                        type="number"
                        value={totalOverride}
                        onChange={(e) => setTotalOverride(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleTotalConfirm()}
                        className="w-36 h-9 text-right font-mono text-base font-bold bg-background"
                        autoFocus
                      />
                      <span className="text-sm text-muted-foreground ml-1">{payCurrency}</span>
                      <Button size="sm" variant="ghost" onClick={handleTotalConfirm} className="h-8 w-8 p-0">
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={handleTotalEdit}
                      className="flex items-center gap-2 group cursor-pointer"
                    >
                      <span className="font-mono font-bold text-primary text-lg">
                        {payCurrencyData?.symbol}{formatNum(effectiveTotal)} {payCurrency}
                      </span>
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  )}
                </div>

                {isBuyingFiat && gasFeeNum > 0 && (
                  <div className="flex justify-between text-xs text-destructive">
                    <span>Gas fee loss (our cost)</span>
                    <span className="font-mono font-semibold">{payCurrencyData?.symbol}{formatNum(gasFeeNum)} {payCurrency}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
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
                  onClick={handleSave}
                  size="lg"
                  className="flex-1 h-12 text-base font-bold"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Exchange;
