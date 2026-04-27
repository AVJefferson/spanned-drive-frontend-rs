import { useEffect, useRef } from "react";
import type { NavigateFunction, SetURLSearchParams } from "react-router-dom";

import type { LogicalFolder } from "../../contexts/LogicalFolderTypes";

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

interface HomePathSyncOptions {
  isReady: boolean;
  locationSearch: string;
  hasPrimaryDrive: boolean;
  logicalFolders: LogicalFolder[];
  selectedLogicalFolderId: string | null;
  currentParentId: string | null;
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
  navigate: NavigateFunction;
  getLogicalFolder: (logicalFolderId: string) => LogicalFolder | undefined;
  openLogicalFolderPath: (
    logicalFolderId: string | null,
    parentId: string | null,
  ) => void;
  resetSelection: () => void;
}

export function useHomePathSync({
  isReady,
  locationSearch,
  hasPrimaryDrive,
  logicalFolders,
  selectedLogicalFolderId,
  currentParentId,
  searchParams,
  setSearchParams,
  navigate,
  getLogicalFolder,
  openLogicalFolderPath,
  resetSelection,
}: HomePathSyncOptions) {
  const applyingPathRef = useRef(false);

  useEffect(() => {
    if (!hasPrimaryDrive) {
      if (locationSearch) {
        sessionStorage.setItem(HOME_PATH_SESSION_KEY, locationSearch);
      }
      navigate("/signin");
    }
  }, [hasPrimaryDrive, locationSearch, navigate]);

  useEffect(() => {
    if (!hasPrimaryDrive || !isReady) {
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
  }, [hasPrimaryDrive, isReady, searchParams, setSearchParams]);

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
      openLogicalFolderPath(null, null);
      resetSelection();
      applyingPathRef.current = false;
      return;
    }

    let pointerParentId: string | null = null;
    const childPath = pathParts.slice(1);
    const foldersByParentId = new Map<string | null, { id: string; name: string }[]>();
    (targetLogicalFolder.items || []).forEach((entry) => {
      if (entry.kind !== "folder") {
        return;
      }
      const bucket = foldersByParentId.get(entry.parentId) || [];
      bucket.push({ id: entry.id, name: entry.name });
      foldersByParentId.set(entry.parentId, bucket);
    });

    for (const segment of childPath) {
      const childFolder:any = (foldersByParentId.get(pointerParentId) || []).find(
        (entry) => entry.name === segment,
      );
      if (!childFolder) {
        break;
      }
      pointerParentId = childFolder.id;
    }

    openLogicalFolderPath(targetLogicalFolder.id, pointerParentId);
    resetSelection();
    applyingPathRef.current = false;
  }, [isReady, logicalFolders, openLogicalFolderPath, resetSelection, searchParams]);

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
    const entriesById = new Map(logicalFolder.items.map((entry) => [entry.id, entry] as const));
    let pointer = currentParentId ? entriesById.get(currentParentId) : undefined;
    const segments: string[] = [];
    while (pointer) {
      segments.unshift(pointer.name);
      pointer = pointer.parentId ? entriesById.get(pointer.parentId) : undefined;
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
}
