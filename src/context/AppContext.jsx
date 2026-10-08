import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { listFarms } from '../services/farms'
import { listCrops } from '../services/production'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [farms, setFarms] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [revision, setRevision] = useState(0)
  const [crops, setCrops] = useState({})
  const cropsLoaded = useRef(false)

  const loadFarms = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await listFarms()
      setFarms(list)
      setActiveId((current) => (list.some((f) => f.id === current) ? current : (list[0]?.id ?? null)))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadCrops = useCallback(async () => {
    if (cropsLoaded.current) return
    cropsLoaded.current = true
    try {
      setCrops(Object.fromEntries((await listCrops()).map((c) => [c.id, c])))
    } catch {
      setCrops({})
    }
  }, [])

  useEffect(() => {
    loadFarms()
    loadCrops()
  }, [loadFarms, loadCrops])

  const value = useMemo(
    () => ({
      farms,
      activeFarm: farms.find((f) => f.id === activeId) ?? null,
      farmsLoading: loading,
      farmsError: error,
      revision,
      crops,
      cropName: (id) => crops[id]?.name ?? 'Cultivo',
      loadFarms,
      selectFarm: (id) => {
        setActiveId(id)
        setRevision((r) => r + 1)
      },
      markChanged: () => setRevision((r) => r + 1),
    }),
    [farms, activeId, loading, error, revision, crops, loadFarms],
  )
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const value = useContext(AppContext)
  if (!value) throw new Error('useApp debe usarse dentro de AppProvider')
  return value
}
