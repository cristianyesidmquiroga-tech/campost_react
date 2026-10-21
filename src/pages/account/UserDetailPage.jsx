import { Navigate, useParams } from 'react-router-dom'
import { CalendarDays, Clock, Mail, MapPin, Sprout, Wheat } from 'lucide-react'
import { useAsync } from '../../hooks/useAsync'
import { getUser } from '../../services/admin'
import { Card, EmptyState, InfoList, InfoRow, KpiGrid, KpiTile, ListRow, Loadable, RowGroup, SectionTitle, SkeletonList, StatusPill } from '../../components/ui'
import { DetailPage } from '../../components/layout/Page'
import { ROLE_LABELS } from '../../lib/access'
import { zoneName } from '../../lib/dane'
import { formatCop, formatDate, formatHa, formatNumber } from '../../lib/format'

export function UserDetailPage() {
  const { id } = useParams()
  const state = useAsync(() => getUser(id), [id])
  return (
    <DetailPage title="Perfil de usuario" subtitle="Cuenta, fincas y movimiento">
      <Loadable state={state} skeleton={<SkeletonList height={120} />}>
        {(user) => {
          if (!user) return <Navigate to="/mas/usuarios" replace />
          return (
            <>
              <Card>
                <div className="row gap-12">
                  <span className="grow"><h2 className="headline-md">{user.name}</h2></span>
                  <StatusPill tone={user.active ? 'ok' : 'neutral'}>{user.active ? ROLE_LABELS[user.role] ?? user.role : 'Inactivo'}</StatusPill>
                </div>
                <InfoList>
                  <InfoRow icon={Mail} label="Correo" value={user.email} />
                  <InfoRow icon={CalendarDays} label="Creado" value={formatDate(user.createdAt)} />
                  <InfoRow icon={Clock} label="Último acceso" value={user.lastAccess ? formatDate(user.lastAccess) : 'Nunca ha entrado'} />
                  {user.blocked && <InfoRow label="Estado" value="Bloqueado por intentos fallidos" />}
                </InfoList>
              </Card>
              <SectionTitle>Su movimiento</SectionTitle>
              <KpiGrid cols={2} colsWide={4}>
                <KpiTile label="Fincas" value={formatNumber(user.farms)} icon={MapPin} caption="asignadas" />
                <KpiTile label="Siembras" value={formatNumber(user.plantings)} icon={Sprout} caption="registradas" />
                <KpiTile label="Cosechas" value={formatNumber(user.harvests)} icon={Wheat} caption="registradas" />
                <KpiTile label="Utilidad" value={formatCop(user.income - user.expenses)} icon={Wheat} tone={user.income >= user.expenses ? 'ok' : 'danger'} caption="ingresos menos gastos" />
              </KpiGrid>
              <SectionTitle>Fincas</SectionTitle>
              {user.farmDetails.length === 0 ? (
                <Card><EmptyState icon={MapPin} title="Sin fincas" message="Este usuario todavía no tiene fincas asignadas." /></Card>
              ) : (
                <RowGroup>
                  {user.farmDetails.map((f) => (
                    <ListRow
                      key={f.id}
                      icon={MapPin}
                      title={f.name}
                      titleLines={2}
                      subtitle={`${zoneName(f.zone)} · ${formatHa(f.areaHa)} · ${formatNumber(f.plantings)} siembras · ${formatNumber(f.harvests)} cosechas · gastos ${formatCop(f.expenses)} · ingresos ${formatCop(f.income)}`}
                    />
                  ))}
                </RowGroup>
              )}
            </>
          )
        }}
      </Loadable>
    </DetailPage>
  )
}
