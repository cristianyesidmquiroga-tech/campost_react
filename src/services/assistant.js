import { api } from './http'

const toAnswer = (j) => ({
  understood: j.lo_que_entendi ?? '',
  causes: (j.causas_probables ?? []).map((c) => ({ id: c.problema_id, name: c.problema, match: c.coincidencia, why: c.por_que ?? '' })),
  actions: j.que_hacer ?? [],
  treatments: (j.tratamientos ?? []).map((t) => ({ problem: t.problema, product: t.producto_ica, description: t.descripcion ?? '' })),
  treatmentMessage: j.mensaje_tratamiento ?? '',
  callTechnician: j.cuando_llamar_al_tecnico ?? '',
  notice: j.aviso ?? '',
  hasInfo: j.hay_informacion === true,
})

const toConsultation = (j) => ({
  id: j.id,
  plantingId: j.contexto_id,
  createdAt: j.creado_en ?? '',
  question: j.pregunta ?? '',
  rating: j.valoracion ?? null,
  answer: j.respuesta ? toAnswer(j.respuesta) : null,
})

export const askAssistant = async (plantingId, text) => toConsultation(await api.post('consultas', { siembra_id: plantingId, texto: text }))

export const listConsultations = async (query) => (await api.list('consultas', { q: query, limit: 50 })).map(toConsultation)

export const getConsultation = async (id) => toConsultation(await api.get(`consultas/${id}`))

export const rateConsultation = (id, value, comment) => api.post(`consultas/${id}/retroalimentacion`, { valor: value, ...(comment ? { comentario: comment } : {}) })

export async function assistantQuality() {
  const j = await api.get('asistente/calidad')
  return {
    consultations: j.consultas ?? 0,
    rated: j.con_valoracion ?? 0,
    helpful: j.sirvieron ?? 0,
    notHelpful: j.no_sirvieron ?? 0,
    wrong: j.equivocadas ?? 0,
    percent: j.porcentaje_que_sirvio ?? null,
    notice: j.aviso ?? null,
  }
}

export const RATINGS = { sirvio: 'Me sirvió', no_sirvio: 'No me sirvió', equivocado: 'Estaba equivocado' }
