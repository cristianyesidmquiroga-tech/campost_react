import { Sheet } from '../../components/ui'

function Block({ title, items }) {
  return (
    <div style={{ marginTop: 16 }}>
      <h3 className="label-md">{title}</h3>
      <ul style={{ margin: '6px 0 0', paddingLeft: 20, lineHeight: 1.5 }}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

export function PolicySheet({ policy, onClose }) {
  return (
    <Sheet title="Política de datos" subtitle={`Versión ${policy.version}`} onClose={onClose}>
      <Block title="Datos que usamos" items={policy.dataUsed} />
      <Block title="Para qué los usamos" items={policy.purposes} />
      <Block title="Sus derechos" items={policy.rights} />
    </Sheet>
  )
}
