import Storage from "expo-sqlite/kv-store";
import { colorScheme, useUnstableNativeVariable } from "nativewind";
import { countNativeVariableRead } from "./store/themeProbe";

export type AppearancePreference = "light" | "dark";

const STORAGE_KEY = "appearance";
const DEFAULT_APPEARANCE: AppearancePreference = "light";

export function readStoredAppearance(): AppearancePreference {
  try {
    const value = Storage.getItemSync(STORAGE_KEY);
    return value === "dark" ? "dark" : DEFAULT_APPEARANCE;
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

export function applyStoredAppearance() {
  colorScheme.set(readStoredAppearance());
}

export function storeAppearance(value: AppearancePreference) {
  Storage.setItemSync(STORAGE_KEY, value);
  colorScheme.set(value);
}

export function isDarkPreferred(): boolean {
  return readStoredAppearance() === "dark";
}

export function useThemeColor(name: string, fallback: string): string {
  countNativeVariableRead();
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