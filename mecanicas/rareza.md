# Rareza (gacha)

**Problema que resuelve:** dar recompensas aleatorias con probabilidades controladas y publicables.

## Reglas
- Tabla [rareza, probabilidad]; lo que no suma 1 va a una rareza por defecto.
- Fuentes distintas, tablas distintas (jugar da rarezas bajas; cajas pagas, altas).
- Publicar los porcentajes (obligatorio en varios países para cajas pagas).

## En MiniFighter
Partida: 1★ 63%, 2★ 32%, 3★ 4%, 4★ 1%. Caja cash: 5★ 60% ... 12★ 0,0001%.

## Variantes
- "Lástima" (pity): rareza alta garantizada cada N tiradas.
- Rareza + grupo: primero la rareza, después qué objeto de esa rareza.

## En la librería
`tirarRareza`, `probabilidadesVisibles`, `RAREZA_PARTIDA`, `RAREZA_CAJA_ORIGINAL`.
