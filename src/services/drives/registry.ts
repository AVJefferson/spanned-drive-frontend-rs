import type { DriveConstructor } from "./types";

// Each provider lives in `./<provider>/` and exports its DriveConstructor as the
// default export of `drive.tsx`. The glob auto-registers every such provider.
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
