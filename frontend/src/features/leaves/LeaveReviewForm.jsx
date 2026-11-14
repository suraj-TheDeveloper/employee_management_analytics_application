import { useState } from "react";
import FormField from "../../components/FormField";
import ErrorMessage from "../../components/ErrorMessage";
import { leaveService } from "../../services/leaveService";
import { getErrorMessage } from "../../services/errors";
import { formatDate } from "../../utils/format";

export default function LeaveReviewForm({ leave, onSaved, onCancel }) {
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(null); // null | "Approved" | "Rejected"

  async function decide(decision) {
    if (comment.length > 500) {
      setCommentError("Comment must be at most 500 characters");
      return;
    }
    setCommentError("");
    setSubmitError("");
    setSubmitting(decision);
    try {
      await leaveService.review(leave.id, { decision, comment: comment.trim() || null });
      onSaved(`Leave request ${decision.toLowerCase()}`);
    } catch (error) {
      setSubmitError(getErrorMessage(error)); // e.g. already reviewed, or your own request
      setSubmitting(null);
    }
  }

  const summary = [
    ["Employee", `${leave.employee.first_name} ${leave.employee.last_name} (${leave.employee.employee_code})`],
    ["Type", leave.leave_type],
    ["Dates", `${formatDate(leave.start_date)} – ${formatDate(leave.end_date)} (${leave.days} day${leave.days === 1 ? "" : "s"})`],
    ["Reason", leave.reason || "—"],
  ];

  return (
    <div>
      <ErrorMessage message={submitError} />
      <dl className="details">
        {summary.map(([label, value]) => (
          <div key={label} className="details-row">
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <FormField
        id="comment"
        as="textarea"
        rows={3}
        label="Comment (optional)"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        error={commentError}
      />

      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={onCancel} disabled={Boolean(submitting)}>
          Cancel
        </button>
        <button className="btn btn-danger" onClick={() => decide("Rejected")} disabled={Boolean(submitting)}>
          {submitting === "Rejected" ? "Rejecting..." : "Reject"}
        </button>
        <button className="btn btn-primary" onClick={() => decide("Approved")} disabled={Boolean(submitting)}>
          {submitting === "Approved" ? "Approving..." : "Approve"}
        </button>
      </div>
    </div>
  );
}