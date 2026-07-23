export interface FinalizedProduct {
  sku: string;
  brand: string;
  name: string;
  englishName: string;
  finalizedAt: string;
  packageLength: string;
  packageWidth: string;
  packageHeight: string;
  productLength: string;
  productWidth: string;
  productHeight: string;
  netContent: string;
  grossWeight: string;
  ingredients: string;
  referenceUrl: string;
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
  englishPath: string | null;
  sizePath: string | null;
  excelExists: boolean;
  englishExists: boolean;
  sizeExists: boolean;
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
