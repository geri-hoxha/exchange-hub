import { Check, Pencil, X } from "lucide-react";
import { CurrencyIcon } from "@/components/CurrencyIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ExchangeMode } from "./types";

interface ExchangeStepTwoProps {
  mode: ExchangeMode;
  primaryAsset: string;
  primaryAmount: number;
  exchangeRate: number;
  formatNum: (value: number) => string;
  quoteSummaryAsset: string;
  subtotal: number;
  editingFee: boolean;
  feeOverride: string;
  onFeeOverrideChange: (value: string) => void;
  onFeeEditingChange: (value: boolean) => void;
  effectiveFeePercent: number;
  effectiveFeeAmount: number;
  hasAdjustment: boolean;
  adjustment: number;
  editingTotal: boolean;
  totalOverride: string;
  onTotalOverrideChange: (value: string) => void;
  onTotalConfirm: () => void;
  onTotalEdit: () => void;
  effectiveTotal: number;
  totalDisplayAsset: string;
  quoteHasSufficientInventory?: boolean;
  onDiscard: () => void;
  onSaveExchange: () => void;
  savingExchange: boolean;
  canSave: boolean;
}

const ExchangeStepTwo = ({
  mode,
  primaryAsset,
  primaryAmount,
  exchangeRate,
  formatNum,
  quoteSummaryAsset,
  subtotal,
  editingFee,
  feeOverride,
  onFeeOverrideChange,
  onFeeEditingChange,
  effectiveFeePercent,
  effectiveFeeAmount,
  hasAdjustment,
  adjustment,
  editingTotal,
  totalOverride,
  onTotalOverrideChange,
  onTotalConfirm,
  onTotalEdit,
  effectiveTotal,
  totalDisplayAsset,
  quoteHasSufficientInventory,
  onDiscard,
  onSaveExchange,
  savingExchange,
  canSave,
}: ExchangeStepTwoProps) => {
  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <Check className="h-4 w-4 text-primary" />
        <h2 className="text-base font-bold">Review Exchange</h2>
      </div>

      {/* Summary rows */}
      <div className="rounded-xl border border-border overflow-hidden mb-3">
        <SummaryRow
          label={mode === "wants" ? "Customer Wants To Buy" : "Customer Has"}
          value={
            <div className="flex items-center gap-1.5">
              {primaryAsset && <CurrencyIcon code={primaryAsset} />}
              <span className="font-mono font-semibold text-xs sm:text-sm">{formatNum(primaryAmount)}</span>
            </div>
          }
        />

        <SummaryRow label="Exchange Rate" value={<span className="font-mono font-semibold text-xs sm:text-sm">{formatNum(exchangeRate)}</span>} />

        <SummaryRow
          label="Subtotal"
          value={
            <div className="flex items-center gap-1.5">
              {quoteSummaryAsset && <CurrencyIcon code={quoteSummaryAsset} />}
              <span className="font-mono font-semibold text-xs sm:text-sm">{formatNum(subtotal)}</span>
            </div>
          }
        />

        {/* Platform Fee - editable */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 border-b border-border last:border-b-0">
          <span className="text-xs font-medium text-muted-foreground">Platform Fee</span>
          {editingFee ? (
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={feeOverride}
                onChange={(e) => onFeeOverrideChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onFeeEditingChange(false)}
                className="w-16 sm:w-20 h-7 text-right font-mono text-xs bg-background"
                autoFocus
              />
              <span className="text-xs text-muted-foreground">%</span>
              <Button size="sm" variant="ghost" onClick={() => onFeeEditingChange(false)} className="h-6 w-6 p-0">
                <Check className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => {
                onFeeEditingChange(true);
                onFeeOverrideChange(feeOverride || String(effectiveFeePercent));
              }}
              className="group flex items-center gap-1 sm:gap-1.5 cursor-pointer"
            >
              <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="text-primary font-semibold text-xs sm:text-sm">{formatNum(effectiveFeePercent)}%</span>
              <span className="text-muted-foreground text-xs">→</span>
              <span className="font-mono font-semibold text-xs sm:text-sm flex items-center gap-1">
                <CurrencyIcon code={quoteSummaryAsset} /> {formatNum(effectiveFeeAmount)}
              </span>
            </button>
          )}
        </div>

        {hasAdjustment && (
          <div className="flex items-center justify-between px-3 sm:px-4 py-2.5">
            <span className={`text-xs font-medium ${adjustment > 0 ? "text-accent" : "text-destructive"}`}>
              Adjustment
            </span>
            <span className={`font-mono font-semibold text-xs sm:text-sm ${adjustment > 0 ? "text-accent" : "text-destructive"}`}>
              {adjustment > 0 ? "+" : ""}
              {formatNum(adjustment)} {totalDisplayAsset}
            </span>
          </div>
        )}
      </div>

      {/* Total */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 sm:px-4 py-3 mb-3">
        {editingTotal ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span className="text-xs sm:text-sm font-semibold whitespace-nowrap">
              {mode === "wants" ? "Total Customer Pays" : "Total Customer Gets"}
            </span>
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <Input
                type="number"
                value={totalOverride}
                onChange={(e) => onTotalOverrideChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onTotalConfirm()}
                className="flex-1 sm:w-48 h-8 text-right font-mono text-sm font-bold bg-background"
                autoFocus
              />
              <span className="text-xs font-semibold text-muted-foreground">{totalDisplayAsset}</span>
              <Button size="sm" variant="ghost" onClick={onTotalConfirm} className="h-7 w-7 p-0">
                <Check className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          <button onClick={onTotalEdit} className="w-full group cursor-pointer text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-semibold">
                {mode === "wants" ? "Total Customer Pays" : "Total Customer Gets"}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-base sm:text-lg tracking-tight">{formatNum(effectiveTotal)}</span>
                <span className="text-xs font-semibold text-muted-foreground">{totalDisplayAsset}</span>
                <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </button>
        )}
      </div>

      {quoteHasSufficientInventory === false && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs sm:text-sm text-destructive mb-3">
          Insufficient inventory for this quote.
        </div>
      )}

      <div className="flex gap-2 sm:gap-3">
        <Button variant="outline" onClick={onDiscard} size="lg" className="flex-1 h-10 sm:h-11 text-sm font-bold w-20 md:w-auto">
          <X className="h-4 w-4 mr-1.5" />
          Discard
        </Button>
        <Button
          onClick={onSaveExchange}
          size="lg"
          className="flex-1 h-10 sm:h-11 text-sm font-bold"
          disabled={savingExchange || !canSave}
        >
          <Check className="h-4 w-4 mr-1.5" />
          Save Exchange
        </Button>
      </div>
    </>
  );
};

/* Reusable summary row */
function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 border-b border-border last:border-b-0 bg-muted/30 even:bg-transparent">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {value}
    </div>
  );
}

export default ExchangeStepTwo;
