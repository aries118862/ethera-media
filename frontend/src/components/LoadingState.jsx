export default function LoadingState({ label = 'Gathering stories' }) {
  return <div className="loading-state"><span className="loader" />{label}...</div>;
}
