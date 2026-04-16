export function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function createDriveKey(provider: string, email: string) {
  return `${provider}:${email}`.toLowerCase();
}
