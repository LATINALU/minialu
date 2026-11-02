# 2. Red y protocolo

Fuentes: `Common\KartRider.Net\Session.cs`, `Common\KartRider.IO.Packet\*.cs`, `GameClient.OnPacket`,
`MiniFighter\docs\protocolo_servidor.txt`. Implementación reutilizable: [`lib/src/red/paquetes.ts`](../lib/src/red/paquetes.ts).

## La trama TCP

```
┌────────┬──────────────────────────── cifrado DogCrypto (bloques de 8 bytes) ───────────────────────────┐
│ u16    │ u16 ?  │ u8 contador │ 3 bytes │ u16 protocolo │ u8 n.º de paquete │ datos del paquete...      │
│ largo  │        │ 1..255      │         │               │ (0 login, 33 compra, 39 resultado de compra…) │
└────────┴─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Largo** al principio: TCP es un flujo de bytes, no de mensajes. `Session.EndReceive` acumula lo recibido y
  corta tramas completas (en la librería: `ExtractorTramas`).
- **Cifrado** de la trama con una clave fija de 4 enteros (`ResetPacketCryptKey`). Sirve contra curiosos, no
  contra alguien con el cliente decompilado.
- **Contador** 1..255: si el paquete no trae el número esperado, desconecta. Evita reenviar paquetes capturados
  (*replay*) e inyectar paquetes en medio.
- **Número de paquete** (un byte): el servidor hace `switch` sobre él (`GameClient.OnPacket`, ~120 casos).

Tipos de datos: enteros little-endian; `ShortString` = u16 largo + bytes (cp949 en el original).

## Cliente → servidor y servidor → cliente

Son **dos numeraciones distintas**. Ejemplo, la tienda:

| Dirección | Paquete | Contenido |
|---|---|---|
| C→S | 33 `{1, short objeto}` | comprar en la tienda NPC con oro |
| C→S | 33 `{2/4/5, short objeto, byte pestaña}` | comprar pagando con monedas-objeto |
| C→S | 93 `{1, short objeto}` | comprar en la tienda cash |
| S→C | 39 `{0}` sin dinero, `{2}` inventario lleno, `{3}` nivel, `{4}` sin cash | resultado |
| S→C | 39 `{1, long oro, int cash, short pestaña, short casilla, objeto}` | compra hecha: estado nuevo completo |

Patrón para copiar: **la respuesta trae el estado nuevo** (oro total, casilla exacta), no "restá 2000". Si un paquete
se pierde o llega dos veces, el cliente igual queda bien.

Otros protocolos documentados: banco 108/115, subasta 128/124, buffs 102/109, uso de objetos 36/94, bonus 68.

## Quién manda: el problema del P2P

MiniFighter usa **ProudNet** (biblioteca comercial coreana) para que los clientes de una zona/sala se hablen
directamente. El combate (posición, golpes, daño a otros jugadores) se calcula en los clientes; el servidor solo
recibe "maté a X", "terminó la partida".

| Ventaja | Problema |
|---|---|
| Latencia baja y servidor barato (no simula nada) | El cliente decide quién ganó: un cliente modificado gana siempre |
| Escala a muchos jugadores sin CPU | La recompensa (EXP, oro, cartas) depende de datos que manda el cliente |

Para un juego nuevo: **servidor autoritativo** para todo lo que da recompensas. El cliente manda *intenciones*
("golpe hacia la derecha"), el servidor simula y manda *resultados*. El cliente puede predecir para que se sienta
inmediato, pero el servidor corrige.

## Despachar paquetes

El original es un `switch` gigante dentro de una clase de 9.864 líneas (`GameClient.cs`). Lo reutilizable es el
patrón, mejor como **registro**: cada sistema registra sus paquetes en su propio archivo.

```ts
const despachador = new Despachador<Sesion>((id, e) => log.error(`paquete ${id}`, e));
despachador.registrar(33, (sesion, r) => tienda.comprar(sesion, r.u8(), r.i16()));
despachador.registrar(108, (sesion, r) => banco.manejar(sesion, r));
```

Dos lecciones de la auditoría del servidor:
- Un error en un manejador **no** debe desconectar al jugador (antes lo hacía): se registra con el número de paquete.
- **Nunca** dormir el hilo por paquete: había un `Thread.Sleep(100)` por paquete = máximo 10 paquetes/s por jugador.
