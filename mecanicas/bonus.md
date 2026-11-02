# Bonificaciones y premios por nivel

**Problema que resuelve:** acelerar la progresión temporalmente (pociones, eventos) y marcar hitos.

## Reglas
- Los bonus porcentuales se **suman** y se aplican una vez: `valor × (100 + Σ%) / 100`.
- Premios por nivel: al subir se dan los de todos los niveles alcanzados (también si se saltan varios).
- Validar que los premios apunten a objetos existentes.

## En MiniFighter
Buffs 12-15, 30, 31 (+% EXP/oro en batalla o mazmorra), evento global `/evento` (`define/Evento.txt`),
`EventLevel(KR).txt` (99 premios: nivel → objeto + oro, por correo).

## En la librería
`aplicarBonus(valor, porcentaje)`, `premiosPorSubida(tabla, antes, despues)`. El porcentaje sale de
`GestorBuffs.efecto("expBatalla")` más el del evento.
