import { ArrowRight } from "lucide-react";
import { Controller, type Control } from "react-hook-form";
import { CurrencyIcon } from "@/components/CurrencyIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ExchangeAsset, ExchangeMode, ExchangeStepOneFormValues } from "./types";

interface ExchangeStepOneProps {
  control: Control<ExchangeStepOneFormValues>;
  mode: ExchangeMode;
  currencies: ExchangeAsset[];
  payCurrencyTypeFilter: "fiat" | "crypto" | null;
  payCurrencyOptions: ExchangeAsset[];
  canProceed: boolean;
  fetchingQuote: boolean;
  onNext: () => void;
}

const ExchangeStepOne = ({
  control,
  mode,
  currencies,
  payCurrencyTypeFilter,
  payCurrencyOptions,
  canProceed,
  fetchingQuote,
  onNext,
}: ExchangeStepOneProps) => {
  const renderCurrencyOption = (asset: ExchangeAsset) => (
    <SelectItem key={asset.code} value={asset.code}>
      <div className="flex items-center gap-2">
        <CurrencyIcon code={asset.code} />
        <span className="font-mono">{asset.code}</span>
      </div>
    </SelectItem>
  );

  return (
    <>
      <div className="flex rounded-lg bg-muted p-1 mb-4 sm:mb-6">
        <Controller
          name="mode"
          control={control}
          render={({ field }) => (
            <>
              <button
                onClick={() => field.onChange("wants")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all ${
                  mode === "wants"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Customer Wants
              </button>
              <button
                onClick={() => field.onChange("has")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all ${
                  mode === "has"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Customer Has
              </button>
            </>
          )}
        />
      </div>

      <label className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-widest">
        {mode === "wants" ? "Customer wants to buy" : "Customer has"}
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-1.5 sm:mt-2 mb-4 sm:mb-6">
        <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <Input
              type="number"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              className="h-10 sm:h-12 bg-background font-mono text-sm sm:text-base"
              placeholder="Amount"
            />
          )}
        />
        <Controller
          name="buyCurrency"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="h-10 sm:h-12 bg-background font-medium text-sm">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Crypto
                </div>
                {currencies.filter((c) => c.type === "crypto").map((c) => renderCurrencyOption(c))}
                <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                  Fiat
                </div>
                {currencies.filter((c) => c.type === "fiat").map((c) => renderCurrencyOption(c))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="flex items-center gap-2 sm:gap-3 my-4 sm:my-6">
        <div className="flex-1 h-px bg-border" />
        <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          {mode === "wants" ? "PAYING WITH" : "WANTS TO GET"}
        </div>
        <div className="flex-1 h-px bg-border" />
      </div>

      <label className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-widest">
        {mode === "wants" ? "Payment currency" : "Target currency"}
      </label>
      <div className="mt-1.5 sm:mt-2 mb-6 sm:mb-8">
        <Controller
          name="payCurrency"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="h-10 sm:h-12 bg-background font-medium text-sm">
                <SelectValue placeholder="Select payment currency" />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  {payCurrencyTypeFilter === "crypto" ? "Crypto" : payCurrencyTypeFilter === "fiat" ? "Fiat" : "All"}
                </div>
                {payCurrencyOptions.map((c) => renderCurrencyOption(c))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <Button
        onClick={onNext}
        size="lg"
        className="w-full h-10 sm:h-12 text-sm sm:text-base font-bold"
        disabled={!canProceed || fetchingQuote}
      >
        {fetchingQuote ? "Getting Quote..." : "Next"}
      </Button>
    </>
  );
};

export default ExchangeStepOne;
