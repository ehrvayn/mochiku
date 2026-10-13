/**
 * TEMPORARY diagnostic for slow dark-mode toggles.
 *
 * Drop-in instrumentation that counts how many components re-render and how
 * many color subscriptions wake when the scheme flips. Delete once the cause
 * is fixed.
 *
 * Usage: call `beginThemeToggleProbe("library")` immediately before
 * `storeAppearance(...)`, and `endThemeToggleProbe()` after the UI settles.
 */

type Probe = {
  label: string;
  startedAt: number;
  categoryComputations: number;
  nativeVariableReads: number;
  schemeReads: number;
};

let active: Probe | null = null;
const results: {
  label: string;
  durationMs: number;
  categoryComputations: number;
  nativeVariableReads: number;
  schemeReads: number;
}[] = [];

export function beginThemeToggleProbe(label: string) {
  active = {
    label,
    startedAt: Date.now(),
    categoryComputations: 0,
    nativeVariableReads: 0,
    schemeReads: 0,
  };
}

/** Call after a delay long enough for the re-render cascade to finish. */
export function endThemeToggleProbe(settleMs = 600) {
  const probe = active;
  active = null;
  if (!probe) return;
  setTimeout(() => {
    results.push({
      label: probe.label,
      durationMs: Date.now() - probe.startedAt,
      categoryComputations: probe.categoryComputations,
      nativeVariableReads: probe.nativeVariableReads,
      schemeReads: probe.schemeReads,
    });
    // eslint-disable-next-line no-console
    console.log("[theme-probe]", JSON.stringify(results[results.length - 1]));
  }, settleMs);
}

/** Incremented by useCategoryColors so we can see per-card recomputation. */
export function countCategoryComputation() {
  if (active) active.categoryComputations += 1;
}

export function countNativeVariableRead() {
  if (active) active.nativeVariableReads += 1;
}

export function countSchemeRead() {
  if (active) active.schemeReads += 1;
}

export function resetThemeToggleProbe() {
  active = null;
  results.length = 0;
}