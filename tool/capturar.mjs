import { mkdirSync } from 'node:fs'
import { existsSync } from 'node:fs'
import puppeteer from 'puppeteer-core'
import { SCREENS } from '../tests/support/screens.js'

const URL_BASE = process.env.URL_BASE ?? 'http://localhost:3000'
const OUT = process.env.CAPTURAS ?? 'build/capturas'
const WIDTHS = (process.env.WIDTHS ?? '320,390,820,1280').split(',').map(Number)
const ROLE = process.env.ROLE ?? 'admin'

const CANDIDATES = [
  process.env.CHROME_PATH,
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean)

const executablePath = CANDIDATES.find((path) => existsSync(path))
if (!executablePath) throw new Error('No se encontró Chrome. Defina CHROME_PATH.')

mkdirSync(OUT, { recursive: true })

const measure = () => {
  const viewport = document.documentElement.clientWidth
  const offenders = []
  const insideScroller = (node) => {
    for (let el = node.parentElement; el; el = el.parentElement) {
      const overflow = getComputedStyle(el).overflowX
      if (overflow === 'auto' || overflow === 'scroll') return true
    }
    return false
  }
  document.querySelectorAll('body *').forEach((el) => {
    const rect = el.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    if (rect.right > viewport + 1 && !insideScroller(el)) offenders.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}`)
    const style = getComputedStyle(el)
    const clipped = style.overflowX === 'hidden' && el.scrollWidth > el.clientWidth + 1 && !el.classList.contains('fit-box') && !el.className.includes('clamp')
    if (clipped) offenders.push(`recortado ${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} "${el.textContent.trim().slice(0, 30)}"`)
  })
  return {
    pageOverflow: document.documentElement.scrollWidth > viewport + 1,
    offenders: [...new Set(offenders)].slice(0, 8),
  }
}

const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--no-sandbox'] })
const problems = []

for (const width of WIDTHS) {
  const page = await browser.newPage()
  await page.setViewport({ width, height: 900, deviceScaleFactor: 1 })
  await page.evaluateOnNewDocument((role) => localStorage.setItem('agrogestion_access_token', `token-${role}`), ROLE)
  for (const [name, route, text] of SCREENS) {
    await page.goto(`${URL_BASE}${route}`, { waitUntil: 'networkidle0' })
    await page.waitForFunction((t) => document.body.innerText.toLowerCase().includes(t.toLowerCase()), { timeout: 8000 }, text)
    const result = await page.evaluate(measure)
    const file = `${OUT}/${width}-${name.replaceAll(' ', '-')}.png`
    await page.screenshot({ path: file, fullPage: true })
    if (result.pageOverflow || result.offenders.length > 0) {
      problems.push(`${width}px ${name}: ${result.pageOverflow ? 'la página se desborda; ' : ''}${result.offenders.join(', ')}`)
    }
  }
  await page.close()
}

await browser.close()
if (problems.length > 0) {
  console.error(`Se encontraron ${problems.length} problemas de diseño:\n${problems.join('\n')}`)
  process.exit(1)
}
console.log(`Sin desbordes en ${SCREENS.length * WIDTHS.length} vistas.`)
