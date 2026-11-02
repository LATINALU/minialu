# Objetos con vencimiento / VIP por tiempo

**Problema que resuelve:** vender o regalar ventajas por un tiempo (alquiler, prueba, suscripción) sin que se
acumulen para siempre.

## Reglas
- Un objeto temporal guarda su fecha de vencimiento; vencido, se quita (y se avisa al jugador).
- Cada objeto temporal ocupa su propia casilla (no se apila: cada uno tiene su fecha).
- Los temporales no se venden al NPC (y normalmente no se comercian).
- Suscripción (VIP): comprar más tiempo **suma** al vencimiento actual; si ya venció, cuenta desde ahora.
- Lo que la suscripción abre (una pestaña) se cierra al vencer, pero no se borra lo que hay adentro.

## En MiniFighter
`USE_PERIOD_HOUR` de `ItemDefine` (`Item.IsPeriodItem`), `m_EndTime` del objeto. VIP: paquete de 30 días
(objeto 17332), `userinfovariable.VipUntil`, quinta pestaña de inventario (`GameClient.Vip.cs`).
`USE_PERIOD_GROUP` agrupa en la tienda cash las variantes del mismo objeto (7, 30, 90 días).

## Variantes
- Pase de batalla por temporada (vence al terminar la temporada).
- Objetos que se "gastan" por uso en vez de por tiempo (durabilidad).

## En la librería
`inventario/vencimiento.ts`: `agregarTemporal`, `quitarVencidos`, `vencimientoDe`, `estaVencido`, `Suscripcion`
(`extender`, `extenderDias`, `activa`, `restanteMs`), `aplicarVip`, `VIP_MINIFIGHTER`.
