# Stats por capas

**Problema que resuelve:** calcular el poder final de forma explicable y extensible.

## Reglas
- Poder = suma de capas: base + personaje/carta + puntos + equipo + buffs.
- Cada capa se puede reemplazar o quitar (modos "justos").
- El desglose por capa se muestra en la interfaz.

## En MiniFighter
`GameClient.GetProcessUserPower`: base 200 (HP 3500) + carta + habilidad + opciones de equipo. En el modo 11 la
carta se reemplaza por una genérica de 7★~9★.

## En la librería
`componerStats(capas)`, `desglose(capas, stat)`, `BASE_MINIFIGHTER`, `STATS_MINIFIGHTER`.
