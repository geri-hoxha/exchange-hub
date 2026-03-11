import api from "@/lib/axios";

export type AssetType = "Fiat" | "Crypto" | "Both";

export interface Asset {
  code: string;
  type: "crypto" | "fiat";
}

interface AssetsResponse {
  value: string[];
}

export const getAssets = async (type: AssetType = "Both") => {
  const response = await api.get<AssetsResponse>("/api/assets", {
    params: { type },
  });
  return response.data.value;
};

export const getAllAssets = async (): Promise<Asset[]> => {
  const [cryptoCodes, fiatCodes] = await Promise.all([
    getAssets("Crypto"),
    getAssets("Fiat"),
  ]);

  const cryptoAssets: Asset[] = cryptoCodes.map((code) => ({
    code,
    type: "crypto" as const,
  }));

  const fiatAssets: Asset[] = fiatCodes.map((code) => ({
    code,
    type: "fiat" as const,
  }));

  return [...cryptoAssets, ...fiatAssets];
};
