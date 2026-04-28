import type { ComponentType, JSX } from "react";

export interface Drive {
  provider: string;
  email: string;
}

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
  provider_label: string;

  provider_icon: () => JSX.Element;

  oauth_redirect: (props: {
    accountType: "primary" | "secondary";
    hint?: string;
  }) => void;

  oauth_callback: ComponentType<{ params: OauthCallbackParams }>;
};

const DriveImplementations: Record<string, { default: DriveConstructor }> =
  import.meta.glob("./*/drive.tsx", { eager: true }) as Record<
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
