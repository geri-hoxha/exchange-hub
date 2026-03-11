import { useState } from "react";
import { ArrowLeftRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const currencies = [
  { code: "BTC", name: "Bitcoin", type: "crypto", symbol: "₿" },
  { code: "ETH", name: "Ethereum", type: "crypto", symbol: "Ξ" },
  { code: "USDT", name: "Tether", type: "crypto", symbol: "₮" },
  { code: "BNB", name: "BNB", type: "crypto", symbol: "⬡" },
  { code: "SOL", name: "Solana", type: "crypto", symbol: "◎" },
  { code: "XRP", name: "Ripple", type: "crypto", symbol: "✕" },
  { code: "ADA", name: "Cardano", type: "crypto", symbol: "₳" },
  { code: "USD", name: "US Dollar", type: "fiat", symbol: "$" },
  { code: "EUR", name: "Euro", type: "fiat", symbol: "€" },
  { code: "GBP", name: "British Pound", type: "fiat", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", type: "fiat", symbol: "¥" },
  { code: "ARS", name: "Argentine Peso", type: "fiat", symbol: "$" },
  { code: "BRL", name: "Brazilian Real", type: "fiat", symbol: "R$" },
];

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
      <div className="bg-nav text-nav-foreground -mx-4 sm:-mx-6 lg:-mx-8 -mt-8 px-4 sm:px-6 lg:px-8 pt-12 pb-36 mb-[-7rem]">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Badge variant="secondary" className="bg-nav-foreground/10 text-nav-foreground/80 border-none font-mono text-xs">
              <Zap className="h-3 w-3 mr-1" /> Instant Conversion
            </Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 tracking-tight">
            Crypto & Fiat Currency Exchange
          </h1>
          <p className="text-nav-foreground/50 text-base">
            Convert between cryptocurrencies and fiat currencies in real time
          </p>
        </div>
      </div>

      {/* Converter card */}
      <div className="max-w-3xl mx-auto">
        <div className="bg-card rounded-2xl shadow-xl border border-border p-6 sm:p-8 backdrop-blur-sm">
          {/* Tab bar */}
          <div className="flex gap-1 mb-8 bg-muted rounded-xl p-1">
            <button className="flex-1 py-2.5 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 shadow-md glow-primary transition-all">
              <ArrowLeftRight className="h-4 w-4" /> Convert
            </button>
          </div>

          {/* Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr,1fr,auto,1fr] gap-4 items-end">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-lg">
                  {fromCurrencyData?.symbol}
                </span>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); setResult(null); }}
                  className="text-xl font-bold h-14 bg-background pl-10 font-mono"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">From</label>
              <Select value={fromCurrency} onValueChange={(v) => { setFromCurrency(v); setResult(null); }}>
                <SelectTrigger className="h-14 bg-background font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest">Crypto</div>
                  {currencies.filter(c => c.type === "crypto").map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      <span className="font-mono mr-1">{c.symbol}</span> {c.code} - {c.name}
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Fiat</div>
                  {currencies.filter(c => c.type === "fiat").map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      <span className="font-mono mr-1">{c.symbol}</span> {c.code} - {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <button
              onClick={handleSwap}
              className="h-14 w-14 rounded-full border-2 border-border bg-card flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 self-end group"
            >
              <ArrowLeftRight className="h-5 w-5 text-muted-foreground group-hover:text-primary-foreground transition-colors" />
            </button>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">To</label>
              <Select value={toCurrency} onValueChange={(v) => { setToCurrency(v); setResult(null); }}>
                <SelectTrigger className="h-14 bg-background font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest">Crypto</div>
                  {currencies.filter(c => c.type === "crypto").map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      <span className="font-mono mr-1">{c.symbol}</span> {c.code} - {c.name}
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Fiat</div>
                  {currencies.filter(c => c.type === "fiat").map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      <span className="font-mono mr-1">{c.symbol}</span> {c.code} - {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Result */}
          {result !== null && (
            <div className="mt-6 p-5 bg-muted rounded-xl border border-border">
              <p className="text-sm text-muted-foreground">
                {fromCurrencyData?.symbol}{parseFloat(amount).toLocaleString()} {fromCurrencyData?.name} =
              </p>
              <p className="text-3xl font-bold text-foreground mt-1 font-mono">
                <span className="text-accent">{toCurrencyData?.symbol}</span>
                {result < 0.01 ? result.toFixed(8) : result.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                <span className="text-lg ml-2 text-muted-foreground font-sans font-medium">{toCurrency}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-3 font-mono">
                1 {fromCurrency} = {((rates[fromCurrency] || 1) / (rates[toCurrency] || 1)).toFixed(6)} {toCurrency}
              </p>
            </div>
          )}

          <div className="flex justify-end mt-6">
            <Button onClick={handleConvert} size="lg" className="px-12 h-12 text-base font-bold glow-primary">
              Convert
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Exchange;
