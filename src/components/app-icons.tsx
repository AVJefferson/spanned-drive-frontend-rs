import { SvgIcon, type SvgIconProps } from "@mui/material";

export function FolderTabIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M10 4l2 2h8v12H4V4h6zm10 14V8H4v10h16z" />
    </SvgIcon>
  );
}

export function DrivesTabIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M4 5h16v4H4V5zm0 5h16v4H4v-4zm0 5h16v4H4v-4zm2 1v2h3v-2H6zm0-5v2h3v-2H6zm0-5v2h3V6H6z" />
    </SvgIcon>
  );
}

export function TasksTabIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M9 16.2l-3.5-3.5L4 14.2l5 5 11-11-1.5-1.5z" />
    </SvgIcon>
  );
}

export function SettingsTabIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58-1.92-3.32-2.39.96a7.027 7.027 0 0 0-1.63-.94L14.96 2h-3.92l-.27 2.18c-.58.22-1.12.53-1.63.94l-2.39-.96-1.92 3.32 2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58 1.92 3.32 2.39-.96c.51.41 1.05.72 1.63.94l.27 2.18h3.92l.27-2.18c.58-.22 1.12-.53 1.63-.94l2.39.96 1.92-3.32-2.03-1.58zM13 15.5c-1.93 0-3.5-1.57-3.5-3.5S11.07 8.5 13 8.5s3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" />
    </SvgIcon>
  );
}

export function InfoTabIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M11 7h2V5h-2v2zm0 12h2v-8h-2v8zm1-17C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
    </SvgIcon>
  );
}

export function ExplorerFolderIcon(props: SvgIconProps) {
  return (
    <FolderTabIcon {...props} />
  );
}

export function ExplorerFileIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 0 0-2 2v16h16V8l-6-6zm1 7V3.5L19.5 9H15z" />
    </SvgIcon>
  );
}
