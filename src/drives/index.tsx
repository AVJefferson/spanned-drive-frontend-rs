import type { JSX } from "react";
export { type JSX } from "react";

export interface DriveReference {
  provider: string;
  email: string;

  refreshToken?: string;
  refreshTime?: number;
}

export interface DriveSnapshot extends DriveReference {
  
}

export type Drive = DriveSnapshot;

export interface OauthCallbackParams {
  provider: string;
  queryParams: Record<string, string>;
  hashParams: Record<string, string>;
  oauthParams: Record<string, unknown>;
}

export type DriveConstructor = (new (
  data: Record<string, unknown>,
) => Drive) & {
  provider: string;
  providerLabel: string;

  providerIcon: JSX.Element;

  oauthRedirect: (accountType: "primary" | "secondary", hint?: string) => void;
  oauthCallback: (params: OauthCallbackParams) => Promise<boolean>;
};

const DriveImplementations: Record<string, { default: DriveConstructor }> =
  import.meta.glob("./*/index.tsx", { eager: true }) as Record<
    string,
    { default: DriveConstructor }
  >;

export const Drives = Object.keys(DriveImplementations).reduce(
  (accumulator, path) => {
    const driveImplementation = DriveImplementations[path]?.default;
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
