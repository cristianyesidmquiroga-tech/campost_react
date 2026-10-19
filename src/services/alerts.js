import { api } from './http'

export const listAlerts = async (farmId) =>
  (await api.list(`fincas/${farmId}/alertas`)).map((a) => ({
    id: a.id,
    type: a.tipo,
    region: a.region_dane,
    title: a.titulo,
    summary: a.resumen ?? '',
    from: a.vigente_desde ?? '',
    until: a.vigente_hasta ?? '',
  }))

export async function registerAlertSource({ name, url }) {
  const j = await api.post('alertas/fuentes', { nombre: name, url })
  return { id: j.id, name: j.nombre, url: j.url }
}

export const syncAlertSource = async (id) => (await api.post(`alertas/fuentes/${id}/sincronizar`)) ?? []
