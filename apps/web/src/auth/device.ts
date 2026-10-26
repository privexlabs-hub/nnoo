// The device id is not a secret: it labels this browser's session family so the server can
// list and revoke it. Storage may be unavailable (private mode); the server then issues a new one.
const KEY = 'nnoo.deviceId';

export function readDeviceId(): string | undefined {
  try {
    return localStorage.getItem(KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

export function rememberDeviceId(id: string): void {
  try {
    localStorage.setItem(KEY, id);
  } catch {
    // ignore: a new device id next time is harmless
  }
}
