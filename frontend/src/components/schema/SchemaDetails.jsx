import { DEMO_TABLES } from '../../services/demoData.js';

export default function SchemaDetails({ tableName }) {
  const table = DEMO_TABLES[tableName] || DEMO_TABLES.orders;
  return <><h2 className="m">{tableName}</h2><p className="mute" style={{ margin: 0 }}>{table.rows}</p><h3>Columns</h3>
    {table.columns.map((column) => { const [name, target] = column.split('>'); const pk = name.endsWith('*'); return <div className="hx" key={column}><span className="m">{name.replace('*', '')}</span> {pk && <span className="chip ok">PK</span>} {target && <span className="chip role">FK → {target}</span>}</div>; })}
  </>;
}
