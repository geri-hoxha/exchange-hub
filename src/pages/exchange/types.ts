import type { Asset } from "@/services/assetsService";

export type ExchangeMode = "wants" | "has";

export type ExchangeAsset = Asset & {
  symbol?: string;
  icon?: string;
};

export interface ExchangeQuoteRequest {
  customerPaysAsset: string;
  customerReceivesAsset: string;
  customerPaysAmount: number;
  customerReceivesAmount: number;
}

export interface ExchangeQuoteResponse {
  id: string;
  inputMode: string;
  customerPaysAsset: string;
  customerPaysAmount: number;
  customerPaysAmountLcy: number;
  customerReceivesAsset: string;
  customerReceivesAmount: number;
  customerReceivesAmountLcy: number;
  agreedRate: number;
  feeLcy: number;
  marginFeeRate: number;
  platformFeeRate: number;
  marginFeeAmount: number;
  platformFeeAmount: number;
  hasSufficientInventory: boolean;
}

export interface ExchangeCustomer {
  id: number;
  name: string;
}

export interface SaveConfirmFormValues {
  customerId: string;
  finalAmount: string;
  occurredAt: string;
  referenceNo: string;
  note: string;
  actualReceivedAmount: string;
  actualPaidAmount: string;
}

export interface ExchangeStepOneFormValues {
  mode: ExchangeMode;
  amount: string;
  buyCurrency: string;
  payCurrency: string;
}
