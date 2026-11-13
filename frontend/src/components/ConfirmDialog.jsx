import { useState } from "react";
import Modal from "./Modal";
import ErrorMessage from "./ErrorMessage";
import { getErrorMessage } from "../services/errors";

// onConfirm must return a promise. If it rejects, the error shows inside the dialog.
export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  danger = false,
  onConfirm,
  onCancel,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    setBusy(true);
    setError("");
    try {
      await onConfirm();
    } catch (err) {
      setError(getErrorMessage(err));
      setBusy(false);
    }
  }

  return (
    <Modal title={title} onClose={onCancel}>
      <p>{message}</p>
      <ErrorMessage message={error} />
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button
          className={`btn ${danger ? "btn-danger" : "btn-primary"}`}
          onClick={handleConfirm}
          disabled={busy}
        >
          {busy ? "Please wait..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}