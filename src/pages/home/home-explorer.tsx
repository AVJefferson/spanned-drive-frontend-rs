import { useMemo, useRef } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import { ExplorerFileIcon, ExplorerFolderIcon } from "../../components/icons";

interface MockEntry {
  id: string;
  name: string;
  kind: "folder" | "file";
  size?: string;
  updated: string;
}

const SAMPLE_ENTRIES: MockEntry[] = [
  { id: "f-photos", name: "Photos", kind: "folder", updated: "Just now" },
  { id: "f-archive", name: "Archive 2026", kind: "folder", updated: "Yesterday" },
  {
    id: "v-trip",
    name: "trip.mov",
    kind: "file",
    size: "1.4 GB",
    updated: "2 days ago",
  },
  {
    id: "z-backup",
    name: "backup.tar.zst",
    kind: "file",
    size: "12.7 GB",
    updated: "Last week",
  },
];

const UploadIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden focusable="false">
    <path
      d="M12 4v11m0-11-4 4m4-4 4 4M5 19h14"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

const NewFolderIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden focusable="false">
    <path
      d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Zm9 5h0m0 0v3m0-3h3m-3 0H9"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

const SearchIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden focusable="false">
    <path
      d="m20 20-3.5-3.5M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

const CloudIcon = (
  <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden focusable="false">
    <path
      d="M44 50a12 12 0 0 0 1.6-23.9A14 14 0 0 0 19 28.7 10 10 0 0 0 20 50Z"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M32 44V30m0 0-5 5m5-5 5 5"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

interface HomeExplorerProps {
  isMobile: boolean;
}

export function HomeExplorer({ isMobile }: HomeExplorerProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const breadcrumbs = useMemo(
    () => [{ id: "root", label: "All files" }],
    [],
  );

  const entries = SAMPLE_ENTRIES;
  const isEmpty = entries.length === 0;

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Stack spacing={{ xs: 2, md: 2.5 }} sx={{ flex: 1, minHeight: 0 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={{ xs: 1.5, sm: 2 }}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
      >


        <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
          <Button
            variant="outlined"
            startIcon={NewFolderIcon}
            sx={{ borderRadius: 999, fontWeight: 700 }}
          >
            New folder
          </Button>
          <Button
            variant="contained"
            startIcon={UploadIcon}
            onClick={handleUploadClick}
            sx={{ borderRadius: 999, fontWeight: 700 }}
          >
            Upload
          </Button>
          <input ref={fileInputRef} type="file" hidden multiple />
        </Stack>
      </Stack>

      <Card
        variant="outlined"
        sx={{
          borderRadius: 4,
          borderColor: alpha(theme.palette.primary.main, isDark ? 0.22 : 0.14),
          bgcolor: alpha(theme.palette.background.paper, isDark ? 0.5 : 0.8),
        }}
      >
        <CardContent
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            py: 1.25,
            "&:last-child": { pb: 1.25 },
          }}
        >
          <Box sx={{ color: "text.secondary", display: "flex" }}>
            {SearchIcon}
          </Box>
          <Box
            component="input"
            placeholder="Search across all your drives"
            sx={{
              flex: 1,
              minWidth: 0,
              border: "none",
              outline: "none",
              background: "transparent",
              color: "text.primary",
              fontSize: "0.95rem",
              fontFamily: "inherit",
              "&::placeholder": { color: theme.palette.text.disabled },
            }}
          />
          {!isMobile ? (
            <Chip
              label="Coming soon"
              size="small"
              sx={{
                fontWeight: 700,
                fontSize: "0.65rem",
                letterSpacing: 0.4,
                textTransform: "uppercase",
                bgcolor: alpha(
                  theme.palette.warning.main,
                  isDark ? 0.18 : 0.14,
                ),
                color: isDark
                  ? theme.palette.warning.light
                  : theme.palette.warning.dark,
                border: `1px solid ${alpha(theme.palette.warning.main, 0.35)}`,
              }}
            />
          ) : null}
        </CardContent>
      </Card>

      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        sx={{ flexWrap: "wrap", alignItems: "center" }}
      >
        {breadcrumbs.map((crumb, index) => (
          <Chip
            key={crumb.id}
            label={crumb.label}
            size="small"
            color={index === breadcrumbs.length - 1 ? "primary" : "default"}
            variant={
              index === breadcrumbs.length - 1 ? "filled" : "outlined"
            }
            sx={{ fontWeight: 600 }}
          />
        ))}
      </Stack>

      {isEmpty ? (
        <EmptyState onUpload={handleUploadClick} />
      ) : (
        <Stack
          spacing={1.25}
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            pr: { xs: 0, md: 0.5 },
          }}
        >
          {entries.map((entry) => (
            <EntryRow key={entry.id} entry={entry} />
          ))}
        </Stack>
      )}
    </Stack>
  );
}

function EmptyState({ onUpload }: { onUpload: () => void }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Card
      sx={{
        borderRadius: 6,
        borderStyle: "dashed",
        borderColor: alpha(theme.palette.primary.main, isDark ? 0.32 : 0.22),
        bgcolor: alpha(theme.palette.primary.main, isDark ? 0.06 : 0.04),
        py: { xs: 5, md: 8 },
        textAlign: "center",
      }}
    >
      <Stack alignItems="center" spacing={2.25} sx={{ px: 3 }}>
        <Box
          sx={{
            color: theme.palette.primary.main,
            display: "flex",
            opacity: 0.85,
          }}
        >
          {CloudIcon}
        </Box>
        <Stack spacing={1} alignItems="center">
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Drop your first file
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ maxWidth: 360 }}
          >
            Files split into chunks and route to whichever connected drive has
            room. Add more drives anytime to grow your space.
          </Typography>
        </Stack>
        <Button
          variant="contained"
          onClick={onUpload}
          sx={{ borderRadius: 999, fontWeight: 700 }}
        >
          Upload files
        </Button>
      </Stack>
    </Card>
  );
}

function EntryRow({ entry }: { entry: MockEntry }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Card
      sx={{
        borderRadius: 4,
        bgcolor: alpha(theme.palette.background.paper, isDark ? 0.6 : 1),
        transition: "transform 160ms ease, border-color 200ms ease",
        "&:hover": {
          transform: "translateY(-1px)",
          borderColor: theme.palette.primary.main,
        },
      }}
    >
      <CardContent sx={{ "&:last-child": { pb: 2 } }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: theme.palette.primary.main,
              bgcolor: alpha(
                theme.palette.primary.main,
                isDark ? 0.16 : 0.08,
              ),
            }}
          >
            {entry.kind === "folder" ? (
              <ExplorerFolderIcon />
            ) : (
              <ExplorerFileIcon />
            )}
          </Box>
          <Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" noWrap sx={{ fontWeight: 700 }}>
              {entry.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {entry.kind === "folder" ? "Folder" : entry.size} · {entry.updated}
            </Typography>
          </Stack>
          <IconButton size="small" aria-label="Item options">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              aria-hidden
              focusable="false"
            >
              <circle cx="5" cy="12" r="1.6" fill="currentColor" />
              <circle cx="12" cy="12" r="1.6" fill="currentColor" />
              <circle cx="19" cy="12" r="1.6" fill="currentColor" />
            </svg>
          </IconButton>
        </Stack>
      </CardContent>
    </Card>
  );
}
