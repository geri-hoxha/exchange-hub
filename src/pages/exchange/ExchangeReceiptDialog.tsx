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
          <DialogTitle>Exchange Receipt</DialogTitle>
        </DialogHeader>

        <div
          ref={receiptRef}
          className={`bg-[#0d1117] text-white p-6 rounded-xl ${receiptImage ? "hidden" : ""}`}
          style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
        >
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
              <span className="text-sm font-mono font-semibold">
                {formatNum(primaryAmount)} {primaryAsset}
              </span>
            </div>
            <div className="flex justify-between px-4 py-2.5 border-b border-gray-700">
              <span className="text-xs text-gray-400">Exchange Rate</span>
              <span className="text-sm font-mono font-semibold">{formatNum(exchangeRate)}</span>
            </div>
            <div className="flex justify-between px-4 py-2.5 border-b border-gray-700">
              <span className="text-xs text-gray-400">Subtotal</span>
              <span className="text-sm font-mono font-semibold">
                {formatNum(subtotal)} {quoteSummaryAsset}
              </span>
            </div>
            <div className="flex justify-between px-4 py-2.5 border-b border-gray-700">
              <span className="text-xs text-gray-400">Fee ({feePercent}%)</span>
              <span className="text-sm font-mono font-semibold">
                {formatNum(feeAmount)} {quoteSummaryAsset}
              </span>
            </div>
          </div>

          <div className="bg-[#161b22] border border-[#3b82f6]/30 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">{mode === "wants" ? "Total Customer Pays" : "Total Customer Gets"}</p>
            <p className="text-2xl font-mono font-bold">{formatNum(effectiveTotal)}</p>
            <p className="text-sm font-bold text-gray-400">{totalDisplayAsset}</p>
          </div>
        </div>

        {receiptImage && (
          <div className="rounded-lg overflow-hidden border border-border">
            <img src={receiptImage} alt="Receipt preview" className="w-full" />
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <Button variant="outline" onClick={onDownload} disabled={!receiptImage} className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" onClick={onShare} disabled={!receiptImage} className="flex-1">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button onClick={onConfirm} className="flex-1">
            <Check className="h-4 w-4 mr-2" />
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExchangeReceiptDialog;
