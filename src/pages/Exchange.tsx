import { useState } from "react";
import { ArrowLeftRight, ArrowRight } from "lucide-react";
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

type Tab = "wants" | "has";

const Exchange = () => {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("");
  const [paymentCurrency, setPaymentCurrency] = useState("");
  const [tab, setTab] = useState<Tab>("wants");
  const [result, setResult] = useState<number | null>(null);

  const handleGetQuote = () => {
    if (!amount || !currency || !paymentCurrency) return;
    const fromRate = rates[tab === "wants" ? paymentCurrency : currency] || 1;
    const toRate = rates[tab === "wants" ? currency : paymentCurrency] || 1;
    const usdAmount = parseFloat(amount) * fromRate;
    setResult(usdAmount / toRate);
  };

  const customerLabel = tab === "wants" ? "Customer wants to buy" : "Customer has";
  const paymentLabel = tab === "wants" ? "Payment currency" : "Customer wants";

  const resultFromCode = tab === "wants" ? paymentCurrency : currency;
  const resultToCode = tab === "wants" ? currency : paymentCurrency;
  const resultFromData = currencies.find((c) => c.code === resultFromCode);
  const resultToData = currencies.find((c) => c.code === resultToCode);

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
          {/* Header */}
          <div className="flex items-center gap-2 mb-6">
            <ArrowLeftRight className="h-5 w-5 text-foreground" />
            <h2 className="text-lg font-bold">New Exchange</h2>
          </div>

          {/* Tabs */}
          <div className="flex mb-8 bg-muted rounded-xl p-1">
            <button
              onClick={() => { setTab("wants"); setResult(null); }}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                tab === "wants"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Customer Wants
            </button>
            <button
              onClick={() => { setTab("has"); setResult(null); }}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                tab === "has"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Customer Has
            </button>
          </div>

          {/* Amount + Currency */}
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            {customerLabel}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 mb-6">
            <Input
              type="number"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setResult(null); }}
              className="h-12 bg-background font-mono text-base"
              placeholder="Amount"
            />
            <Select value={currency} onValueChange={(v) => { setCurrency(v); setResult(null); }}>
              <SelectTrigger className="h-12 bg-background font-medium">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest">Crypto</div>
                {currencies.filter(c => c.type === "crypto").map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    <span className="font-mono mr-1">{c.symbol}</span> {c.code} — {c.name}
                  </SelectItem>
                ))}
                <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Fiat</div>
                {currencies.filter(c => c.type === "fiat").map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    <span className="font-mono mr-1">{c.symbol}</span> {c.code} — {c.name}
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
            {paymentLabel}
          </label>
          <div className="mt-2 mb-6">
            <Select value={paymentCurrency} onValueChange={(v) => { setPaymentCurrency(v); setResult(null); }}>
              <SelectTrigger className="h-12 bg-background font-medium">
                <SelectValue placeholder="Select payment currency" />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest">Crypto</div>
                {currencies.filter(c => c.type === "crypto").map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    <span className="font-mono mr-1">{c.symbol}</span> {c.code} — {c.name}
                  </SelectItem>
                ))}
                <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Fiat</div>
                {currencies.filter(c => c.type === "fiat").map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    <span className="font-mono mr-1">{c.symbol}</span> {c.code} — {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Result */}
          {result !== null && resultFromData && resultToData && (
            <div className="mb-6 p-5 bg-muted rounded-xl border border-border">
              <p className="text-sm text-muted-foreground">
                Customer pays
              </p>
              <p className="text-2xl font-bold text-foreground mt-1 font-mono">
                <span className="text-primary">{resultFromData.symbol}</span>
                {result < 0.01 ? result.toFixed(8) : result.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                <span className="text-sm ml-2 text-muted-foreground font-sans font-medium">{resultFromCode}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-2 font-mono">
                for {amount} {resultToCode}
              </p>
            </div>
          )}

          {/* Get Quote button */}
          <Button
            onClick={handleGetQuote}
            size="lg"
            className="w-full h-12 text-base font-bold"
            disabled={!amount || !currency || !paymentCurrency}
          >
            Get Quote
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Exchange;
