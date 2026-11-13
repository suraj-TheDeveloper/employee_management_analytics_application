// Drop empty values so we never send "?is_active=" (the backend would reject it with a 422)
export function cleanParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== "" && value !== null && value !== undefined)
  );
}