export const CUSTOM_ID_PREFIX = 'custom:'

export function isCustomPaperId(id: string): boolean {
  return id.startsWith(CUSTOM_ID_PREFIX)
}

export function makeCustomPaperId(): string {
  const unique =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `${CUSTOM_ID_PREFIX}${unique}`
}
