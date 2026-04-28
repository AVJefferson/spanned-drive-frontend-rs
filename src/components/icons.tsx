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
  return <FolderTabIcon {...props} />;
}

export function ExplorerFileIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 0 0-2 2v16h16V8l-6-6zm1 7V3.5L19.5 9H15z" />
    </SvgIcon>
  );
}

export function GoogleDriveIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function MicrosoftIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 21 21" fill="none">
      <path
        d="M10 21H0V11h10v10zM21 21H11V11h10v10zM10 10H0V0h10v10zM21 10H11V0h10v10z"
        fill="#00a4ef"
      />
    </svg>
  );
}

export function OthersIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 21 21" fill="none">
      <path d="M10 21H0V11h10V0h10v10zM21 10H11V0h10v10z" fill="currentColor" />
    </svg>
  );
}
