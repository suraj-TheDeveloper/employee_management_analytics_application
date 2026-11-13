export default function Notice({ message }) {
  if (!message) return null;
  return (
    <div className="alert alert-success" role="status">
      {message}
    </div>
  );
}