# Puntos de habilidad

**Problema que resuelve:** que el jugador personalice su personaje con lo que gana al subir de nivel.

## Reglas
- Cada nivel **nuevo** da puntos (bajar y volver a subir no regala).
- Se reparten por personaje y por habilidad; cada habilidad tiene un tope que depende del nivel.
- "Máximo" pone de una todo lo que entre.
- Un objeto de reinicio devuelve todos los puntos.
- Cada punto se convierte en stat con un factor; el resultado es una capa más de [stats](stats.md).

## En MiniFighter
`GameClient.IncreaseSkillPoint`, `OnSkillPoint` (paquete 90), `GetBattleSkillValue`: 5 puntos por nivel, tope por
habilidad = nivel − 1, puntos guardados por personaje (`SkillData` = "personaje:habilidad:puntos,..."). Factores:
golpe/patada/especiales ×1, defensa ÷3, HP ×4/3. Reinicio con el objeto 267. Libros de habilidad dan puntos extra.

## Variantes
- Árbol de talentos: habilidades con requisitos (otra habilidad con N puntos).
- Costo creciente por punto en la misma habilidad (rendimiento decreciente).

## En la librería
`progresion/habilidades.ts`: `PuntosHabilidad` (`alcanzarNivel`, `sumarPuntos`, `asignar`, `reiniciar`, `capa`),
`HABILIDADES_MINIFIGHTER`.
