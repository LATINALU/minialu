# Venta al NPC

**Problema que resuelve:** dar salida a los objetos que sobran y fijar un "piso" de valor para los drops.

## Reglas
- Se paga una fracción del precio de tienda (MiniFighter: 1/10).
- Para objetos apilables el precio es por lote (`SELL_COUNT` unidades valen precio/10).
- Mínimo 1 si vale algo; 0 si no es vendible o es temporal.

## En MiniFighter
`GameClient.OnItemSell`. Algunos objetos daban una carta al venderse (efecto oculto, por ejemplo el 5013).

## Variantes
- Recompra (deshacer una venta reciente por el mismo precio).
- Fracción que baja si el mercado está saturado.

## En la librería
`precioDeVenta(datos, cantidad, divisor = 10)`.
