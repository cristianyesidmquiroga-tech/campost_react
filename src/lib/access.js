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

  const registersFieldWork = isAdmin || isFarmer
  const registersMoney = isAdmin || isFarmer || isAccountant

  return {
    role,
    roleLabel: ROLE_LABELS[role] ?? role,
    isAdmin,
    isFarmer,
    isAccountant,
    isExpert,
    seesProduction: has('GET', '/siembras'),
    managesProduction: has('POST', '/siembras'),
    managesCatalog: has('GET', '/cultivos'),
    seesLivestock: isAdmin || isFarmer,
    managesLivestock: isAdmin || isFarmer,
    seesNursery: has('GET', '/propagacion'),
    seesReports: isAdmin || isFarmer || isAccountant,
    seesRisks: has('GET', '/eventos-adversos'),
    seesMoney: isAdmin || isFarmer || isAccountant,
    registersMoney,
    seesProfit: isAdmin || isAccountant,
    cancelsMoney: isAdmin || isAccountant,
    seesWorkers: isAdmin || isFarmer || isAccountant,
    seesPayments: has('GET', '/fincas/{finca_id}/jornales'),
    paysWorkers: isAdmin || isAccountant,
    seesInventory: has('GET', '/fincas/{finca_id}/insumos'),
    seesProcesses: has('GET', '/fincas/{finca_id}/procesos'),
    managesInventory: isAdmin || isFarmer,
    managesWorkers: isAdmin || isFarmer,
    createsFarms: isAdmin || isFarmer,
    registersFieldWork,
    canQuickRegister: registersFieldWork || registersMoney,
  }
}
