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
  }, settleMs);
}

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