import { useEffect, useState } from "react";
import btcIcon from "@/assets/crypto/btc.png";
import ethIcon from "@/assets/crypto/eth.png";
import usdtErc20Icon from "@/assets/crypto/usdt-erc20.png";
import usdtTrc20Icon from "@/assets/crypto/usdt-trc20.png";
import trxIcon from "@/assets/crypto/trx.png";

 
const BADGE_COLORS: Record<string, string> = {
  ALL: "bg-red-700",
  EUR: "bg-blue-700",
  USD: "bg-green-700",
  GBP: "bg-indigo-700",
  CHF: "bg-rose-600",
};

const DEFAULT_COLORS = [
  "bg-blue-600",
  "bg-amber-600",
  "bg-violet-600",
  "bg-cyan-600",
  "bg-orange-600",
  "bg-rose-600",
  "bg-teal-600",
  "bg-indigo-600",
];

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function badgeLabel(code: string): string {
  return code.slice(0, 3);
}

function FallbackBadge({ code }: { code: string }) {
  const color = BADGE_COLORS[code] ?? DEFAULT_COLORS[hashCode(code) % DEFAULT_COLORS.length];
  return (
    <span
      className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[7px] font-bold leading-none text-white ${color}`}
    >
      {badgeLabel(code)}
    </span>
  );
}

const ICON_BY_CODE: Record<string, string> = {
  BTC: btcIcon,
  ETH: ethIcon,
  TRX: trxIcon,
  USDT: usdtErc20Icon,
  "USDT-ERC20": usdtErc20Icon,
  "USDT-TRC20": usdtTrc20Icon,
};

export function CurrencyIcon({ code }: { code: string }) {
  const normalized = code.trim().toUpperCase();
  const [failed, setFailed] = useState(false);
  const src = ICON_BY_CODE[normalized] ?? (normalized.includes("USDT") ? usdtErc20Icon : undefined);

  useEffect(() => {
    setFailed(false);
  }, [normalized, src]);

  if (!src || failed) {
    return (
      <span className="inline-flex">
        <FallbackBadge code={normalized} />
      </span>
    );
  }

  return (
    <span className="inline-flex">
      <img
        src={src}
        alt={normalized}
        className="h-5 w-5 min-w-5 rounded-full object-contain"
        onError={() => setFailed(true)}
      />
    </span>
  );
}
