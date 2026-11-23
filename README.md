# Titan Workout

PWA mobile-first para planificar y registrar entrenamiento. No trae rutina ni ejercicios predefinidos: el usuario configura su equipo, nivel y objetivos, y solo aparece en el plan lo que activó y puede hacer con su equipo.

## Uso

- Abre la URL publicada en el teléfono y elige "Añadir a la pantalla de inicio".
- Funciona sin conexión: los datos viven en IndexedDB de ese dispositivo.
- Sin cuentas. Respaldo manual en JSON (Ajustes → Importar/Respaldo JSON). Para pasar datos a otro teléfono, exporta en el origen e importa en el destino.

## Desarrollo

Sin build: HTML, CSS y JavaScript plano.

```
index.html        Estructura y carga de scripts
styles.css        Tema oscuro, tipografía condensada, dorado/naranja/azul
js/catalog.js     Catálogo base de ejercicios, escaleras y silueta muscular (SVG propio)
js/db.js          Persistencia en IndexedDB
js/logic.js       Progresión, nivel, propuesta semanal, validaciones, fases, análisis
js/app.js         Pantallas, registro de series y asistente de 5 pasos
sw.js             Service worker (caché sin conexión)
tests/            Pruebas de humo de la lógica: node tests/logic-smoke.js
```

Al publicar cambios en archivos de la app, sube la versión de `CACHE` en `sw.js` para que los teléfonos reciban la nueva versión.

## Limitaciones conocidas

- El análisis de la foto es una autoevaluación guiada (tipo de cuerpo, cintura, IMC). La app no interpreta la imagen.
- La "sincronización" es el despliegue de la versión (GitHub Pages) y el respaldo JSON; no hay sincronización automática de datos entre dispositivos.
- Las estimaciones de peso a bajar usan un ritmo orientativo de 0,5–0,8 kg/semana.
- Aviso: no ofrece recomendaciones médicas. Consulta a un profesional antes de iniciar o cambiar tu entrenamiento o alimentación.
