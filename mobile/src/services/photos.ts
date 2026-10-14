import { randomUUID } from "expo-crypto";
import Storage from "expo-sqlite/kv-store";
import { File, Paths } from "expo-file-system";

const CLIENT_ID_KEY = "client_id";

/**
 * Stable per-install identifier used by the server for fair-usage rate
 * limiting. Generated once and persisted so the user is not treated as a new
 * client on every launch.
 *
 * This is not authentication. It exists so the server can tell many users apart
 * without relying on IP addresses, which mobile carriers share between many
 * subscribers.
 */
export function getClientId(): string {
  const existing = Storage.getItemSync(CLIENT_ID_KEY);
  if (existing) return existing;

  const id = randomUUID();
  Storage.setItemSync(CLIENT_ID_KEY, id);
  return id;
}

export function savePhotoPermanently(tempUri: string): string {
  const source = new File(tempUri);
  const destination = new File(Paths.document, `${randomUUID()}.jpg`);
  source.copy(destination);
  return destination.uri;
}
