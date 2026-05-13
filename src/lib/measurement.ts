export const MEASUREMENT_UNIT_OPTIONS = ['g', 'ml', 'unidade'] as const;

type UnitCategory = 'mass' | 'volume' | 'count' | 'other';

export const normalizeMeasurementUnit = (unit?: string) => {
  if (!unit) return '';

  const trimmed = unit.trim();
  const lower = trimmed.toLowerCase();

  if (lower === 'l') return 'L';
  if (lower === 'kg') return 'kg';
  if (lower === 'g') return 'g';
  if (lower === 'ml') return 'ml';
  if (lower === 'unidade' || lower === 'unidades') return 'unidade';

  return trimmed;
};

const getUnitCategory = (unit: string): UnitCategory => {
  const normalized = normalizeMeasurementUnit(unit);

  if (normalized === 'g' || normalized === 'kg') return 'mass';
  if (normalized === 'ml' || normalized === 'L') return 'volume';
  if (normalized === 'unidade') return 'count';
  return 'other';
};

export const convertMeasurementQuantity = (
  quantity: number,
  fromUnit: string,
  toUnit: string
) => {
  const normalizedFromUnit = normalizeMeasurementUnit(fromUnit);
  const normalizedToUnit = normalizeMeasurementUnit(toUnit);

  if (normalizedFromUnit === normalizedToUnit) {
    return quantity;
  }

  const fromCategory = getUnitCategory(normalizedFromUnit);
  const toCategory = getUnitCategory(normalizedToUnit);

  if (fromCategory !== toCategory) {
    return null;
  }

  if (fromCategory === 'mass') {
    if (normalizedFromUnit === 'g' && normalizedToUnit === 'kg') return quantity / 1000;
    if (normalizedFromUnit === 'kg' && normalizedToUnit === 'g') return quantity * 1000;
    return null;
  }

  if (fromCategory === 'volume') {
    if (normalizedFromUnit === 'ml' && normalizedToUnit === 'L') return quantity / 1000;
    if (normalizedFromUnit === 'L' && normalizedToUnit === 'ml') return quantity * 1000;
    return null;
  }

  if (fromCategory === 'count') {
    return normalizedToUnit === 'unidade' ? quantity : null;
  }

  return null;
};
