# Mejora / encantamiento

**Problema que resuelve:** progresión fina de una pieza sin cambiar su rareza.

## Reglas
- Un objeto de mejora suma un incremento aleatorio a todos los stats.
- Cada stat tiene un máximo según tipo y nivel; no se pasa.
- Si todo está al máximo, falla y no consume.

## En MiniFighter
`CardGenerator.EnchantCard`: +1 20%, +2 30%, +3 30%, +4 10%, +5 10%. Objeto distinto según el nivel de la carta.
Costo 1.000 ... 1.000.000.

## Variantes
- Riesgo de romper (+N con probabilidad decreciente, como el "+15" de los MMO coreanos).
- Mejora de un solo stat elegido.

## En la librería
`mejorar(stats, maximos, azar, tabla)`, `generarStats(azar, minimos, maximos)`.
