import { useState } from "react";
import { ArrowLeftRight, ArrowRight, Check, X } from "lucide-react";
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
  { code: "USDT-TRC20", name: "Tether TRC20", type: "crypto", symbol: "₮" },
  { code: "USDT-ERC20", name: "Tether ERC20", type: "crypto", symbol: "₮" },
  { code: "BTC", name: "Bitcoin", type: "crypto", symbol: "₿" },
  { code: "ETH", name: "Ethereum", type: "crypto", symbol: "Ξ" },
  { code: "BNB", name: "BNB", type: "crypto", symbol: "⬡" },
  { code: "SOL", name: "Solana", type: "crypto", symbol: "◎" },
  { code: "XRP", name: "Ripple", type: "crypto", symbol: "✕" },
  { code: "ADA", name: "Cardano", type: "crypto", symbol: "₳" },
  { code: "USD", name: "US Dollar", type: "fiat", symbol: "$" },
  { code: "EUR", name: "Euro", type: "fiat", symbol: "€" },
  { code: "GBP", name: "British Pound", type: "fiat", symbol: "£" },
  { code: "ARS", name: "Argentine Peso", type: "fiat", symbol: "$" },
  { code: "BRL", name: "Brazilian Real", type: "fiat", symbol: "R$" },
];

const rates: Record<string, number> = {
  "USDT-TRC20": 1, "USDT-ERC20": 1,
  BTC: 67500, ETH: 3450, BNB: 580, SOL: 145, XRP: 0.62, ADA: 0.45,
  USD: 1, EUR: 1.08, GBP: 1.27, ARS: 0.0012, BRL: 0.20,
};

const FEE_OPTIONS = [0.5, 1, 1.5, 2, 2.5, 3, 5];

const Exchange = () => {
  // Step 1
  const [amount, setAmount] = useState("");
  const [buyCurrency, setBuyCurrency] = useState("");
  const [payCurrency, setPayCurrency] = useState("");

  // Step 2
  const [step, setStep] = useState<1 | 2>(1);
  const [feePercent, setFeePercent] = useState(2);
  const [gasFee, setGasFee] = useState("");

  const buyCurrencyData = currencies.find((c) => c.code === buyCurrency);
  const payCurrencyData = currencies.find((c) => c.code === payCurrency);
  const isBuyingFiat = buyCurrencyData?.type === "fiat";

  // Conversion math
  const amountNum = parseFloat(amount) || 0;
  const buyRateUsd = rates[buyCurrency] || 1;
  const payRateUsd = rates[payCurrency] || 1;
  // Cost in payment currency (before fee)
  const baseCost = (amountNum * buyRateUsd) / payRateUsd;
  const feeAmount = baseCost * (feePercent / 100);
  const gasFeeNum = parseFloat(gasFee) || 0;
  const totalCost = baseCost + feeAmount;

  const canProceed = !!amount && amountNum > 0 && !!buyCurrency && !!payCurrency && buyCurrency !== payCurrency;

  const handleNext = () => {
    if (!canProceed) return;
    setStep(2);
  };

  const handleDiscard = () => {
    setStep(1);
    setAmount("");
    setBuyCurrency("");
    setPayCurrency("");
    setGasFee("");
    setFeePercent(2);
  };

  const handleSave = () => {
    toast.success("Exchange recorded successfully", {
      description: `${amountNum.toLocaleString()} ${buyCurrency} → ${totalCost.toFixed(2)} ${payCurrency}`,
    });
    handleDiscard();
  };

  const formatNum = (n: number, decimals = 2) =>
    n < 0.01 && n > 0 ? n.toFixed(8) : n.toLocaleString(undefined, { maximumFractionDigits: decimals });

  return (
    <div>
      {/* Hero */}
      <div className="bg-nav text-nav-foreground -mx-4 sm:-mx-6 lg:-mx-8 -mt-8 px-4 sm:px-6 lg:px-8 pt-12 pb-36 mb-[-7rem]">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/20 mb-4">
            <ArrowLeftRight className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">Exchange Recorder</h1>
          <p className="text-nav-foreground/50 text-sm">Record customer currency exchanges</p>
        </div>
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
              {/* Customer wants to buy */}
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

              {/* Divider */}
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-border" />
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  <ArrowRight className="h-3.5 w-3.5" />
                  PAYING WITH
                </div>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Payment currency */}
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
              {/* Recap */}
              <div className="p-4 bg-muted rounded-xl border border-border mb-6">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-2">Customer wants to buy</p>
                <p className="text-xl font-bold font-mono">
                  {buyCurrencyData?.symbol}{formatNum(amountNum)} <span className="text-sm text-muted-foreground font-sans">{buyCurrency}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Paying with <span className="font-semibold text-foreground">{payCurrency}</span>
                </p>
              </div>

              {/* Fee selector */}
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Platform fee
              </label>
              <div className="flex flex-wrap gap-2 mt-2 mb-4">
                {FEE_OPTIONS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFeePercent(f)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      feePercent === f
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                    }`}
                  >
                    {f}%
                  </button>
                ))}
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

                <div className="flex justify-between text-base pt-3 border-t border-border">
                  <span className="font-semibold">Total customer pays</span>
                  <span className="font-mono font-bold text-primary text-lg">
                    {payCurrencyData?.symbol}{formatNum(totalCost)} {payCurrency}
                  </span>
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
