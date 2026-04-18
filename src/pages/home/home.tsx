import {
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Button,
  Dialog,
  DialogContent,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { useLogicalFolders } from "../../contexts/LogicalFolders";
import type { LogicalEntry } from "../../contexts/LogicalFolderTypes";
import { useRuntime } from "../../contexts/RuntimeContext";
import { useSession } from "../../contexts/SessionContext";
import { useTasksActions } from "../../contexts/TasksContext";
import { chooseDownloadDirectory, supportsNativeDownloadDestination } from "../../services/runtime/downloads";
import { createDriveKey, createId } from "../../utils/ids";
import { ErrorBoundary } from "../../components/ErrorBoundary";
import { fetchLogicalFolderListing } from "../../services/drive-manager/listing";

import {
  CreateLogicalFolderDialog,
  DeleteLogicalFolderDialog,
  DestinationDialog,
} from "./home-dialogs";
import { HomeExplorer } from "./home-explorer";
import {
  InfoTab,
  LogicalFolderInfoTab,
  SettingsTab,
  DrivesTab,
  TasksTab,
} from "./right-pane-tabs";

function FolderTabIcon() {
  return "▣";
}

function DrivesTabIcon() {
  return "◫";
}

function TasksTabIcon() {
  return "✓";
}

function SettingsTabIcon() {
  return "◌";
}

function InfoTabIcon() {
  return "i";
}

const HOME_PATH_SESSION_KEY = "sdrive.home.path";

function encodePathSegment(value: string) {
  return encodeURIComponent(value);
}

function decodePathSegment(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

const HomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const {
    session,
    setDriveUsageLimit,
    refreshAllDriveDetails,
    knownSecondaryAccounts,
    disconnectSecondaryDrive,
    forgetKnownSecondaryAccount,
  } = useSession();
  const {
    logicalFolders,
    isReady,
    createLogicalFolder,
    replaceLogicalFolder,
    getLogicalFolder,
    deleteLogicalFolder,
    updateLogicalFolderSettings,
  } = useLogicalFolders();
  const runtime = useRuntime();
  const { enqueueUpload, enqueueDelete, enqueueCopy, enqueueMove, enqueueDownload } =
    useTasksActions();

  const [selectedLogicalFolderId, setSelectedLogicalFolderId] = useState<string | null>(
    null,
  );
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);
  const [selectionAnchorId, setSelectionAnchorId] = useState<string | null>(null);
  const [selectedDesktopTab, setSelectedDesktopTab] = useState(0);
  const [selectedMobileTab, setSelectedMobileTab] = useState("folders");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [selectedDriveKeys, setSelectedDriveKeys] = useState<string[]>([]);
  const [createError, setCreateError] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [uploadAnchorEl, setUploadAnchorEl] = useState<HTMLElement | null>(null);
  const [copyMoveMode, setCopyMoveMode] = useState<"copy" | "move" | null>(null);
  const [destinationParentId, setDestinationParentId] = useState<string | null>(null);
  const [mobileInfoOpen, setMobileInfoOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteMode, setDeleteMode] = useState<"forget" | "delete-all">("forget");
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [isDeletingLogicalDrive, setIsDeletingLogicalDrive] = useState(false);
  const [deleteLogicalDriveError, setDeleteLogicalDriveError] = useState("");
  const [isRefreshingListing, setIsRefreshingListing] = useState(false);
  const [listingPageToken, setListingPageToken] = useState<string | undefined>(
    undefined,
  );
  const [listingNextPageToken, setListingNextPageToken] = useState<
    string | undefined
  >(undefined);
  const [listingHasMore, setListingHasMore] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const refreshedDriveSetRef = useRef<string | null>(null);
  const applyingPathRef = useRef(false);

  useEffect(() => {
    folderInputRef.current?.setAttribute("webkitdirectory", "");
    folderInputRef.current?.setAttribute("directory", "");
  }, []);

  useEffect(() => {
    if (!session.primaryDrive) {
      if (location.search) {
        sessionStorage.setItem(HOME_PATH_SESSION_KEY, location.search);
      }
      navigate("/signin");
    }
  }, [location.search, navigate, session.primaryDrive]);

  useEffect(() => {
    const driveSetSignature = [
      ...(session.primaryDrive
        ? [createDriveKey(session.primaryDrive.provider, session.primaryDrive.email)]
        : []),
      ...session.secondaryDrives.map((drive) =>
        createDriveKey(drive.provider, drive.email),
      ),
    ]
      .sort()
      .join("|");

    if (!driveSetSignature || refreshedDriveSetRef.current === driveSetSignature) {
      return;
    }

    refreshedDriveSetRef.current = driveSetSignature;
    void refreshAllDriveDetails();
  }, [refreshAllDriveDetails, session.primaryDrive, session.secondaryDrives]);

  const activeLogicalFolder = selectedLogicalFolderId
    ? getLogicalFolder(selectedLogicalFolderId)
    : undefined;
  const isLogicalDriveLocked = activeLogicalFolder?.status === "partially_deleted";
  const activeLogicalFolderItems = activeLogicalFolder?.items || [];
  const visibleEntries = useMemo(
    () =>
      activeLogicalFolderItems.filter(
        (entry) => entry.parentId === currentParentId,
      ),
    [activeLogicalFolderItems, currentParentId],
  );
  const selectedEntry = selectedEntryIds.length === 1
    ? activeLogicalFolderItems.find((entry) => entry.id === selectedEntryIds[0])
    : undefined;

  const allAvailableDrives = useMemo(
    () => [
      ...(session.primaryDrive ? [session.primaryDrive] : []),
      ...session.secondaryDrives,
    ],
    [session.primaryDrive, session.secondaryDrives],
  );

  const getDriveByKey = useCallback(
    (driveKey: string) =>
      allAvailableDrives.find(
        (drive) => createDriveKey(drive.provider, drive.email) === driveKey,
      ),
    [allAvailableDrives],
  );

  const breadcrumbs = useMemo(() => {
    if (!activeLogicalFolder || !currentParentId) {
      return [];
    }

    const items: LogicalEntry[] = [];
    let pointer = activeLogicalFolderItems.find((entry) => entry.id === currentParentId);
    while (pointer) {
      items.unshift(pointer);
      pointer = pointer.parentId
        ? activeLogicalFolderItems.find((entry) => entry.id === pointer?.parentId)
        : undefined;
    }

    return items;
  }, [activeLogicalFolder, activeLogicalFolderItems, currentParentId]);

  useEffect(() => {
    if (!session.primaryDrive || !isReady) {
      return;
    }

    if (searchParams.get("path")) {
      return;
    }

    const rememberedSearch = sessionStorage.getItem(HOME_PATH_SESSION_KEY);
    if (!rememberedSearch?.startsWith("?")) {
      return;
    }

    const rememberedParams = new URLSearchParams(rememberedSearch.slice(1));
    const rememberedPath = rememberedParams.get("path");
    if (!rememberedPath) {
      sessionStorage.removeItem(HOME_PATH_SESSION_KEY);
      return;
    }

    applyingPathRef.current = true;
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("path", rememberedPath);
      return next;
    });
    sessionStorage.removeItem(HOME_PATH_SESSION_KEY);
  }, [isReady, searchParams, session.primaryDrive, setSearchParams]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const rawPath = searchParams.get("path");
    if (!rawPath) {
      return;
    }

    const pathParts = rawPath
      .split("/")
      .map((segment) => decodePathSegment(segment).trim())
      .filter(Boolean);
    if (pathParts.length === 0) {
      return;
    }

    const driveName = pathParts[0];
    const targetLogicalFolder = logicalFolders.find(
      (folder) => folder.name === driveName,
    );

    if (!targetLogicalFolder) {
      setSelectedLogicalFolderId(null);
      setCurrentParentId(null);
      setSelectedEntryIds([]);
      applyingPathRef.current = false;
      return;
    }

    let pointerParentId: string | null = null;
    const childPath = pathParts.slice(1);
    for (const segment of childPath) {
      const childFolder = (targetLogicalFolder.items || []).find(
        (entry) =>
          entry.kind === "folder" &&
          entry.parentId === pointerParentId &&
          entry.name === segment,
      );
      if (!childFolder) {
        break;
      }
      pointerParentId = childFolder.id;
    }

    setSelectedLogicalFolderId(targetLogicalFolder.id);
    setCurrentParentId(pointerParentId);
    setSelectedEntryIds([]);
    setSelectionAnchorId(null);
    applyingPathRef.current = false;
  }, [isReady, logicalFolders, searchParams]);

  useEffect(() => {
    if (!isReady || applyingPathRef.current) {
      return;
    }

    const currentPath = searchParams.get("path") || "";
    if (!selectedLogicalFolderId) {
      if (currentPath) {
        setSearchParams((current) => {
          const next = new URLSearchParams(current);
          next.delete("path");
          return next;
        });
      }
      return;
    }

    const logicalFolder = getLogicalFolder(selectedLogicalFolderId);
    if (!logicalFolder) {
      return;
    }

    const folderPathNames = [logicalFolder.name];
    let pointer = currentParentId
      ? logicalFolder.items.find((entry) => entry.id === currentParentId)
      : undefined;
    const segments: string[] = [];
    while (pointer) {
      segments.unshift(pointer.name);
      pointer = pointer.parentId
        ? logicalFolder.items.find((entry) => entry.id === pointer?.parentId)
        : undefined;
    }
    folderPathNames.push(...segments);
    const nextPath = folderPathNames.map(encodePathSegment).join("/");
    if (nextPath === currentPath) {
      return;
    }

    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("path", nextPath);
      return next;
    });
  }, [
    currentParentId,
    getLogicalFolder,
    isReady,
    searchParams,
    selectedLogicalFolderId,
    setSearchParams,
  ]);

  const destinationOptions = useMemo(
    () => {
      const folderOptions = activeLogicalFolderItems
        .filter(
          (entry) =>
            entry.kind === "folder" && !selectedEntryIds.includes(entry.id),
        )
        .map((entry) => ({
          id: entry.id,
          label: entry.name,
        }));

      return [
        {
          id: null,
          label: activeLogicalFolder ? `${activeLogicalFolder.name} /` : "Root",
        },
        ...folderOptions,
      ];
    },
    [activeLogicalFolder, activeLogicalFolderItems, selectedEntryIds],
  );

  const activeLogicalFolderId = activeLogicalFolder?.id;

  useEffect(() => {
    setListingPageToken(undefined);
    setListingNextPageToken(undefined);
    setListingHasMore(false);
  }, [activeLogicalFolderId, currentParentId]);

  useEffect(() => {
    if (!activeLogicalFolderId || !isReady) {
      return;
    }

    const folderAtStart = getLogicalFolder(activeLogicalFolderId);
    if (!folderAtStart) {
      return;
    }

    let cancelled = false;
    setIsRefreshingListing(true);
    void fetchLogicalFolderListing({
      logicalFolder: folderAtStart,
      parentId: currentParentId,
      pageToken: listingPageToken,
      pageSize: 100,
      settings: folderAtStart.listing!,
      getDriveByKey,
    })
      .then((result) => {
        if (cancelled) {
          return;
        }

        replaceLogicalFolder(activeLogicalFolderId, (folder) => {
          const existingChildren = (folder.items || []).filter(
            (entry) => entry.parentId === currentParentId,
          );

          const keyedByProviderItemId = new Map(
            existingChildren
              .filter((entry) => (entry.placements || []).length > 0)
              .map((entry) => [
                `${entry.placements[0].driveKey}::${entry.placements[0].itemId}`,
                entry,
              ]),
          );
          const keyedByName = new Map(
            existingChildren.map((entry) => [
              `${entry.name}::${entry.kind}`,
              entry,
            ]),
          );

          const refreshedChildren = result.mergedEntries.map((entry) => {
            const providerPlacement = entry.placements?.[0];
            const providerKey = providerPlacement
              ? `${providerPlacement.driveKey}::${providerPlacement.itemId}`
              : "";
            const existingByProvider = providerKey
              ? keyedByProviderItemId.get(providerKey)
              : undefined;
            const existing =
              existingByProvider || keyedByName.get(`${entry.name}::${entry.kind}`);
            return {
              ...entry,
              id: existing?.id || createId("logical-entry"),
              createdAt: existing?.createdAt || Date.now(),
            };
          });

          const signatureOf = (entries: typeof refreshedChildren) =>
            entries
              .map(
                (entry) =>
                  `${entry.id}|${entry.name}|${entry.kind}|${entry.size}|${entry.updatedAt}|${entry.corrupted ? 1 : 0}|${entry.duplicateCandidate ? 1 : 0}`,
              )
              .sort()
              .join("\n");
          const existingSignature = signatureOf(existingChildren);
          const refreshedSignature = signatureOf(refreshedChildren);

          if (!listingPageToken && existingSignature === refreshedSignature) {
            return folder;
          }

          const retained = (folder.items || []).filter((entry) => {
            if (entry.parentId !== currentParentId) {
              return true;
            }
            if (listingPageToken) {
              return true;
            }
            return false;
          });

          const appendedChildren = listingPageToken
            ? [
                ...existingChildren,
                ...refreshedChildren.filter(
                  (entry) =>
                    !existingChildren.some((existing) => {
                      const existingPlacement = existing.placements?.[0];
                      const entryPlacement = entry.placements?.[0];
                      if (
                        existingPlacement &&
                        entryPlacement &&
                        existingPlacement.driveKey === entryPlacement.driveKey &&
                        existingPlacement.itemId === entryPlacement.itemId
                      ) {
                        return true;
                      }
                      return (
                        existing.name === entry.name &&
                        existing.kind === entry.kind
                      );
                    }),
                ),
              ]
            : refreshedChildren;

          return {
            ...folder,
            items: [...retained, ...appendedChildren],
          };
        });

        const nextToken =
          result.pages.length > 0
            ? result.pages[result.pages.length - 1].nextPageToken
            : undefined;
        setListingNextPageToken(nextToken);
        setListingHasMore(Boolean(nextToken));
      })
      .catch((error) => {
        console.warn("Unable to refresh live listing", error);
      })
      .finally(() => {
        if (!cancelled) {
          setIsRefreshingListing(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    activeLogicalFolderId,
    currentParentId,
    getDriveByKey,
    getLogicalFolder,
    isReady,
    listingPageToken,
    replaceLogicalFolder,
  ]);

  if (!session.primaryDrive) {
    return null;
  }

  const resetSelection = () => {
    setSelectedEntryIds([]);
    setSelectionAnchorId(null);
    setMobileInfoOpen(false);
  };

  const openLogicalFolder = (logicalFolderId: string) => {
    setSelectedLogicalFolderId(logicalFolderId);
    setCurrentParentId(null);
    resetSelection();
  };

  const openEntry = (entry: LogicalEntry, options?: { openFolder?: boolean }) => {
    if (entry.kind === "folder" && options?.openFolder) {
      setCurrentParentId(entry.id);
      resetSelection();
      return;
    }

    setSelectedEntryIds([entry.id]);
    setSelectionAnchorId(entry.id);
    setSelectedDesktopTab(1);
    if (isMobile) {
      setMobileInfoOpen(true);
    }
  };

  const openInfo = (entry: LogicalEntry) => {
    setSelectedEntryIds([entry.id]);
    setSelectionAnchorId(entry.id);
    setSelectedDesktopTab(1);
    if (isMobile) {
      setMobileInfoOpen(true);
    }
  };

  const handleCreateLogicalFolder = async () => {
    const drives = allAvailableDrives.filter((drive) =>
      selectedDriveKeys.includes(`${drive.provider}:${drive.email}`.toLowerCase()),
    );

    if (!createName.trim()) {
      setCreateError("A logical folder name is required.");
      return;
    }

    if (drives.length === 0) {
      setCreateError("Select at least one backend drive.");
      return;
    }

    setIsCreatingFolder(true);
    setCreateError("");
    try {
      const folder = await createLogicalFolder(createName.trim(), drives);
      openLogicalFolder(folder.id);
      setCreateDialogOpen(false);
    } catch (error) {
      setCreateError(
        error instanceof Error ? error.message : "Unable to create logical folder.",
      );
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleDeleteLogicalDrive = async () => {
    if (!activeLogicalFolder) {
      return;
    }

    setIsDeletingLogicalDrive(true);
    setDeleteLogicalDriveError("");
    try {
      const result = await deleteLogicalFolder(activeLogicalFolder.id, deleteMode);
      if (!result.success) {
        setDeleteLogicalDriveError(
          `Failed backends: ${result.failedBackends.join(", ")}. Retry delete-all or forget this logical drive.`,
        );
        return;
      }
      setDeleteDialogOpen(false);
      setDeleteConfirmName("");
      setSelectedLogicalFolderId(null);
      setCurrentParentId(null);
      setSelectedEntryIds([]);
      setSelectionAnchorId(null);
    } catch (error) {
      setDeleteLogicalDriveError(
        error instanceof Error ? error.message : "Unable to delete logical drive.",
      );
    } finally {
      setIsDeletingLogicalDrive(false);
    }
  };

  const enqueueSelectedUpload = (files: File[], source: "files" | "folder") => {
    if (!activeLogicalFolder || files.length === 0 || isLogicalDriveLocked) {
      return;
    }

    enqueueUpload(activeLogicalFolder.id, currentParentId, files, { source });
  };

  const toggleEntrySelection = (
    entry: LogicalEntry,
    options?: { additive?: boolean; range?: boolean },
  ) => {
    const entryIds = visibleEntries.map((item) => item.id);
    const targetIndex = entryIds.indexOf(entry.id);
    if (targetIndex < 0) {
      return;
    }

    const additive = Boolean(options?.additive);
    const range = Boolean(options?.range && selectionAnchorId);

    if (range && selectionAnchorId) {
      const anchorIndex = entryIds.indexOf(selectionAnchorId);
      const start = Math.min(anchorIndex, targetIndex);
      const end = Math.max(anchorIndex, targetIndex);
      const rangeIds = entryIds.slice(start, end + 1);
      setSelectedEntryIds((current) =>
        additive ? Array.from(new Set([...current, ...rangeIds])) : rangeIds,
      );
      return;
    }

    if (additive) {
      setSelectedEntryIds((current) =>
        current.includes(entry.id)
          ? current.filter((item) => item !== entry.id)
          : [...current, entry.id],
      );
    } else {
      setSelectedEntryIds([entry.id]);
    }
    setSelectionAnchorId(entry.id);
  };

  const downloadSelection = async (entryIds: string[]) => {
    if (!activeLogicalFolder || entryIds.length === 0) {
      return;
    }

    let destinationDirectory: string | null = null;
    if (runtime.kind === "tauri" && supportsNativeDownloadDestination()) {
      destinationDirectory = await chooseDownloadDirectory();
      if (!destinationDirectory) {
        return;
      }
    }

    enqueueDownload(activeLogicalFolder.id, entryIds, destinationDirectory);
  };

  const detailsPanel =
    selectedEntry && activeLogicalFolder ? (
      <InfoTab
        selectedEntry={selectedEntry}
        logicalFolder={activeLogicalFolder}
        onDelete={() => {
          if (isLogicalDriveLocked) {
            return;
          }
          if (window.confirm(`Delete ${selectedEntry.name}?`)) {
            enqueueDelete(activeLogicalFolder.id, selectedEntry.id);
            resetSelection();
          }
        }}
        onCopy={() => {
          if (isLogicalDriveLocked) {
            return;
          }
          setCopyMoveMode("copy");
          setDestinationParentId(currentParentId);
        }}
        onMove={() => {
          if (isLogicalDriveLocked) {
            return;
          }
          setCopyMoveMode("move");
          setDestinationParentId(currentParentId);
        }}
        onDownload={() => {
          void downloadSelection([selectedEntry.id]);
        }}
      />
    ) : activeLogicalFolder ? (
      <LogicalFolderInfoTab
        logicalFolder={activeLogicalFolder}
        onDeleteLogicalDrive={() => {
          setDeleteMode(activeLogicalFolder.status === "partially_deleted" ? "delete-all" : "forget");
          setDeleteConfirmName("");
          setDeleteLogicalDriveError("");
          setDeleteDialogOpen(true);
        }}
        onUpdateSettings={(next) => {
          updateLogicalFolderSettings(activeLogicalFolder.id, next);
        }}
      />
    ) : (
      <SettingsTab />
    );

  const explorerPanel = (
    <ErrorBoundary
      title="Explorer error"
      message="The file explorer failed to render. Retry this section or reload the app."
      variant="embedded"
    >
      <Paper sx={{ flex: 1, minHeight: 0, overflow: "auto", p: { xs: 2, md: 3 } }}>
        {!isReady ? (
          <Typography color="text.secondary">Loading your logical folders...</Typography>
        ) : (
          <HomeExplorer
            logicalFolders={logicalFolders}
            activeLogicalFolder={activeLogicalFolder}
            currentParentId={currentParentId}
            selectedEntryIds={selectedEntryIds}
            isRefreshingListing={isRefreshingListing}
            hasMoreEntries={listingHasMore}
            breadcrumbs={breadcrumbs}
            onOpenLogicalFolder={openLogicalFolder}
            onBackToRoot={() => {
              setSelectedLogicalFolderId(null);
              setCurrentParentId(null);
              resetSelection();
            }}
            onNavigateToFolder={(entryId) => {
              setCurrentParentId(entryId);
              resetSelection();
            }}
            onOpenEntry={openEntry}
            onToggleEntrySelection={toggleEntrySelection}
            onDownloadSelection={() => {
              void downloadSelection(selectedEntryIds);
            }}
            onOpenInfo={openInfo}
            onCreateLogicalFolder={() => {
              setCreateName("");
              setSelectedDriveKeys([]);
              setCreateError("");
              setCreateDialogOpen(true);
            }}
            onLoadMore={() => {
              if (listingNextPageToken && !isRefreshingListing) {
                setListingPageToken(listingNextPageToken);
              }
            }}
          />
        )}
      </Paper>
    </ErrorBoundary>
  );

  return (
    <Box sx={{ minHeight: "100dvh", display: "flex", flexDirection: "column", backgroundColor: "background.default" }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ px: { xs: 2, md: 3 }, py: 2 }}
      >
        <Box>
          <Typography variant="overline" color="text.secondary">
            Spanned Drive
          </Typography>
          <Typography variant="h5">Unified cloud storage</Typography>
        </Box>
        {selectedMobileTab === "folders" || !isMobile ? (
          <Button
            variant="contained"
            disabled={Boolean(isLogicalDriveLocked && selectedLogicalFolderId)}
            onClick={(event) => {
              if (!selectedLogicalFolderId) {
                setCreateName("");
                setSelectedDriveKeys([]);
                setCreateError("");
                setCreateDialogOpen(true);
                return;
              }

              setUploadAnchorEl(event.currentTarget);
            }}
          >
            + {selectedLogicalFolderId ? "Upload" : "New logical folder"}
          </Button>
        ) : null}
      </Stack>

      <input
        ref={fileInputRef}
        type="file"
        hidden
        multiple
        onChange={(event) => {
          enqueueSelectedUpload(Array.from(event.target.files || []), "files");
          event.target.value = "";
        }}
      />
      <input
        ref={folderInputRef}
        type="file"
        hidden
        multiple
        onChange={(event) => {
          enqueueSelectedUpload(Array.from(event.target.files || []), "folder");
          event.target.value = "";
        }}
      />

      <Menu
        anchorEl={uploadAnchorEl}
        open={Boolean(uploadAnchorEl)}
        onClose={() => setUploadAnchorEl(null)}
      >
        <MenuItem
          onClick={() => {
            setUploadAnchorEl(null);
            fileInputRef.current?.click();
          }}
        >
          Upload files
        </MenuItem>
        <MenuItem
          onClick={() => {
            setUploadAnchorEl(null);
            folderInputRef.current?.click();
          }}
        >
          Upload folder
        </MenuItem>
      </Menu>

      <Box sx={{ flex: 1,  minHeight: 0, px: { xs: 0, md: 3 }, pb: isMobile ? 10 : 3 }}>
        {isMobile ? (
          <Box sx={{ height: "100%" }}>
            {selectedMobileTab === "folders" ? explorerPanel : null}
            {selectedMobileTab === "drives" ? (
              <Paper sx={{ p: 2.5 }}>
                <DrivesTab
                  primaryDrive={session.primaryDrive}
                  secondaryDrives={session.secondaryDrives}
                  knownSecondaryAccounts={knownSecondaryAccounts}
                  onChangeUsageLimit={setDriveUsageLimit}
                  onDisconnectSecondaryDrive={disconnectSecondaryDrive}
                  onForgetRememberedSecondaryDrive={forgetKnownSecondaryAccount}
                />
              </Paper>
            ) : null}
            {selectedMobileTab === "tasks" ? (
              <Paper sx={{ p: 2.5 }}>
                <TasksTab />
              </Paper>
            ) : null}
            {selectedMobileTab === "settings" ? (
              <Paper sx={{ p: 2.5 }}>
                <SettingsTab />
              </Paper>
            ) : null}
          </Box>
        ) : (
          <Stack direction="row" spacing={2}>
            {explorerPanel}
            <Paper sx={{ width: 380, minWidth: 380, display: "flex", flexDirection: "column", height: "calc(100vh - 125px)"}}>
              <Tabs value={selectedDesktopTab} onChange={(_, value) => setSelectedDesktopTab(value)} variant="fullWidth">
                <Tab label={DrivesTabIcon()} />
                <Tab label={InfoTabIcon()} />
                <Tab label={TasksTabIcon()} />
              </Tabs>
              <Box sx={{ flex: 1, overflow: "auto", p: 2.5 }}>
                {selectedDesktopTab === 0 ? (
                  <DrivesTab
                    primaryDrive={session.primaryDrive}
                    secondaryDrives={session.secondaryDrives}
                    knownSecondaryAccounts={knownSecondaryAccounts}
                    onChangeUsageLimit={setDriveUsageLimit}
                    onDisconnectSecondaryDrive={disconnectSecondaryDrive}
                    onForgetRememberedSecondaryDrive={forgetKnownSecondaryAccount}
                  />
                ) : null}
                {selectedDesktopTab === 1 ? detailsPanel : null}
                {selectedDesktopTab === 2 ? <TasksTab /> : null}
              </Box>
            </Paper>
          </Stack>
        )}
      </Box>

      <CreateLogicalFolderDialog
        open={createDialogOpen}
        drives={allAvailableDrives}
        selectedDriveKeys={selectedDriveKeys}
        name={createName}
        error={createError}
        creating={isCreatingFolder}
        onClose={() => setCreateDialogOpen(false)}
        onNameChange={setCreateName}
        onToggleDrive={(driveKey) =>
          setSelectedDriveKeys((current) =>
            current.includes(driveKey)
              ? current.filter((item) => item !== driveKey)
              : [...current, driveKey],
          )
        }
        onCreate={handleCreateLogicalFolder}
      />

      <DestinationDialog
        open={Boolean(copyMoveMode && selectedEntry)}
        mode={copyMoveMode}
        options={destinationOptions}
        selectedDestinationId={destinationParentId}
        onClose={() => setCopyMoveMode(null)}
        onSelect={setDestinationParentId}
        onConfirm={() => {
          if (!activeLogicalFolder || !selectedEntry || !copyMoveMode) {
            return;
          }

          if (copyMoveMode === "copy") {
            enqueueCopy(activeLogicalFolder.id, selectedEntry.id, destinationParentId);
          } else {
            enqueueMove(activeLogicalFolder.id, selectedEntry.id, destinationParentId);
          }

          setCopyMoveMode(null);
          resetSelection();
        }}
      />

      <DeleteLogicalFolderDialog
        open={deleteDialogOpen && Boolean(activeLogicalFolder)}
        logicalFolderName={activeLogicalFolder?.name || ""}
        deleting={isDeletingLogicalDrive}
        failureMessage={deleteLogicalDriveError || undefined}
        mode={deleteMode}
        confirmName={deleteConfirmName}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeleteLogicalDriveError("");
        }}
        onModeChange={setDeleteMode}
        onConfirmNameChange={setDeleteConfirmName}
        onConfirm={handleDeleteLogicalDrive}
      />

      <Dialog
        open={mobileInfoOpen && Boolean(selectedEntry && activeLogicalFolder)}
        onClose={() => setMobileInfoOpen(false)}
        fullWidth
      >
        <DialogContent>
          {selectedEntry && activeLogicalFolder ? detailsPanel : null}
        </DialogContent>
      </Dialog>

      {isMobile ? (
        <Paper elevation={8} sx={{ position: "fixed", left: 12, right: 12, bottom: 12, borderRadius: 999, overflow: "hidden" }}>
          <BottomNavigation value={selectedMobileTab} onChange={(_, value) => setSelectedMobileTab(value)} showLabels>
            <BottomNavigationAction label="Folders" value="folders" icon={<span>{FolderTabIcon()}</span>} />
            <BottomNavigationAction label="Drives" value="drives" icon={<span>{DrivesTabIcon()}</span>} />
            <BottomNavigationAction label="Tasks" value="tasks" icon={<span>{TasksTabIcon()}</span>} />
            <BottomNavigationAction label="Settings" value="settings" icon={<span>{SettingsTabIcon()}</span>} />
          </BottomNavigation>
        </Paper>
      ) : null}
    </Box>
  );
};

export default HomePage;
