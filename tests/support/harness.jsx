import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import App from '../../src/App'
import { AuthProvider } from '../../src/context/AuthContext'
import { ToastProvider } from '../../src/context/ToastContext'
import { createFakeBackend } from '../../src/dev/fakeApi'
import { setToken } from '../../src/services/http'
import { setViewport } from './viewport'

export const WIDTHS = [320, 390, 820, 1280]

export async function renderApp({ role = 'agricultor', route = '/inicio', width = 390, backend = createFakeBackend(), signedIn = true } = {}) {
  setViewport(width)
  setToken(null)
  if (signedIn) localStorage.setItem('agrogestion_access_token', `token-${role}`)
  vi.stubGlobal('fetch', backend.fetch)
  const user = userEvent.setup()
  const utils = render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>,
  )
  return { ...utils, backend, user }
}

const same = (text) => (content) => content.trim().toLowerCase() === text.toLowerCase()

export const ready = (text) => screen.findByText(same(text), {}, { timeout: 4000 })
export const gone = (text) => waitFor(() => expect(screen.queryByText(same(text))).not.toBeInTheDocument())
