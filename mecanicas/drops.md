# Botín (drops)

**Problema que resuelve:** qué suelta cada monstruo, controlando cuánto valor entra a la economía.

## Reglas
- Tabla elegida por rango de nivel del monstruo; los jefes tienen tabla propia.
- Tres modos de lectura (dan economías muy distintas): uno-y-tirar, cada-uno, ponderado.
- Calcular la probabilidad real antes de publicar una tabla.

## En MiniFighter
`BattleDropItem(CN).txt` (65 tablas), `DropItemBase.GetDropItem` (uno-y-tirar), rangos Lv1~5 → 38 ... Lv69+ → 64,
jefes en las tablas 13~33.

## En la librería
`tirarDrop(azar, tabla, modo, multiplicador)`, `probabilidadReal`, `tablaPorNivel`, `RANGOS_DROP_MINIFIGHTER`.
