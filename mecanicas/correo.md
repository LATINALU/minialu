# Correo con adjuntos

**Problema que resuelve:** entregar cosas cuando el jugador no tiene lugar o no está conectado (premios,
devoluciones de subasta, regalos, compensaciones).

## Reglas
- Cada carta puede traer objetos y monedas.
- Cobrar es **todo o nada**: si no entra todo en el inventario, no se cobra nada.
- Buzón con máximo de cartas; las cartas vencen.
- Las vencidas con adjuntos sin cobrar se devuelven a quien llama (para reenviar al remitente o registrarlas).
- No se borra una carta con adjuntos sin cobrar, salvo que se fuerce.

## En MiniFighter
Tabla `mail` (objeto, cantidad, oro). El servidor lista 40 cartas y al cobrar las borra. Los premios de nivel
(`EventLevel`) llegaban por correo; los premios con objetos inexistentes quedaban imposibles de cobrar.

## Variantes
- Regalos entre jugadores con costo de envío (sumidero) o solo entre amigos.
- Contra reembolso: el destinatario paga para recibir el adjunto (mercado directo).

## En la librería
`social/correo.ts`: `Buzon` (`enviar`, `listar`, `leer`, `cobrar`, `borrar`, `limpiar`, `noLeidas`), `tieneAdjuntos`.
