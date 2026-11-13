// Turns any Axios error into a message that is safe to show the user.
// Our backend always answers with { error: { code, message, details? } }.
export function getErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (error.code === "ERR_NETWORK") {
    return "Cannot reach the server. Check your connection and try again.";
  }
  if (error.code === "ECONNABORTED") {
    return "The request timed out. Please try again.";
  }

  const apiError = error.response?.data?.error;
  if (apiError?.message) {
    if (apiError.code === "validation_error" && Array.isArray(apiError.details) && apiError.details.length > 0) {
      const first = apiError.details[0];
      const field = first.loc?.slice(1).join(".");
      return field ? `${field}: ${first.msg}` : first.msg;
    }
    return apiError.message;
  }
  return fallback;
}

// Maps backend validation errors to form fields: { name: "message", ... }
export function getFieldErrors(error) {
  const apiError = error.response?.data?.error;
  if (apiError?.code !== "validation_error" || !Array.isArray(apiError.details)) {
    return {};
  }
  const fields = {};
  for (const detail of apiError.details) {
    const field = detail.loc?.[detail.loc.length - 1];
    if (typeof field === "string" && field !== "body" && !fields[field]) {
      fields[field] = detail.msg;
    }
  }
  return fields;
}