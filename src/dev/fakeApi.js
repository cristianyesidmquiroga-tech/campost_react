export const FARM_ID = 'f0000000-0000-4000-8000-000000000001'
export const LOT_ID = 'l0000000-0000-4000-8000-000000000001'
export const LOT_ID_2 = 'l0000000-0000-4000-8000-000000000002'
export const CROP_ID = 'c0000000-0000-4000-8000-000000000001'
export const CROP_ID_2 = 'c0000000-0000-4000-8000-000000000002'
export const PLANTING_ID = 's0000000-0000-4000-8000-000000000001'
export const CYCLE_ID = 'y0000000-0000-4000-8000-000000000001'
export const RISK_ID = 'r0000000-0000-4000-8000-000000000001'
export const EVENT_ID = 'e0000000-0000-4000-8000-000000000001'
export const PROCESS_ID = 'p0000000-0000-4000-8000-000000000001'
export const SUPPLY_ID = 'n0000000-0000-4000-8000-000000000001'
export const ROLES = ['admin', 'agricultor', 'contador', 'experto']

const perm = (metodo, ruta) => ({ grupo: 'x', metodo, ruta, resumen: 'x' })
const READS = [perm('GET', '/fincas/{finca_id}/jornales'), perm('GET', '/fincas/{finca_id}/insumos'), perm('GET', '/fincas/{finca_id}/procesos')]
const PERMISSIONS = {
  admin: [...READS, perm('GET', '/siembras'), perm('POST', '/siembras'), perm('GET', '/cultivos'), perm('GET', '/eventos-adversos'), perm('POST', '/usuarios')],
  agricultor: [...READS, perm('GET', '/siembras'), perm('POST', '/siembras'), perm('GET', '/cultivos'), perm('GET', '/eventos-adversos')],
  contador: [...READS, perm('GET', '/siembras')],
  experto: [],
}
const NAMES = { admin: 'Administrador local', agricultor: 'Hernando Gómez Restrepo', contador: 'Contadora de prueba', experto: 'Experto de prueba' }

const farm = (name = 'Finca La Esperanza') => ({ id: FARM_ID, nombre: name, departamento_dane: '05', municipio_dane: '05001', area_ha: '18.5000' })
const planting = (estado = 'en_curso') => ({ id: PLANTING_ID, finca_id: FARM_ID, lote_id: LOT_ID, cultivo_id: CROP_ID, metodo: 'semilla', area_ha: 4.5, plantas_sembradas: 18000, fecha_plan: '2026-08-01', estado })
const cycle = { id: CYCLE_ID, tipo: 'levante', numero: 1, estado: 'abierto', fecha_inicio: '2026-08-01', fecha_fin: null, motivo_perdida: null }
const page = (items) => ({ items, total: items.length, page: 1, size: 50, has_more: false })
const phase = (fase, orden, dias) => ({ fase, orden, dias_estimados: dias, por_validar: true })

const schedule = {
  ciclo_id: CYCLE_ID,
  tipo: 'levante',
  fecha_inicio: '2026-08-01',
  fases: [
    { ...phase('preparacion', 1, 30), inicio_plan: '2026-08-01', fin_plan: '2026-08-31', inicio_real: '2026-08-01', fin_real: '2026-08-30', dias_retraso: 0 },
    { ...phase('siembra', 2, 15), inicio_plan: '2026-08-31', fin_plan: '2026-09-15', inicio_real: '2026-08-31', fin_real: null, dias_retraso: 4 },
    { ...phase('mantenimiento', 3, 120), inicio_plan: '2026-09-15', fin_plan: '2027-01-13', inicio_real: null, fin_real: null, dias_retraso: null },
  ],
  aviso: null,
}

const gasto = (n, categoria, monto, estado = 'activo') => ({ id: `g1000000-0000-4000-8000-00000000000${n}`, finca_id: FARM_ID, categoria, monto, total: null, estado })

function routes(opts) {
  const { farms } = opts
  return {
    'GET politica': () => ({ version: '2026-09', estado: 'vigente', datos_que_usamos: ['Su nombre y correo, para identificarlo.'], para_que: ['Para operar la aplicación.'], sus_derechos: ['Conocer, actualizar y rectificar sus datos.'] }),
    'GET cuenta/consentimiento': () =>
      opts.consentAccepted
        ? { version_politica: '2026-09', aceptado_en: '2026-10-01T10:00:00', acepta_transferencia_ia: false }
        : [404, { error: { code: 'CONSENTIMIENTO_PENDIENTE', message: 'Aún no ha aceptado.' } }],
    'POST cuenta/consentimiento': () => {
      opts.consentAccepted = true
      return [201, {}]
    },
    'GET fincas': () => farms ?? [farm()],
    'POST fincas': () => [201, farm()],
    [`GET fincas/${FARM_ID}/lotes`]: () => [
      { id: LOT_ID, finca_id: FARM_ID, nombre: 'Lote 4B La Ceiba', area: '4.5000', notas: null },
      { id: LOT_ID_2, finca_id: FARM_ID, nombre: 'Lote 2 El Mirador', area: '3.2000', notas: null },
    ],
    [`POST fincas/${FARM_ID}/lotes`]: () => [201, {}],
    'GET inicio': () => ({
      fincas: 1,
      siembras_en_curso: 1,
      siembras_planeadas: 0,
      avisos: [{ siembra_id: PLANTING_ID, ciclo_id: CYCLE_ID, cultivo: 'Café', fase: 'siembra', riesgo: 'Helada', susceptibilidad: 'alta', medidas: 'Proteja las plantas jóvenes de la helada.', por_validar: true, texto: 'Su Café está en la fase de siembra. El riesgo de helada es alta en esta fase.' }],
      eventos_recientes: [{ id: EVENT_ID, riesgo: 'Helada', severidad: 'moderada', inicio: '2026-09-27' }],
      primeros_pasos: [],
    }),
    'GET siembras': () => page([planting()]),
    [`GET siembras/${PLANTING_ID}`]: () => ({ ...planting(), presupuesto: 15000000, ciclos: [cycle] }),
    [`GET siembras/${PLANTING_ID}/conteos`]: () => [{ id: 'k1', fecha: '2026-10-02', vivas: 17100, muertas: 900, resiembras: 0 }],
    [`POST siembras/${PLANTING_ID}/conteos`]: () => [201, {}],
    [`GET siembras/${PLANTING_ID}/indices`]: () => ({
      siembra_id: PLANTING_ID,
      fecha_conteo: '2026-10-02',
      indicadores: [
        { titulo: 'Plantas por hectárea', valor: 3800, unidad: 'plantas por hectárea', explicacion: 'Son las plantas vivas del último conteo divididas entre el área sembrada.', estado: 'informativo', que_hacer: null, fecha_datos: '2026-10-02' },
        { titulo: 'Plantas perdidas', valor: 5, unidad: 'por ciento', explicacion: 'De 18000 plantas sembradas hoy hay 17100 vivas.', estado: 'informativo', que_hacer: 'Si el número sube, revise la causa y considere resembrar.', fecha_datos: '2026-10-02' },
      ],
      aviso: null,
    }),
    [`GET ciclos/${CYCLE_ID}`]: () => cycle,
    [`GET ciclos/${CYCLE_ID}/cronograma`]: () => schedule,
    [`GET ciclos/${CYCLE_ID}/necesidad-insumos`]: () => ({ ciclo_id: CYCLE_ID, items: [], aviso: 'Falta cargar las dosis.' }),
    [`GET fincas/${FARM_ID}/actividades`]: () => [{ id: 'act-1', finca_id: FARM_ID, ciclo_id: CYCLE_ID, nombre: 'Socola y limpieza selectiva del lote', fase: 'preparacion', fecha_inicio: '2026-08-05', fecha_fin: null, area_trabajada: '4.5000', estado: 'en_curso' }],
    [`POST fincas/${FARM_ID}/actividades`]: () => [201, { id: 'act-1' }],
    [`POST fincas/${FARM_ID}/jornales`]: () => [201, {}],
    [`POST fincas/${FARM_ID}/cosechas`]: () => [201, {}],
    'GET cultivos': () => page([
      { id: CROP_ID, nombre: 'Café', grupo: 'plantación', tipo_ciclo: 'permanente', unidad_conteo: 'planta', por_validar: true },
      { id: CROP_ID_2, nombre: 'Plátano Dominico Hartón de la región', grupo: 'fruta', tipo_ciclo: 'semipermanente', unidad_conteo: 'planta', por_validar: false },
    ]),
    [`GET cultivos/${CROP_ID}`]: () => ({ id: CROP_ID, nombre: 'Café', grupo: 'plantación', tipo_ciclo: 'permanente', unidad_conteo: 'planta', por_validar: true, nombre_cientifico: 'Coffea arabica', tipo_renovacion: 'zoca', unidad_cosecha: 'kilo', fuente: 'Estructura inicial del equipo.', fases: [phase('preparacion', 1, 30), phase('siembra', 2, 15), phase('mantenimiento', 3, 120), phase('cosecha', 4, 60)] }),
    [`GET cultivos/${CROP_ID}/metodos`]: () => [{ metodo: 'semilla', dias_germinacion: 30, dias_vivero: 180, por_validar: true }],
    [`GET cultivos/${CROP_ID}/dosis`]: () => [],
    [`GET cultivos/${CROP_ID}/riesgos`]: () => [{ riesgo_id: RISK_ID, fase_critica: 'siembra', susceptibilidad: 'alta', medidas: 'Proteja las plantas jóvenes de la helada.', por_validar: true }],
    'GET riesgos': () => [{ id: RISK_ID, nombre: 'Helada', tipo: 'clima', aplica_a: 'ambos' }, { id: 'r2', nombre: 'Broca del café', tipo: 'plaga', aplica_a: 'cultivo' }],
    'GET eventos-adversos': () => page([{ id: EVENT_ID, finca_id: FARM_ID, riesgo_id: RISK_ID, siembra_id: PLANTING_ID, ciclo_id: null, inicio: '2026-09-27', fin: null, severidad: 'moderada', area_afectada: 1.2, perdida_pct: 12, perdida_estimada: 1850000, notas: 'Defoliación del dosel por granizada.' }]),
    'POST eventos-adversos': () => [201, {}],
    [`GET eventos-adversos/${EVENT_ID}`]: () => ({ id: EVENT_ID, finca_id: FARM_ID, riesgo_id: RISK_ID, siembra_id: PLANTING_ID, ciclo_id: null, inicio: '2026-09-27', fin: null, severidad: 'moderada', area_afectada: 1.2, perdida_pct: 12, perdida_estimada: 1850000, notas: 'Defoliación del dosel por granizada.' }),
    [`GET fincas/${FARM_ID}/flujo-caja`]: () => ({ finca_id: FARM_ID, ciclo_id: null, anio: 2026, mes: 10, ingresos: '14850000.00', gastos: '6450000.00', saldo: '8400000.00' }),
    [`GET fincas/${FARM_ID}/gastos`]: () => [gasto(1, 'Mano de obra', '3741000.00'), gasto(2, 'Insumos y fertilizantes', '1548000.00'), gasto(3, 'Compra de urea equivocada', '215000.00', 'anulado')],
    [`POST fincas/${FARM_ID}/gastos`]: () => [201, {}],
    [`GET fincas/${FARM_ID}/ingresos`]: () => [{ id: 'i1000000-0000-4000-8000-000000000001', finca_id: FARM_ID, categoria: 'Venta de cosecha', monto: null, total: '14850000.00', estado: 'activo' }],
    [`POST fincas/${FARM_ID}/ingresos`]: () => [201, {}],
    [`GET fincas/${FARM_ID}/trabajadores`]: () => [
      { id: 'w1', finca_id: FARM_ID, nombre: 'Pedro Nel Builes', tipo: 'jornalero', jornal_habitual: '90000.00', documento_ultimos4: '5831', telefono: '3125550450', estado: 'activo' },
      { id: 'w2', finca_id: FARM_ID, nombre: 'Juan Camilo Henao Zuluaga de los Ríos', tipo: 'contratista', jornal_habitual: '1250000.00', documento_ultimos4: null, telefono: null, estado: 'activo' },
    ],
    [`POST fincas/${FARM_ID}/trabajadores`]: () => [201, {}],
    [`GET fincas/${FARM_ID}/jornales`]: () => [
      { id: 'j1', finca_id: FARM_ID, actividad_id: 'act-1', actividad_nombre: 'Socola y limpieza selectiva del lote', trabajador_id: 'w1', trabajador_nombre: 'Pedro Nel Builes', fecha: '2026-10-03', obreros: 1, dias: 3, total: '270000.00', estado: 'pendiente' },
      { id: 'j2', finca_id: FARM_ID, actividad_id: 'act-1', actividad_nombre: 'Socola y limpieza selectiva del lote', trabajador_id: 'w1', trabajador_nombre: 'Pedro Nel Builes', fecha: '2026-10-04', obreros: 1, dias: 2, total: '180000.00', estado: 'pendiente' },
      { id: 'j3', finca_id: FARM_ID, actividad_id: 'act-2', actividad_nombre: 'Plateo', trabajador_id: null, trabajador_nombre: null, fecha: '2026-10-05', obreros: 4, dias: 1, total: '360000.00', estado: 'pendiente' },
    ],
    [`POST fincas/${FARM_ID}/jornales/j1/pagar`]: () => [201, {}],
    [`GET fincas/${FARM_ID}/insumos`]: () => [
      { id: SUPPLY_ID, finca_id: FARM_ID, nombre: 'Fertilizante triple 15', unidad: 'bulto', existencia: '12.0', valor: '1800000.00', costo_promedio: '150000.00', ultimo_movimiento: '2026-10-01' },
      { id: 'n2', finca_id: FARM_ID, nombre: 'Semilla de café Castillo variedad regional', unidad: 'kilo', existencia: '0', valor: '0', costo_promedio: null, ultimo_movimiento: null },
    ],
    [`POST fincas/${FARM_ID}/insumos`]: () => [201, {}],
    [`GET fincas/${FARM_ID}/movimientos-insumo`]: () => [
      { id: 'm1', insumo_id: SUPPLY_ID, tipo: 'entrada', cantidad: '20', costo: '3000000.00', fecha: '2026-09-20' },
      { id: 'm2', insumo_id: SUPPLY_ID, tipo: 'consumo', cantidad: '8', costo: null, fecha: '2026-10-01' },
    ],
    [`POST fincas/${FARM_ID}/insumos/entrada`]: () => [201, {}],
    [`POST fincas/${FARM_ID}/insumos/consumo`]: () => [201, {}],
    [`GET fincas/${FARM_ID}/procesos`]: () => [
      { id: PROCESS_ID, finca_id: FARM_ID, nombre: 'Secado de bijao lote 1', producto: 'Hoja de bijao seca', materia_prima: 'Hoja verde de bijao', origen_materia: 'propia', fecha_inicio: '2026-09-25', fecha_fin: null, etapas: 3, etapas_finalizadas: 1 },
      { id: 'p2', finca_id: FARM_ID, nombre: 'Trilla de café', producto: 'Café pergamino', materia_prima: 'Café cereza', origen_materia: 'comprada', fecha_inicio: '2026-08-10', fecha_fin: '2026-08-20', etapas: 2, etapas_finalizadas: 2 },
    ],
    [`POST fincas/${FARM_ID}/procesos`]: () => [201, {}],
    [`GET fincas/${FARM_ID}/procesos/${PROCESS_ID}/etapas`]: () => [
      { id: 'e1', nombre: 'Cocinar', dias_estimados: '1', iniciado_en: '2026-09-25', finalizado_en: '2026-09-26' },
      { id: 'e2', nombre: 'Secar al sol', dias_estimados: '5', iniciado_en: '2026-09-27', finalizado_en: null },
      { id: 'e3', nombre: 'Empacar', dias_estimados: '0.5', iniciado_en: null, finalizado_en: null },
    ],
    [`POST fincas/${FARM_ID}/procesos/${PROCESS_ID}/etapas`]: () => [201, {}],
    [`POST fincas/${FARM_ID}/etapas/e2/finalizar`]: () => [201, {}],
    'GET reportes': () => [
      { id: 'indices', titulo: 'Índices por planta', descripcion: 'Plantas por hectárea y plantas perdidas de cada siembra.', disponible: true, motivo: null, roles: ['admin', 'agricultor', 'contador'] },
      { id: 'cronograma', titulo: 'Tiempos del ciclo', descripcion: 'En qué fase va cada ciclo y cuándo debería terminar.', disponible: true, motivo: null, roles: ['admin', 'agricultor', 'contador'] },
      { id: 'costos', titulo: 'Costos por ciclo', descripcion: 'Cuánto cuesta cada ciclo.', disponible: false, motivo: 'Disponible cuando haya costos registrados', roles: ['admin', 'agricultor', 'contador'] },
    ],
    'GET reportes/indices': () => ({ siembras: [{ siembra_id: PLANTING_ID, cultivo: 'Café', lote_id: LOT_ID, fecha_conteo: '2026-10-02', indicadores: [{ titulo: 'Plantas por hectárea', valor: 3800, unidad: 'plantas por hectárea' }], aviso: null }] }),
    'GET reportes/cronograma': () => ({ ciclos: [{ siembra_id: PLANTING_ID, ciclo_id: CYCLE_ID, cultivo: 'Café', tipo: 'levante', fecha_inicio: '2026-08-01', fase_actual: 'siembra', fases_planeadas: 3, fecha_fin_planeada: '2027-01-13', aviso: null }] }),
    'GET reportes/eventos': () => ({ desde: null, hasta: null, total: 1, perdida_estimada_total: '1850000.00', por_tipo: [{ tipo: 'clima', cantidad: 1, perdida_estimada: '1850000.00', perdida_promedio_pct: 12 }], por_severidad: { moderada: 1 }, aviso: null }),
    'GET glosario': () => [
      { id: 'gl1', termino: 'Jornal', explicacion: 'Día de trabajo de una persona en el campo.', categoria: 'mano_de_obra' },
      { id: 'gl2', termino: 'Soqueo', explicacion: 'Corte del cultivo para que rebrote y se renueve la planta.', categoria: 'renovación' },
    ],
    'GET noticias': () => page([{ id: 'n1', titulo: 'Alerta de lluvias en su región', resumen: 'Se esperan lluvias fuertes esta semana en el suroeste.', enlace: 'https://ejemplo.test/noticia', fuente: 'Fuente de ejemplo', region_dane: '05', cultivo_id: null, publicada: '2026-10-07T10:00:00', vigente_hasta: new Date(Date.now() + 6.5 * 86400000).toISOString() }]),
    'GET conocimiento': () => page([{ id: 'p1', nombre: 'Manchas amarillas en la hoja', tipo: 'enfermedad', cultivo_id: CROP_ID, estado: 'validado' }]),
    'GET conocimiento/p1': () => ({ id: 'p1', nombre: 'Manchas amarillas en la hoja', tipo: 'enfermedad', cultivo_id: CROP_ID, estado: 'validado', causa: 'Hongo favorecido por la humedad.', sintomas: [{ descripcion: 'Manchas amarillas en el envés.' }], manejos: [{ descripcion: 'Mejore la aireación.' }], aviso: 'Consulte con asistencia técnica.', validaciones: [] }),
  }
}

export function createFakeBackend({ consentAccepted = true, farms = null, failPaths = [] } = {}) {
  const opts = { consentAccepted, farms, failPaths }
  const table = routes(opts)
  const calls = []

  const reply = (status, body) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

  const fetchFake = async (input, init = {}) => {
    const url = new URL(String(input))
    const method = (init.method ?? 'GET').toUpperCase()
    const path = url.pathname.replace(/^\//, '')
    calls.push(`${method} ${path}`)

    if (failPaths.includes(path)) return reply(500, { error: { code: 'ERROR', message: 'Fallo de prueba.' } })

    if (path === 'auth/login' && method === 'POST') {
      const body = JSON.parse(init.body)
      const role = String(body.email).split('@')[0]
      if (!ROLES.includes(role) || body.password !== '1234') {
        return reply(401, { error: { code: 'CREDENCIALES_INVALIDAS', message: 'El correo o la contraseña no son válidos.' } })
      }
      return reply(200, { access_token: `token-${role}`, rol: role })
    }

    const handler = table[`${method} ${path}`]
    if (path === 'politica') return reply(200, handler())

    const role = String(init.headers?.Authorization ?? '').replace('Bearer token-', '')
    if (!ROLES.includes(role)) return reply(401, { error: { code: 'NO_AUTENTICADO', message: 'Debe autenticarse.' } })

    if (path === 'auth/me') {
      return reply(200, { id: `u-${role}`, email: `${role}@demo.com`, nombre: NAMES[role], rol: role, activo: true, fincas: role === 'experto' ? [] : [FARM_ID], permisos: PERMISSIONS[role] })
    }
    if (!handler) return reply(404, { error: { code: 'NO_ENCONTRADO', message: `No existe: ${path}` } })
    const result = handler()
    return Array.isArray(result) && typeof result[0] === 'number' ? reply(result[0], result[1]) : reply(200, result)
  }

  return { fetch: fetchFake, calls, options: opts }
}
