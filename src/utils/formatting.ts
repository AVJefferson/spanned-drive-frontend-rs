export function formatBytes(value?: number | null) {
  if (!value || value <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    units.length - 1,
  );
  const normalized = value / 1024 ** exponent;

  return `${normalized >= 10 ? normalized.toFixed(0) : normalized.toFixed(1)} ${units[exponent]}`;
}

export function formatPercent(value?: number | null) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "0%";
  }

  return `${Math.round(value)}%`;
}

export function formatDateTime(value?: number | string | null) {
  if (!value) {
    return "Unknown";
  }

  const date = typeof value === "number" ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
