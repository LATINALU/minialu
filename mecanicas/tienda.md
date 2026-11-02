# Tienda con catálogo

**Problema que resuelve:** vender contenido de forma segura con una sola fuente de precios.

## Reglas
1. Se vende solo lo que está en el catálogo, al precio del catálogo.
2. Verificar: está a la venta → nivel → fondos → espacio.
3. Entregar y después cobrar (con todo ya verificado).
4. Responder con el estado final (saldo restante, casillas tocadas).

## Datos que necesita
| Campo | Significado |
|---|---|
| tienda | npc, cash, kamila, monedas, medallas... |
| pestaña | pestaña en la que aparece |
| objeto, precio, cantidad | qué se entrega y cuánto cuesta |

## En MiniFighter
`ShopCatalog.cs` + `GameClient.Shop.cs`; fuente `tools\shop\catalogo.csv` → cliente y servidor. Respuestas del
paquete 39: 0 sin dinero, 1 ok, 2 inventario lleno, 3 nivel, 4 sin cash.

## Variantes
- Stock limitado / rotación diaria (agregar existencias al artículo).
- Descuentos por evento (multiplicador en el catálogo).
- Tienda que compra (ver [venta al NPC](venta-npc.md)).

## En la librería
`economia/tienda.ts`: `Catalogo`, `comprar`.
