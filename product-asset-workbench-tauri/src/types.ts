export interface FinalizedProduct {
  sku: string;
  brand: string;
  name: string;
  englishName: string;
  finalizedAt: string;
  finalizedDate: string;
  cacheUpdatedAtMs: number;
  packageSizeText: string;
  packageSizeLabel: string;
  packageNums: number[];
  packageLength: string;
  packageWidth: string;
  packageHeight: string;
  productNums: number[];
  plmProductNums: number[];
  productLength: string;
  productWidth: string;
  productHeight: string;
  singleBottle: boolean;
  hasInnerCard: boolean;
  netContent: string;
  grossWeight: string;
  ingredients: string;
  referenceUrl: string;
  skuImageUrl: string;
  skuImageFallbackUrl: string;
  benchmarkImageUrl: string;
  benchmarkImageFallbackUrl: string;
  packageCode: string;
  printCode: string;
  purchasePrice: string;
  packQty: string;
}

export interface ProductPreview {
  product: FinalizedProduct;
  folder: string | null;
  transparentImage: string | null;
  excelPath: string | null;
  skuImagePath: string | null;
  englishPath: string | null;
  sizePath: string | null;
  excelExists: boolean;
  skuImageExists: boolean;
  englishExists: boolean;
  sizeExists: boolean;
  matchSource: string;
  ambiguousFolders: string[];
  missing: string[];
}

export interface BridgeInfo {
  url: string;
  token: string;
  connected: boolean;
  scriptVersion: string;
}

export type JobState = "idle" | "queued" | "running" | "done" | "skipped" | "error";

export interface RowJob {
  state: JobState;
  message: string;
}
