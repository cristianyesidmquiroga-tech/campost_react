import { api } from './http'

const toNotice = (j) => ({
  plantingId: j.siembra_id ?? '',
  crop: j.cultivo ?? '',
  phase: j.fase ?? '',
  risk: j.riesgo ?? '',
  susceptibility: j.susceptibilidad ?? '',
  text: j.texto ?? '',
  measures: j.medidas ?? null,
  toValidate: j.por_validar === true,
})

export async function homeOverview() {
  const j = await api.get('inicio')
  return {
    farms: j.fincas ?? 0,
    activePlantings: j.siembras_en_curso ?? 0,
    plannedPlantings: j.siembras_planeadas ?? 0,
    notices: (j.avisos ?? []).map(toNotice),
    recentEvents: (j.eventos_recientes ?? []).map((e) => ({
      id: e.id,
      risk: e.riesgo ?? '',
      severity: e.severidad ?? '',
      start: e.inicio ?? '',
    })),
    firstSteps: j.primeros_pasos ?? [],
  }
}
