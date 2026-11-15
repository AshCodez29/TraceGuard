export default function OverviewCharts({ name = 'Northwind Labs', score = 72 }) {
  const offset = 289 * (1 - score / 100);
  return <div className="vis">
    <div className="gl health-card"><b>Health</b><svg className="ring" viewBox="0 0 120 120" width="110" role="img" aria-label={`Health score ${score} of 100`}>
      <defs><linearGradient id="scoreGradient"><stop offset="0" stopColor="#2EF2A8" /><stop offset="1" stopColor="#A66BFF" /></linearGradient></defs>
      <circle cx="60" cy="60" r="46" fill="none" stroke="var(--edge)" strokeWidth="10" />
      <circle cx="60" cy="60" r="46" fill="none" stroke="url(#scoreGradient)" strokeWidth="10" strokeLinecap="round" strokeDasharray="289" strokeDashoffset={offset} transform="rotate(-90 60 60)" />
      <text x="60" y="68" textAnchor="middle" style={{ fontSize: 26, fontWeight: 600 }}>{score}</text>
    </svg></div>
    <div className="gl chart-card"><b>Integrity score over scans · {name}</b><svg className="wv" viewBox="0 0 360 120" width="100%" height="110" preserveAspectRatio="none" role="img" aria-label="Integrity score history">
      <defs><linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2EF2A8" stopOpacity=".55" /><stop offset="1" stopColor="#A66BFF" stopOpacity=".05" /></linearGradient></defs>
      <path d="M0 95 C40 90 60 35 110 42 S190 95 240 55 S320 20 360 70 L360 120 L0 120Z" fill="url(#trendGradient)" />
      <path d="M0 95 C40 90 60 35 110 42 S190 95 240 55 S320 20 360 70" fill="none" stroke="#2EF2A8" strokeWidth="2.5" />
      <path d="M0 105 C60 100 100 70 160 80 S300 50 360 90" fill="none" stroke="#FF5FA8" strokeWidth="2" />
    </svg></div>
    <div className="gl chart-card"><b>Open issues by table</b><div className="bars" role="img" aria-label="Issues per table">{[55, 40, 4, 35, 90, 45, 5, 4].map((height, i) => <i key={i} style={{ height: `${height}%` }} />)}</div></div>
  </div>;
}
