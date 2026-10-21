import { useState } from 'react'
import { UserPlus, Users } from 'lucide-react'
import { SegmentedTabs } from '../../components/ui'
import { DetailPage } from '../../components/layout/Page'
import { UserCreate } from './UserCreate'
import { UserList } from './UserList'

export function UsersPage() {
  const [tab, setTab] = useState(0)
  return (
    <DetailPage title="Usuarios y roles" subtitle="Perfiles y cuentas nuevas">
      <SegmentedTabs labels={['Perfiles', 'Crear']} icons={[Users, UserPlus]} selected={tab} onSelect={setTab} />
      <div style={{ height: 12 }} />
      {tab === 0 ? <UserList /> : <UserCreate />}
    </DetailPage>
  )
}
