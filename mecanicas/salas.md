# Salas y emparejamiento

**Problema que resuelve:** juntar jugadores para una partida, a mano (salas) o automáticamente (cola).

## Reglas de las salas
- Equipos con cupo, clave opcional y rango de nivel.
- Al entrar, el jugador va al equipo con menos gente (o al que pidió, si hay lugar).
- El anfitrión abre o cierra casillas (jugar 3 contra 3 en una sala de 8) y es quien empieza.
- Si el anfitrión se va, pasa al siguiente en orden de casillas.
- Para empezar: todos los demás listos y ningún equipo vacío. Jugando, no entra nadie.
- Guerra de gremios: cada equipo queda tomado por un gremio.

## Reglas del emparejamiento
- Cola por Elo. La diferencia aceptada empieza chica y **crece con la espera** (si no, en horas con poca gente nadie
  juega).
- El que más espera tiene prioridad.
- Al formar la partida, los equipos se reparten en serpiente para que sumen parecido.

## En MiniFighter
`Room.cs`: 16 casillas, dos equipos de 8 (A/B), `MASTER` (anfitrión) con `CheckMaster` al irse, `StartLV`/`LimitLV`,
`chOpen` por casilla, `Password`, modo 5 = guerra de gremios, modo 11 = arena con cartas niveladas. Mazmorras:
`DungeonRoom`, 4 jugadores. No había emparejamiento automático (solo "entrada rápida" a una sala con lugar).

## En la librería
`competitivo/salas.ts`: `Sala` (`entrar`, `salir`, `marcarListo`, `cambiarEquipo`, `abrirCasilla`, `empezar`,
`terminar`), `nivelPromedio`, `Emparejador` (`encolar`, `salir`, `emparejar`), `repartirEquipos`.
