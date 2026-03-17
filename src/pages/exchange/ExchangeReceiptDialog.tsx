import { ArrowLeftRight, Check, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ExchangeMode } from "./types";

interface ExchangeReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiptRef: React.RefObject<HTMLDivElement | null>;
  receiptImage: string | null;
  mode: ExchangeMode;
  primaryAmount: number;
  primaryAsset: string;
  exchangeRate: number;
  subtotal: number;
  quoteSummaryAsset: string;
  feePercent: number;
  feeAmount: number;
  effectiveTotal: number;
  totalDisplayAsset: string;
  formatNum: (n: number) => string;
  onDownload: () => void;
  onShare: () => void;
  onConfirm: () => void;
}

const ExchangeReceiptDialog = ({
  open,
  onOpenChange,
  receiptRef,
  receiptImage,
  mode,
  primaryAmount,
  primaryAsset,
  exchangeRate,
  subtotal,
  quoteSummaryAsset,
  feePercent,
  feeAmount,
  effectiveTotal,
  totalDisplayAsset,
  formatNum,
  onDownload,
  onShare,
  onConfirm,
}: ExchangeReceiptDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Exchange Receipt</DialogTitle>
        </DialogHeader>

        <div
          ref={receiptRef}
          className={`rounded-lg bg-slate-950 p-4 sm:rounded-xl sm:p-6 text-white ${receiptImage ? "hidden" : ""}`}
          style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
        >
          <div className="mb-4 text-center sm:mb-5">
            <div className="mb-1.5 flex items-center justify-center gap-2">
              <ArrowLeftRight className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
              <span className="text-base font-bold sm:text-lg">CryptoXchange</span>
            </div>
            <p className="text-[11px] text-slate-400 sm:text-xs">Exchange Receipt</p>
            <p className="mt-1 text-[10px] text-slate-500 sm:text-xs">{new Date().toLocaleString()}</p>
          </div>

          <div className="mb-3 overflow-hidden rounded-lg border border-slate-700 sm:mb-4">
            <ReceiptRow
              label={mode === "wants" ? "Customer Wants To Buy" : "Customer Has"}
              value={`${formatNum(primaryAmount)} ${primaryAsset}`}
            />
            <ReceiptRow label="Exchange Rate" value={formatNum(exchangeRate)} />
            <ReceiptRow label="Subtotal" value={`${formatNum(subtotal)} ${quoteSummaryAsset}`} />
            <ReceiptRow label={`Fee (${feePercent}%)`} value={`${formatNum(feeAmount)} ${quoteSummaryAsset}`} />
          </div>

          <div className="rounded-lg border border-primary/30 bg-slate-900 px-3 py-3 text-center sm:p-4">
            <p className="mb-1 text-[11px] text-slate-400 sm:text-xs">
              {mode === "wants" ? "Total Customer Pays" : "Total Customer Gets"}
            </p>
            <p className="font-mono text-xl font-bold sm:text-2xl">{formatNum(effectiveTotal)}</p>
            <p className="text-xs font-bold text-slate-400 sm:text-sm">{totalDisplayAsset}</p>
          </div>
        </div>

        {receiptImage && (
          <div className="overflow-hidden rounded-lg border border-border bg-muted/20">
            <img src={receiptImage} alt="Receipt preview" className="max-h-[60vh] w-full object-contain" loading="lazy" />
          </div>
        )}

        <div className="mt-3 grid grid-cols-1 gap-2 sm:mt-4 sm:grid-cols-3 sm:gap-3">
          <Button variant="outline" onClick={onDownload} disabled={!receiptImage} className="h-10 text-sm">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button variant="outline" onClick={onShare} disabled={!receiptImage} className="h-10 text-sm">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button onClick={onConfirm} className="h-10 text-sm">
            <Check className="mr-2 h-4 w-4" />
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-700 px-3 py-2.5 last:border-b-0 sm:px-4">
      <span className="text-[11px] text-slate-400 sm:text-xs">{label}</span>
      <span className="max-w-[58%] text-right font-mono text-xs font-semibold sm:text-sm">{value}</span>
    </div>
  );
}

export default ExchangeReceiptDialog;
