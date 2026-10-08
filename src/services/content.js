import { api } from './http'

export const listGlossary = async () =>
  (await api.list('glosario')).map((t) => ({
    id: t.id,
    term: t.termino ?? '',
    explanation: t.explicacion ?? '',
    category: t.categoria ?? '',
  }))

export const listNews = async () =>
  (await api.list('noticias', { limit: 50 })).map((n) => ({
    id: n.id,
    title: n.titulo ?? '',
    summary: n.resumen ?? '',
    source: n.fuente ?? '',
    link: n.enlace ?? '',
    published: n.publicada ?? '',
    validUntil: n.vigente_hasta ?? '',
  }))

export const listKnowledge = async () =>
  (await api.list('conocimiento', { limit: 50 })).map((k) => ({
    id: k.id,
    name: k.nombre ?? '',
    type: k.tipo ?? '',
    state: k.estado ?? '',
  }))

export async function knowledgeDetail(id) {
  const j = await api.get(`conocimiento/${id}`)
  const texts = (list) => (list ?? []).map((s) => s.descripcion).filter(Boolean)
  return {
    id: j.id,
    name: j.nombre ?? '',
    type: j.tipo ?? '',
    state: j.estado ?? '',
    cause: j.causa ?? '',
    symptoms: texts(j.sintomas),
    handling: texts(j.manejos),
    notice: j.aviso ?? null,
  }
}

export const getPolicy = async () => {
  const j = await api.public('politica')
  return {
    version: j.version ?? '',
    dataUsed: j.datos_que_usamos ?? [],
    purposes: j.para_que ?? [],
    rights: j.sus_derechos ?? [],
  }
}

export async function getConsent() {
  try {
    const j = await api.get('cuenta/consentimiento')
    return { version: j.version_politica ?? '', acceptedAt: j.aceptado_en ?? '', aiTransfer: j.acepta_transferencia_ia === true }
  } catch (error) {
    if (error.code === 'CONSENTIMIENTO_PENDIENTE' || error.status === 404) return null
    throw error
  }
}

export const acceptConsent = (version, aiTransfer) =>
  api.post('cuenta/consentimiento', {
    version_politica: version,
    acepta_tratamiento: true,
    acepta_transferencia_ia: aiTransfer,
  })
