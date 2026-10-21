export const ROLE_LABELS = {
  admin: 'Administrador',
  agricultor: 'Agricultor',
  contador: 'Contador',
  experto: 'Experto',
}

export function createAccess(session) {
  const role = session?.role ?? ''
  const permissions = session?.permissions ?? []
  const has = (method, route) =>
    permissions.some((p) => p.method === method && p.route.startsWith(route))

  const isAdmin = role === 'admin'
  const isFarmer = role === 'agricultor'
  const isAccountant = role === 'contador'
  const isExpert = role === 'experto'

  const operates = !isAdmin
  const registersFieldWork = isFarmer
  const registersMoney = isFarmer || isAccountant

  return {
    role,
    roleLabel: ROLE_LABELS[role] ?? role,
    isAdmin,
    isFarmer,
    isAccountant,
    isExpert,
    seesFarms: operates,
    seesProduction: operates && has('GET', '/siembras'),
    managesProduction: operates && has('POST', '/siembras'),
    managesCatalog: has('GET', '/cultivos'),
    managesAlerts: isAdmin,
    reviewsKnowledge: isAdmin || isExpert,
    seesAdminPanel: isAdmin,
    createsUsers: has('POST', '/usuarios'),
    seesAssistant: isFarmer,
    seesAssistantQuality: isAdmin,
    seesLivestock: isFarmer,
    managesLivestock: isFarmer,
    seesNursery: operates && has('GET', '/propagacion'),
    seesReports: isFarmer || isAccountant,
    seesRisks: operates && has('GET', '/eventos-adversos'),
    seesMoney: isFarmer || isAccountant,
    registersMoney,
    seesProfit: isAccountant,
    cancelsMoney: isAccountant,
    seesWorkers: isFarmer || isAccountant,
    seesPayments: operates && has('GET', '/fincas/{finca_id}/jornales'),
    paysWorkers: isAccountant,
    seesInventory: operates && has('GET', '/fincas/{finca_id}/insumos'),
    seesProcesses: operates && has('GET', '/fincas/{finca_id}/procesos'),
    managesInventory: isFarmer,
    managesWorkers: isFarmer,
    createsFarms: isFarmer,
    registersFieldWork,
    canQuickRegister: registersFieldWork || registersMoney,
  }
}
