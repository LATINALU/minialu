# Banco / almacén

**Problema que resuelve:** espacio extra fuera del inventario; también permite pasar cosas entre personajes de una cuenta.

## Reglas
- El banco es otro inventario. Depositar y retirar = mover una casilla de un inventario a otro.
- Si no entra en el destino, no se mueve nada.
- El jugador puede elegir la casilla de destino.

## En MiniFighter
70 casillas de objetos + 70 de cartas (tablas `bankitem`, `bankcard`), paquetes C→S 108 / S→C 115.

## Variantes
- Banco compartido por cuenta (todos los personajes) o por personaje.
- Banco que se amplía pagando (sumidero).
- Costo por depósito (sumidero pequeño y constante).

## En la librería
`transferir(origen, posicion, destino, posicionDestino?)` con dos `Inventario`.
