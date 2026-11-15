export default function SeverityBadge({ severity }) {
  return <span className={`chip ${severity}`}>{severity.toLowerCase()}</span>;
}
