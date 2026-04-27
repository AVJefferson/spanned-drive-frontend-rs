import type { ComponentType, JSX } from "react";

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
  /** @deprecated prefer the static `provider_icon` on the constructor. Kept for instance access. */
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
  upload_file: (file: File, parentId: string) => Promise<DriveUploadResult>;
  list_children: (
    parentId: string,
    options?: { pageToken?: string; pageSize?: number },
  ) => Promise<DriveListChildrenResponse>;
  delete_item: (itemId: string) => Promise<void>;
  copy_item: (itemId: string, parentId: string, name?: string) => Promise<DriveItemMetadata>;
  download_file: (itemId: string) => Promise<Blob>;
  read_drive_settings: () => Promise<DriveSettings | null>;
  write_drive_settings: (settings: DriveSettings) => Promise<void>;
  read_app_storage_json: <T>(key: string) => Promise<T | null>;
  write_app_storage_json: <T>(key: string, value: T) => Promise<void>;

  /**
   * Resolve the parent folder id under which the logical-folder root should be
   * created on this drive. Defaults to "root". Providers that need a hidden
   * container (e.g. Google Drive's `.spanneddrive`) override this.
   */
  resolve_logical_root_parent?: () => Promise<string>;
}

export type Drive = DriveSnapshot;

export type DriveConstructor = (new (data: Record<string, unknown>) => Drive) & {
  provider: string;
  provider_label: string;
  /** Static icon used by sign-in / provider picker before any drive instance exists. */
  provider_icon: () => JSX.Element;
  oauth_redirect: (props: {
    accountType: "primary" | "secondary";
    hint?: string;
  }) => void;
  /** React component rendered by the OAuth redirect route after the user returns. */
  oauth_callback: ComponentType<{ params: OauthCallbackParams }>;
};

export interface OauthCallbackParams {
  provider: string;
  queryParams: Record<string, string>;
  hashParams: Record<string, string>;
  oauthParams: Record<string, unknown>;
}
