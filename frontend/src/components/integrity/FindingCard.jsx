import SeverityBadge from './SeverityBadge.jsx';

export default function FindingCard({ finding, selected, onClick }) {
  return <button className={`gl ic finding-card ${selected ? 'on' : ''}`} onClick={onClick}>
    <SeverityBadge severity={finding.severity} />
    <h2>{finding.type}</h2>
    <code>{finding.location}</code>
    <p className="mute finding-count">{finding.affected} affected</p>
  </button>;
}
