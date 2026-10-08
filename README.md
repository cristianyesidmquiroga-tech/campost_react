# campost_react (AgroGestión en React)

<details>
<summary><b>Read this in English</b></summary>

React client for the AgroGestión FastAPI backend, with the same design system as the Flutter app (Android, web and Windows). Sign in, data consent, farms and lots, plantings and cycles, plant counts, adverse events, money, workers, regional news, glossary and knowledge library. Each role (admin, farmer, accountant, expert) sees only what its permissions allow. Run `npm test` before every pull request; GitHub Actions runs the same checks plus a layout check at four screen widths.

</details>

Cliente React del backend FastAPI de AgroGestión, con el mismo diseño que la app Flutter (Android, web y Windows). Cubre inicio de sesión, autorización de datos, fincas y lotes, siembras y ciclos, conteo de plantas, eventos adversos, dinero, trabajadores, novedades regionales, glosario y biblioteca de conocimiento. Cada perfil ve solo lo que sus permisos permiten.

## Ejecutar

1. Levantar el API (`uvicorn app.main:app --host 0.0.0.0 --port 8000`). El CORS del API permite `http://localhost:3000`.
2. Copiar `.env.example` a `.env` y ajustar `VITE_API_URL`.
3. `npm install` y `npm run dev`.

## Estructura

- `src/styles`: tokens de diseño (color, tipografía, espaciado, radios, sombras).
- `src/components/ui` y `src/components/layout`: piezas reutilizables y estructura de la app.
- `src/pages/<módulo>`: pantallas por módulo.
- `src/services`: llamadas al API; `src/context` y `src/hooks`: sesión, finca activa y carga de datos.
- `src/dev/fakeApi.js`: API simulada para pruebas y capturas.
- `tests/modulos`, `tests/roles`, `tests/vistas`: pruebas por módulo, por rol y por pantalla.
- `tool/capturar.mjs`: abre cada pantalla en 320, 390, 820 y 1280 px, guarda una captura y falla si algo se desborda.

## Pruebas

```bash
npm run lint
npm test
npm run build:fake
npx vite preview --outDir build/fake --port 3000 &
node tool/capturar.mjs
```

El flujo de GitHub Actions (`.github/workflows/pruebas.yml`) corre calidad, las tres suites, la revisión de diseño y el paquete. La dirección del API de producción sale de la variable `API_BASE_URL` del repositorio.
