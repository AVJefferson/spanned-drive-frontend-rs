export interface DriveSettings {
  allowed_space_usage_percent?: number;
}
export interface Drive {
  provider: string;
  email: string;

  isPrimary?: boolean;
  isSecondary?: boolean;

  parent_drive?: string;
  associated_drives?: string[];

  refresh_token: string;
  acquired_at: number;
  scope?: string;

  access_token?: string;
  expires_in?: number;

  total_space?: number;
  used_space?: number;

  user?: {
    name?: string;
    picture?: string;
    sub?: string;
  };

  drive_settings?: DriveSettings;

  fetch_access_token: () => Promise<any>;
}

const DriveImplementations: Record<string, any> = import.meta.glob(
  "./drives/*.tsx",
  {
    eager: true,
  },
);

const Drives: { [key: string]: any } = DriveImplementations.reduce(
  (acc: { [key: string]: any }, module: any) => {
    const driveClass = module.default;
    if (driveClass && driveClass.provider) {
      acc[driveClass.provider] = driveClass;
    }
    return acc;
  },
  {},
);

export default Drives;
