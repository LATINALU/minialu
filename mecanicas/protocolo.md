# Paquetes binarios y despachador

**Problema que resuelve:** hablar entre cliente y servidor con mensajes compactos y un manejador por mensaje.

## Reglas
- Trama con el largo al principio (TCP no respeta los límites de los mensajes).
- Primer byte = número de paquete; numeraciones separadas C→S y S→C.
- La respuesta trae el estado final, no diferencias.
- Errores aislados por paquete; nada bloqueante.

## En MiniFighter
`Session.cs` (trama, DogCrypto, contador 1..255), `InPacket` / `OutPacket`, `GameClient.OnPacket` (switch).

## En la librería
`EscritorPaquete`, `LectorPaquete`, `enmarcar`, `ExtractorTramas`, `Despachador`.
