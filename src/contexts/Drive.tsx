import { JSX } from "react";

export interface DriveSettings {
  [key: string]: any;
}

export interface DriveDetails {
  [key: string]: any;
}

export interface DriveSpan {
  [key: string]: any;
}

export interface Drive {
  provider: string;
  provider_icon: () => JSX.Element;
  email: string;

  refresh_token: string;
  acquired_at: number;
  scope?: string[];

  access_token?: string;
  expires_in?: number;

  user?: {
    name?: string;
    picture?: string;
    sub?: string;
  };

  drive_settings?: DriveSettings;
  drive_details?: DriveDetails;
  drive_span?: DriveSpan;

  fetch_access_token: () => Promise<any>;
}

export type DriveConstructor = (new (data: any) => Drive) & {
  oauth_redirect: (props: any) => void;
};

const DriveImplementations: Record<string, any> = import.meta.glob(
  "./drives/*.tsx",
  {
    eager: true,
  },
);

const Drives: { [key: string]: any } = Object.keys(DriveImplementations).reduce(
  (acc, path) => {
    const driveModule = DriveImplementations[path];
    if (driveModule && driveModule.default) {
      const driveName = path.split("/").pop()?.replace(".tsx", "");
      if (!driveName) return acc;

      acc[driveName] = driveModule.default;
    }
    return acc;
  },
  {} as Record<string, any>,
);

export { Drives };
