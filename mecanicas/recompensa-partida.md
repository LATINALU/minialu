# Recompensa por partida

**Problema que resuelve:** pagar por jugar de forma justa, sin premiar el abuso.

## Reglas
- Base por nivel, ×2/3 si perdió (perder también paga).
- Tiempo premiado con mínimo (60 s) y máximo (600 s).
- Muertes con rendimiento decreciente pasado un umbral.
- Multiplicador de moneda y tope por partida.

## En MiniFighter
`ExperienceCalculation.cs`. EXP: base + tiempo/5 + 20 por muerte (mazmorra: 4). Oro: (120 + 400·participación +
tiempo/3) + 20 por muerte, ×20, tope 30.000. Bug: la participación usaba división entera.

## En la librería
`recompensaPartida(datos, parametros)`, `RECOMPENSA_MINIFIGHTER`, `RECOMPENSA_MAZMORRA_MINIFIGHTER`.
Todos los números son parámetros.
