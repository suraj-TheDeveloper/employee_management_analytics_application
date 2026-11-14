export const LEAVE_TYPES = ["Annual", "Sick", "Casual", "Unpaid"];
export const LEAVE_STATUSES = ["Pending", "Approved", "Rejected"];

// These mirror the backend rules (leave_service.py). The server is the real
// authority; the client copies exist only to give instant feedback.
export const MAX_BACKDATE_DAYS = 30;
export const MAX_LEAVE_DAYS = 60;