# Gremios

**Problema que resuelve:** dar a los jugadores un grupo estable con identidad, jerarquía y objetivos comunes (retención).

## Reglas
- Fundar cuesta (nivel mínimo + oro) y el nombre es único. El fundador es maestro.
- Rangos: solicitante → miembro → submaestro → maestro.
- Entrar es por solicitud: la aprueba o rechaza el maestro o un submaestro.
- Solo se expulsa a alguien de rango menor; solo el maestro nombra submaestros (con cupo).
- Si el maestro se va, asciende el de mayor rango (y, entre iguales, el más antiguo). Sin miembros, se disuelve.
- Puntos, victorias y derrotas del gremio para el ranking y las guerras.

## En MiniFighter
`GameClient.OnGuild*` (Make, Join, JoinList, UserJoin, UserKick, SubMaster, Delete), tablas `guilddata` y
`guildmemberlist` (columna `Member`: 0 solicitante, 1 miembro, 2 submaestro, 3 maestro). Fundar: nivel 10 y
1.000.000 de oro. Guerra de gremios: modo de sala 5 (cada equipo, un gremio). Guerra de castillo diaria a las 20:30:
el gremio ganador se anuncia a todo el servidor.

## Variantes
- Niveles de gremio con beneficios (más cupo, bonus de EXP) pagados con un banco común.
- Banco del gremio con permisos por rango.
- Impuesto: un % del oro ganado por los miembros va al gremio.

## En la librería
`social/gremios.ts`: `Gremio` (`solicitar`, `aprobar`, `rechazar`, `expulsar`, `cambiarRango`, `salir`,
`registrarGuerra`), `FUNDAR_GREMIO_MINIFIGHTER`. El cobro de la fundación se hace con un `MedioDePago`.
