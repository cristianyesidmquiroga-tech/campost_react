import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FitText } from '../../src/components/ui/Cards'

const medidas = { disponible: 100, necesario: 150 }

function simular() {
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function () {
    return this.classList.contains('fit-box') ? medidas.disponible : 0
  })
  vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function () {
    return this.classList.contains('fit') ? medidas.necesario : 0
  })
  const observadores = []
  vi.stubGlobal('ResizeObserver', class {
    constructor(aviso) {
      this.aviso = aviso
      observadores.push(this)
    }
    observe() {}
    disconnect() {}
  })
  return observadores
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  Object.assign(medidas, { disponible: 100, necesario: 150 })
})

describe('cifras de los indicadores', () => {
  it('se encogen lo justo para caber en su caja', () => {
    simular()
    const { container } = render(<FitText>$ 2.770.000</FitText>)
    const escala = Number(container.querySelector('.fit').style.transform.match(/scale\(([\d.]+)\)/)[1])
    expect(escala).toBeCloseTo(medidas.disponible / medidas.necesario, 3)
  })

  it('no se tocan si ya caben', () => {
    simular()
    medidas.disponible = 200
    const { container } = render(<FitText>$ 800</FitText>)
    expect(container.querySelector('.fit').style.transform).toBe('')
  })

  it('se reajustan cuando la caja cambia de ancho', () => {
    const observadores = simular()
    const { container } = render(<FitText>$ 2.770.000</FitText>)
    const inicial = container.querySelector('.fit').style.transform
    medidas.disponible = 75
    observadores.forEach((o) => o.aviso())
    const nuevo = container.querySelector('.fit').style.transform
    expect(nuevo).not.toBe(inicial)
    expect(Number(nuevo.match(/scale\(([\d.]+)\)/)[1])).toBeCloseTo(medidas.disponible / medidas.necesario, 3)
  })

  it('se quita el escalado cuando la caja vuelve a ser suficiente', () => {
    const observadores = simular()
    const { container } = render(<FitText>$ 2.770.000</FitText>)
    medidas.disponible = 300
    observadores.forEach((o) => o.aviso())
    expect(container.querySelector('.fit').style.transform).toBe('')
  })
})
