import type { JSX } from "react";

import { Drives } from "../../drives";
import {
  BoxIcon,
  DropboxIcon,
  ICloudIcon,
  MegaIcon,
  OneDriveIcon,
  PCloudIcon,
  SyncIcon,
  YandexDiskIcon,
} from "./icons";

export interface SignInProvider {
  provider: string;
  providerLabel: string;
  providerIcon: JSX.Element;
  available: boolean;
  oauthRedirect?: (
    accountType: "primary" | "secondary",
    hint?: string,
  ) => void;
}

interface ComingSoonEntry {
  provider: string;
  providerLabel: string;
  providerIcon: JSX.Element;
}

const COMING_SOON: ComingSoonEntry[] = [
  { provider: "onedrive", providerLabel: "OneDrive", providerIcon: OneDriveIcon },
  { provider: "mega", providerLabel: "MEGA", providerIcon: MegaIcon },
];

const FEATURED_ORDER = ["google-drive", "onedrive"];

export function buildProviderList(): SignInProvider[] {
  const available: SignInProvider[] = Object.values(Drives).map((Drive) => ({
    provider: Drive.provider,
    providerLabel: Drive.providerLabel,
    providerIcon: Drive.providerIcon,
    available: true,
    oauthRedirect: Drive.oauthRedirect,
  }));

  const availableKeys = new Set(available.map((entry) => entry.provider));

  const upcoming: SignInProvider[] = COMING_SOON.filter(
    (entry) => !availableKeys.has(entry.provider),
  ).map((entry) => ({ ...entry, available: false }));

  const merged = [...available, ...upcoming];

  return merged.sort((left, right) => {
    if (left.available !== right.available) {
      return left.available ? -1 : 1;
    }
    const leftIndex = FEATURED_ORDER.indexOf(left.provider);
    const rightIndex = FEATURED_ORDER.indexOf(right.provider);
    if (leftIndex !== -1 || rightIndex !== -1) {
      const safeLeft = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
      const safeRight = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;
      return safeLeft - safeRight;
    }
    return left.providerLabel.localeCompare(right.providerLabel);
  });
}
