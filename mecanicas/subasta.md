# Casa de subastas

**Problema que resuelve:** mercado entre jugadores sin que tengan que estar conectados a la vez.

## Reglas
- Precio fijo, duración fija. El objeto queda en custodia de la casa.
- Estados: en venta → vendida → (cobrar) cerrada; en venta → vencida → (recuperar) cerrada; cancelar.
- Límite de publicaciones por vendedor. No se compra lo propio.
- El vendedor cobra el precio menos la comisión (sumidero).

## En MiniFighter
`AuctionHouse.cs` + `GameClient.Auction.cs`: 48 h, 20 por jugador, 15 por página, tabla `auction`, sin comisión.

## Variantes
- Puja ascendente con precio de compra inmediata.
- Depósito al publicar que se pierde si no se vende (frena la especulación).

## En la librería
`economia/subasta.ts`: `CasaDeSubastas` (`publicar`, `buscar`, `comprar`, `cancelar`, `recuperar`, `cobrar`;
`retirado` = oro destruido por comisiones).
