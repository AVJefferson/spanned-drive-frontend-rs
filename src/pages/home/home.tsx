import { useMemo, useState, type ReactNode } from "react";
import {
  Avatar,
  Box,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";

import { useSession } from "../../contexts/session-context";
import {
  DrivesTabIcon,
  FolderTabIcon,
  SettingsTabIcon,
  TasksTabIcon,
} from "../../components/icons";
import { SpannedLogoMark } from "../signin/icons";

import { HomeExplorer } from "./home-explorer";
import { DrivesTab, AccountTab, TasksTab } from "./right-pane-tabs";
import {
  DEFAULT_HOME_TAB,
  HOME_TABS,
  type HomeTab,
  useHomePathSync,
} from "./use-home-path-sync";

interface NavItem {
  id: HomeTab;
  label: string;
  icon: ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { id: "files", label: "Files", icon: <FolderTabIcon /> },
  { id: "drives", label: "Drives", icon: <DrivesTabIcon /> },
  { id: "tasks", label: "Tasks", icon: <TasksTabIcon /> },
  { id: "account", label: "Account", icon: <SettingsTabIcon /> },
];

const SIDEBAR_WIDTH = 240;
const MOBILE_HEADER_HEIGHT = 64;
const DESKTOP_HEADER_HEIGHT = 72;

function readInitialTab(): HomeTab {
  if (typeof window === "undefined") return DEFAULT_HOME_TAB;
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("tab");
  if (raw && (HOME_TABS as readonly string[]).includes(raw)) {
    return raw as HomeTab;
  }
  return DEFAULT_HOME_TAB;
}

export function Home() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [selectedTab, setSelectedTab] = useState<HomeTab>(readInitialTab);

  useHomePathSync(selectedTab, setSelectedTab);

  const tabContent = useMemo(() => {
    switch (selectedTab) {
      case "drives":
        return <DrivesTab isMobile={isMobile} />;
      case "tasks":
        return <TasksTab />;
      case "account":
        return <AccountTab />;
      case "files":
      default:
        return <HomeExplorer isMobile={isMobile} />;
    }
  }, [selectedTab, isMobile]);

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "100dvh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
        overflow: "hidden",
      }}
    >
      <BackgroundDecor />

      <HomeHeader isMobile={isMobile} />

      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          width: "100%",
        }}
      >
        {!isMobile ? (
          <DesktopSidebar
            selectedTab={selectedTab}
            onSelect={setSelectedTab}
          />
        ) : null}

        <Box
          component="main"
          sx={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            width: "100%",
            px: { xs: 2, md: 4 },
            pt: { xs: 2, md: 3 },
            pb: { xs: 12, md: 4 },
            overflowY: "auto",
          }}
        >
          <Paper
            elevation={0}
            sx={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              p: { xs: 2, md: 3.5 },
              borderRadius: { xs: 4, md: 6 },
              bgcolor: isDark
                ? alpha(theme.palette.background.paper, 0.7)
                : alpha(theme.palette.background.paper, 0.92),
              border: `1px solid ${alpha(
                theme.palette.primary.main,
                isDark ? 0.18 : 0.1,
              )}`,
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              boxShadow: isDark
                ? `0 30px 60px ${alpha("#000", 0.45)}`
                : `0 24px 50px ${alpha(theme.palette.primary.dark, 0.12)}`,
            }}
          >
            {tabContent}
          </Paper>
        </Box>
      </Box>

      {isMobile ? (
        <MobileBottomNav
          selectedTab={selectedTab}
          onSelect={setSelectedTab}
        />
      ) : null}
    </Box>
  );
}

export default Home;

function BackgroundDecor() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        background: isDark
          ? `radial-gradient(circle at 12% 0%, ${alpha(theme.palette.primary.dark, 0.4)} 0%, transparent 55%), radial-gradient(circle at 92% 88%, ${alpha(theme.palette.secondary.main, 0.22)} 0%, transparent 55%), linear-gradient(180deg, #050b16 0%, #0a1426 100%)`
          : `radial-gradient(circle at 12% 0%, ${alpha(theme.palette.primary.main, 0.14)} 0%, transparent 55%), radial-gradient(circle at 92% 92%, ${alpha(theme.palette.primary.light, 0.18)} 0%, transparent 55%), linear-gradient(180deg, #f0f7fc 0%, #e2eef7 100%)`,
        "&::after": {
          content: '""',
          position: "absolute",
          inset: 0,
          backgroundImage: isDark
            ? "radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)"
            : "radial-gradient(rgba(15,23,42,0.05) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          maskImage:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.85), transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.85), transparent 75%)",
        },
      }}
    />
  );
}

function HomeHeader({ isMobile }: { isMobile: boolean }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const session = useSession();
  const navigate = useNavigate();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const initials = session.primaryDrive?.email[0]?.toUpperCase() || "S";
  const headerHeight = isMobile ? MOBILE_HEADER_HEIGHT : DESKTOP_HEADER_HEIGHT;

  return (
    <Box
      component="header"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 5,
        height: headerHeight,
        display: "flex",
        alignItems: "center",
        px: { xs: 2, md: 3.5 },
        gap: 2,
        bgcolor: isDark
          ? alpha(theme.palette.background.paper, 0.6)
          : alpha(theme.palette.background.paper, 0.78),
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        borderBottom: `1px solid ${alpha(
          theme.palette.primary.main,
          isDark ? 0.16 : 0.08,
        )}`,
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ flexShrink: 0 }}>
        <Box sx={{ display: "flex" }}>{SpannedLogoMark}</Box>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            letterSpacing: 0.3,
            display: { xs: "none", sm: "block" },
          }}
        >
          Spanned Drive
        </Typography>
      </Stack>

      <Box sx={{ flex: 1 }} />

      <Stack direction="row" spacing={1} alignItems="center">
        <Tooltip title="Account">
          <IconButton
            onClick={(event) => setMenuAnchor(event.currentTarget)}
            sx={{
              p: 0.25,
              border: `1px solid ${alpha(theme.palette.primary.main, isDark ? 0.32 : 0.18)}`,
              borderRadius: 999,
            }}
            aria-label="Open account menu"
          >
            <Avatar
              sx={{
                width: 34,
                height: 34,
                bgcolor: alpha(theme.palette.primary.main, 0.18),
                color: theme.palette.primary.main,
                fontWeight: 700,
                fontSize: "0.95rem",
              }}
            >
              {initials}
            </Avatar>
          </IconButton>
        </Tooltip>
      </Stack>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              minWidth: 220,
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.primary.main, isDark ? 0.18 : 0.1)}`,
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ letterSpacing: 0.5, textTransform: "uppercase", fontWeight: 700 }}
          >
            Signed in as
          </Typography>
          <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700 }}>
            {session.primaryDrive?.email || "Unknown"}
          </Typography>
        </Box>
        <Divider />
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            session.logoutPrimaryDrive();
            navigate("/signin");
          }}
        >
          Sign out
        </MenuItem>
      </Menu>
    </Box>
  );
}

function DesktopSidebar({
  selectedTab,
  onSelect,
}: {
  selectedTab: HomeTab;
  onSelect: (tab: HomeTab) => void;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      component="nav"
      aria-label="Primary"
      sx={{
        flexShrink: 0,
        width: SIDEBAR_WIDTH,
        py: 3,
        px: 2,
        borderRight: `1px solid ${alpha(
          theme.palette.primary.main,
          isDark ? 0.16 : 0.08,
        )}`,
      }}
    >
      <Stack spacing={0.75}>
        {NAV_ITEMS.map((item) => {
          const active = item.id === selectedTab;
          return (
            <Box
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(item.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(item.id);
                }
              }}
              sx={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: 1.75,
                py: 1.25,
                borderRadius: 999,
                cursor: "pointer",
                color: active ? theme.palette.primary.main : "text.primary",
                bgcolor: active
                  ? alpha(theme.palette.primary.main, isDark ? 0.18 : 0.1)
                  : "transparent",
                border: `1.5px solid ${
                  active
                    ? alpha(theme.palette.primary.main, 0.32)
                    : "transparent"
                }`,
                transition:
                  "background 200ms ease, transform 160ms ease, border-color 200ms ease",
                "&:hover": {
                  bgcolor: alpha(
                    theme.palette.primary.main,
                    isDark ? 0.12 : 0.06,
                  ),
                },
                "&:focus-visible": {
                  outline: "none",
                  borderColor: theme.palette.primary.main,
                  boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.32)}`,
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 28,
                  color: "inherit",
                }}
              >
                {item.icon}
              </Box>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: active ? 800 : 600,
                  color: "inherit",
                }}
              >
                {item.label}
              </Typography>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}

function MobileBottomNav({
  selectedTab,
  onSelect,
}: {
  selectedTab: HomeTab;
  onSelect: (tab: HomeTab) => void;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Paper
      elevation={8}
      sx={{
        position: "fixed",
        left: 12,
        right: 12,
        bottom: 12,
        zIndex: 10,
        borderRadius: 999,
        px: 1,
        py: 0.75,
        bgcolor: isDark
          ? alpha(theme.palette.background.paper, 0.9)
          : alpha(theme.palette.background.paper, 0.96),
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: `1px solid ${alpha(
          theme.palette.primary.main,
          isDark ? 0.22 : 0.14,
        )}`,
      }}
    >
      <Stack direction="row" justifyContent="space-around" alignItems="center">
        {NAV_ITEMS.map((item) => {
          const active = item.id === selectedTab;
          return (
            <Box
              key={item.id}
              role="button"
              tabIndex={0}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              onClick={() => onSelect(item.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(item.id);
                }
              }}
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                py: 0.5,
                cursor: "pointer",
                color: active ? theme.palette.primary.main : "text.secondary",
                transition: "color 200ms ease",
                userSelect: "none",
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 32,
                  borderRadius: 999,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: active
                    ? alpha(theme.palette.primary.main, isDark ? 0.22 : 0.14)
                    : "transparent",
                  transition: "background 200ms ease",
                }}
              >
                {item.icon}
              </Box>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: active ? 800 : 600,
                  fontSize: "0.68rem",
                  mt: 0.25,
                  color: "inherit",
                }}
              >
                {item.label}
              </Typography>
            </Box>
          );
        })}
      </Stack>
    </Paper>
  );
}
