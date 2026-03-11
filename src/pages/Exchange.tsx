import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const currencies = [
  { code: "BTC", name: "Bitcoin", type: "crypto" },
  { code: "ETH", name: "Ethereum", type: "crypto" },
  { code: "USDT", name: "Tether", type: "crypto" },
  { code: "BNB", name: "BNB", type: "crypto" },
  { code: "SOL", name: "Solana", type: "crypto" },
  { code: "XRP", name: "Ripple", type: "crypto" },
  { code: "ADA", name: "Cardano", type: "crypto" },
  { code: "USD", name: "US Dollar", type: "fiat" },
  { code: "EUR", name: "Euro", type: "fiat" },
  { code: "GBP", name: "British Pound", type: "fiat" },
  { code: "JPY", name: "Japanese Yen", type: "fiat" },
  { code: "ARS", name: "Argentine Peso", type: "fiat" },
  { code: "BRL", name: "Brazilian Real", type: "fiat" },
];

// Mock exchange rates (relative to USD)
const rates: Record<string, number> = {
  BTC: 67500, ETH: 3450, USDT: 1, BNB: 580, SOL: 145, XRP: 0.62, ADA: 0.45,
  USD: 1, EUR: 1.08, GBP: 1.27, JPY: 0.0067, ARS: 0.0012, BRL: 0.20,
};

const Exchange = () => {
  const [amount, setAmount] = useState("1000");
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("BTC");
  const [result, setResult] = useState<number | null>(null);

  const handleConvert = () => {
    const fromRate = rates[fromCurrency] || 1;
    const toRate = rates[toCurrency] || 1;
    const usdAmount = parseFloat(amount) * fromRate;
    setResult(usdAmount / toRate);
  };

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setResult(null);
  };

  const fromCurrencyData = currencies.find((c) => c.code === fromCurrency);
  const toCurrencyData = currencies.find((c) => c.code === toCurrency);

  return (
    <div>
      {/* Hero section */}
      <div className="bg-nav text-nav-foreground -mx-4 sm:-mx-6 lg:-mx-8 -mt-8 px-4 sm:px-6 lg:px-8 pt-12 pb-32 mb-[-6rem]">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            Crypto & Fiat Currency Exchange
          </h1>
          <p className="text-nav-foreground/60 text-lg">
            Convert between cryptocurrencies and fiat currencies instantly
          </p>
        </div>
      </div>

      {/* Converter card */}
      <div className="max-w-3xl mx-auto">
        <div className="bg-card rounded-2xl shadow-lg border border-border p-6 sm:p-8">
          {/* Tabs */}
          <div className="flex gap-1 mb-8 bg-muted rounded-lg p-1">
            <button className="flex-1 py-2.5 px-4 rounded-md bg-nav text-nav-foreground text-sm font-medium flex items-center justify-center gap-2">
              <ArrowLeftRight className="h-4 w-4" /> Convert
            </button>
          </div>

          {/* Amount input */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr,1fr,auto,1fr] gap-4 items-end">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Amount</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setResult(null); }}
                className="text-xl font-semibold h-14 bg-background"
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">From</label>
              <Select value={fromCurrency} onValueChange={(v) => { setFromCurrency(v); setResult(null); }}>
                <SelectTrigger className="h-14 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Crypto</div>
                  {currencies.filter(c => c.type === "crypto").map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.code} - {c.name}</SelectItem>
                  ))}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-1">Fiat</div>
                  {currencies.filter(c => c.type === "fiat").map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.code} - {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <button
              onClick={handleSwap}
              className="h-14 w-14 rounded-full border-2 border-border bg-background flex items-center justify-center hover:bg-muted transition-colors self-end"
            >
              <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
            </button>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">To</label>
              <Select value={toCurrency} onValueChange={(v) => { setToCurrency(v); setResult(null); }}>
                <SelectTrigger className="h-14 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Crypto</div>
                  {currencies.filter(c => c.type === "crypto").map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.code} - {c.name}</SelectItem>
                  ))}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-1">Fiat</div>
                  {currencies.filter(c => c.type === "fiat").map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.code} - {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Result */}
          {result !== null && (
            <div className="mt-6 p-4 bg-muted rounded-xl">
              <p className="text-sm text-muted-foreground">
                {parseFloat(amount).toLocaleString()} {fromCurrencyData?.name} =
              </p>
              <p className="text-3xl font-bold text-foreground mt-1">
                {result < 0.01 ? result.toFixed(8) : result.toLocaleString(undefined, { maximumFractionDigits: 6 })} {toCurrency}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                1 {fromCurrency} = {((rates[fromCurrency] || 1) / (rates[toCurrency] || 1)).toFixed(6)} {toCurrency}
              </p>
            </div>
          )}

          <div className="flex justify-end mt-6">
            <Button onClick={handleConvert} size="lg" className="px-10 h-12 text-base font-semibold">
              Convert
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Exchange;
