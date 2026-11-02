# Ranking y temporadas

**Problema que resuelve:** dar metas competitivas a largo plazo y premiar a los mejores sin que el ranking
quede congelado.

## Reglas
- Puntaje por jugador; los empates comparten puesto (1, 2, 2, 4) y a igual puntaje va primero el que llegó antes.
- Temporadas: al cerrar se entregan premios por tramos de puesto (top 1, top 10, top 100...) y se reinician los
  puntos, del todo o en parte (reinicio suave: se conserva una fracción).
- Para ranking por habilidad, Elo: ganarle a alguien mejor da más que ganarle a alguien peor.

## En MiniFighter
`RankingProvider.cs`: listas por EXP de batalla, EXP de pelea y puntos de gremio (con victorias y derrotas).
`OnRanking` no responde de 4 a 7 de la mañana (ventana de recálculo). Guerra de castillo diaria (20:30) con
gremio ganador. **No había temporadas**: los veteranos quedaban arriba para siempre.

## Variantes
- Ligas (bronce, plata, oro) con ascenso y descenso por temporada.
- Ranking semanal de un evento (puntos del evento, no EXP).

## En la librería
`competitivo/ranking.ts`: `Ranking` (`sumar`, `fijar`, `tabla`, `top`, `puestoDe`, `cerrarTemporada`),
`esperadoElo`, `actualizarElo`.
