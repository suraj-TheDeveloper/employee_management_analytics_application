export default function LoadingState({ message = "Loading..." }) {
  return (
    <div className="loading-state" role="status">
      <div className="spinner" />
      <p>{message}</p>
    </div>
  );
}