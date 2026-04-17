import type { JSX } from "react";

export interface DriveReference {
  provider: string;
  email: string;
}

export interface DriveUser {
  name?: string;
  picture?: string;
  sub?: string;
}

export interface DriveSettings {
  usageLimitPercent?: number;
  allowed_space_usage_percent?: number;
  [key: string]: unknown;
}

export interface DriveDetails {
  totalSpace?: number;
  usedSpace?: number;
  freeSpace?: number;
  appDataUsage?: number;
  lastSyncedAt?: number;
  [key: string]: unknown;
}

export interface DriveSpan {
  [key: string]: unknown;
}

export interface DriveItemMetadata {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  parents?: string[];
  modifiedTime?: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  isFolder: boolean;
}

export interface DriveUploadResult extends DriveItemMetadata {}

export interface DriveListChildrenResponse {
  items: DriveItemMetadata[];
  nextPageToken?: string;
}

export interface DriveSnapshot extends DriveReference {
  providerLabel: string;
  provider_icon: () => JSX.Element;
  refresh_token: string;
  acquired_at: number;
  scope?: string[];
  access_token?: string;
  expires_in?: number;
  user?: DriveUser;
  drive_settings: DriveSettings;
  drive_details: DriveDetails;
  drive_span: DriveSpan;
  fetch_access_token: () => Promise<string | null>;
  refresh_drive_details: () => Promise<DriveDetails>;
  get_item_metadata: (itemId: string) => Promise<DriveItemMetadata>;
  create_folder: (name: string, parentId: string) => Promise<DriveItemMetadata>;
  upload_file: (
    file: File,
    parentId: string,
  ) => Promise<DriveUploadResult>;
  list_children: (
    parentId: string,
    options?: { pageToken?: string; pageSize?: number },
  ) => Promise<DriveListChildrenResponse>;
  delete_item: (itemId: string) => Promise<void>;
  copy_item: (
    itemId: string,
    parentId: string,
    name?: string,
  ) => Promise<DriveItemMetadata>;
  read_drive_settings: () => Promise<DriveSettings | null>;
  write_drive_settings: (settings: DriveSettings) => Promise<void>;
  read_app_storage_json: <T>(key: string) => Promise<T | null>;
  write_app_storage_json: <T>(key: string, value: T) => Promise<void>;
}

export type Drive = DriveSnapshot;

export type DriveConstructor = (new (data: Record<string, unknown>) => Drive) & {
  provider: string;
  provider_label: string;
  oauth_redirect: (props: { accountType: "primary" | "secondary"; hint?: string }) => void;
};

const DriveImplementations: Record<string, { default: DriveConstructor }> =
  import.meta.glob("./drives/*.tsx", {
    eager: true,
  }) as Record<string, { default: DriveConstructor }>;

export const Drives = Object.keys(DriveImplementations).reduce(
  (accumulator, path) => {
    const driveModule = DriveImplementations[path];
    const driveImplementation = driveModule?.default;

    if (!driveImplementation?.provider) {
      return accumulator;
    }

    accumulator[driveImplementation.provider] = driveImplementation;
    return accumulator;
  },
  {} as Record<string, DriveConstructor>,
);

export function getDriveImplementation(provider: string) {
  return Drives[provider];
}
