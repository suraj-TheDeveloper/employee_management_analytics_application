export default function FormField({ id, label, error, as: Control = "input", ...props }) {
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <Control
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}