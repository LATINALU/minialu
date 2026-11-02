# Intercambio entre jugadores

**Problema que resuelve:** que dos jugadores intercambien objetos y oro sin poder engañarse.

## Reglas
- Cada lado ofrece hasta N casillas y oro.
- Dos pasos: aceptar y confirmar. **Cualquier cambio en la oferta borra las aceptaciones de los dos.**
- Al confirmar ambos: se valida todo (fondos, objetos presentes, espacio simulado) y se mueve todo junto o nada.
- Objetos no comerciables (`ENABLE_TRADE`) no se pueden ofrecer.

## En MiniFighter
`Trade.cs`, `TradeUser.cs`: 12 casillas, aceptar + completar. Las cartas de 7★ o más exigían un ticket
(objeto 16240) por carta: un **impuesto** al comercio de lo valioso.

## Variantes
- Impuesto en oro por intercambio (sumidero).
- Comercio solo entre amigos o con nivel mínimo (contra bots).

## En la librería
`economia/comercio.ts`: `Comercio` (`ofrecerCasilla`, `ofrecerDinero`, `aceptar`, `confirmar`, `cancelar`).
