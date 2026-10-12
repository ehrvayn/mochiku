import Storage from "expo-sqlite/kv-store";
import { colorScheme, useUnstableNativeVariable } from "nativewind";

export type AppearancePreference = "light" | "dark";

const STORAGE_KEY = "appearance";

export function readStoredAppearance(): AppearancePreference | null {
  try {
    const value = Storage.getItemSync(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

export function applyStoredAppearance() {
  colorScheme.set(readStoredAppearance() ?? "light");
}

export function storeAppearance(value: AppearancePreference) {
  Storage.setItemSync(STORAGE_KEY, value);
  colorScheme.set(value);
}

export function isDarkPreferred(): boolean {
  return readStoredAppearance() === "dark";
}

export function useThemeColor(name: string, fallback: string): string {
  const value: unknown = useUnstableNativeVariable(`--color-${name}`);
  if (Array.isArray(value)) {
    const parts = value.filter(
      (part) => part !== undefined && part !== null && part !== "",
    );
    if (parts.length) return `rgb(${parts.join(" ")})`;
    return fallback;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return `rgb(${value.trim()})`;
  }
  return fallback;
}