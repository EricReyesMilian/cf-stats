# Perfil CF — estadísticas de Codeforces

Web en React (Vite + Recharts). Escribes un handle y muestra:

- **Resumen**: cifras clave, historial de rating con bandas de rangos, calendario de actividad, veredictos, lenguajes y anillos de progreso.
- **Concursos**: puesto y cambio de rating por concurso, tipos de concurso, mejores/peores resultados, tabla ordenable y filtrable.
- **Problemas**: resueltos por dificultad (con lo que queda por resolver), etiquetas, radar, aciertos por etiqueta, fallos antes del AC, los más difíciles, los pendientes y sugerencias.
- **Actividad**: rachas, resueltos acumulados, envíos por mes/año/día de la semana/hora.
- **Envíos**: últimos 150 con filtro por veredicto y enlace a cada envío.

## Uso

```bash
npm install
npm run dev        # http://localhost:5173
```

Para producción: `npm run build` y sirve la carpeta `dist/` con cualquier servidor estático.

También puedes abrir directamente un perfil con `http://localhost:5173/#/tourist`.

## Notas

- Usa la API pública de Codeforces desde el navegador; no necesita claves ni backend.
- Si Codeforces limita las peticiones, la app reintenta automáticamente.
- El catálogo completo de problemas (para "por resolver" y sugerencias) se carga en segundo plano.
- Las horas usan la zona horaria del navegador.
