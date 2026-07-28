export interface CopywritingSection {
  key: string;
  label: string;
  text: string;
}

export interface CopywritingSnapshot {
  parserVersion: string;
  fileName: string;
  updatedAt: string;
  fullText: string;
  missingSections: string[];
  sections: CopywritingSection[];
}

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
  copywriting?: CopywritingSnapshot | null;
  referenceUrl: string;
  skuImageUrl: string;
  skuImageFallbackUrl: string;
  benchmarkImageUrl: string;
  benchmarkImageFallbackUrl: string;
  packageCode: string;
  printCode: string;
  purchasePrice: string;
  packQty: string;
  boxFileState: string;
  labelFileState: string;
  imagePackState: string;
  boxFileDone: boolean;
  labelFileDone: boolean;
  imagePackDone: boolean;
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

export interface UploadPair {
  sku: string;
  xlsxPath: string | null;
  zipPath: string | null;
  xlsxName: string | null;
  zipName: string | null;
  xlsxSize: number;
  zipSize: number;
  xlsxModifiedMs: number;
  zipModifiedMs: number;
  status: "ready" | "missing" | "invalid" | string;
  message: string;
  signature: string;
}
