type LimitParamOptions = {
  defaultValue: number;
  max: number;
  min?: number;
};

export function parseLimitParam(value: string | null, options: LimitParamOptions): number {
  const min = options.min ?? 1;
  const parsed = value ? Number.parseInt(value, 10) : Number.NaN;

  if (!Number.isFinite(parsed)) {
    return options.defaultValue;
  }

  return Math.min(options.max, Math.max(min, parsed));
}

export function parseBooleanParam(value: string | null, defaultValue: boolean): boolean {
  if (!value) {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "true" || normalized === "1") {
    return true;
  }

  if (normalized === "false" || normalized === "0") {
    return false;
  }

  return defaultValue;
}
