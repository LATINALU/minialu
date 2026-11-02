# 7. Economía

Una economía de juego se diseña como un sistema de cañerías: **fuentes** que crean valor, **sumideros** que lo
destruyen y **conversores** que cambian una cosa por otra. Si las fuentes ganan, hay inflación (el oro no vale nada);
si ganan los sumideros, los jugadores se frustran.

## Monedas de MiniFighter

| Moneda | Dónde se guarda | Cómo se gana | En qué se gasta |
|---|---|---|---|
| **Mifa / oro** | `userinfovariable.Coin` | partidas, misiones, vender objetos, subasta, premios de nivel | tienda NPC, fusión, mejora, gremio (1.000.000), subasta |
| **Cash** | `userinfo.Cash` | dinero real (en el original) | tienda cash: cajas de cartas, VIP, paquetes, pociones de bonus |
| **Oro de Kamila** (objeto 5202) | inventario | eventos/drops | tienda Kamila |
| **Monedas Raon** (17111 + pestaña) | inventario | eventos | tienda de monedas |
| **Medalla de honor** (17806) | inventario | PvP/eventos | tienda de medallas |

Lección: las monedas-objeto (fichas de evento) son una forma barata de crear **economías paralelas** que no
inflan el oro. En la librería, cualquier objeto puede ser moneda con `pagoConObjeto(inventario, id)`.

## Fuentes y sumideros (números del original)

```
FUENTES (crean oro)                                   SUMIDEROS (destruyen oro)
─────────────────────                                 ─────────────────────────
Fin de partida  hasta 30.000 por partida   ─┐   ┌─>  Tienda NPC     poción 2.000, equipo...
  (120 + 400·particip. + tiempo/3 + 20/muerte) ×20 │   ├─>  Fusión         300 (1★) ... 10.000.000 (12★)
Vender al NPC   1/10 del precio de tienda  ─┼─> ORO ┼─>  Mejora         1.000 ... 1.000.000 por intento
Premios de nivel 1.000 ~ 2.000+ por nivel  ─┤   ├─>  Crear gremio    1.000.000
Misiones        COMPLETE_MONEY             ─┘   └─>  Subasta: SIN comisión → no destruye nada
```

Conversores: **subasta y comercio** (oro ↔ objetos entre jugadores), **venta al NPC** (objetos → oro),
**cajas** (cash → cartas), **fusión** (3 cartas + oro → 1 carta).

### Lo que muestra la simulación

`node lib/ejemplos/economia.ts` simula 200 partidas de un jugador que compra 2 pociones por partida y fusiona todo
lo que puede. Con la semilla 1: gana 2,64 M de oro, gasta 0,8 M en pociones y 0,05 M en fusiones, y le sobran
**1,79 M**. Las cartas que caen jugando son de 1-2★ y su fusión es barata: el oro se acumula sin destino.
Conclusiones de diseño:

1. El multiplicador ×20 de monedas (`RATE_COIN = 20` en este servidor de la comunidad; no se conoce el valor del
   servidor oficial) es la causa principal: con ×1 una partida daría ~700 de oro y una poción costaría 3 partidas.
2. Falta un sumidero proporcional a la riqueza: **comisión de subasta** (5-10%) y costos que escalen con el nivel
   (reparación, mejora). La librería ya la soporta (`comisionPorcentaje`).
3. Los sumideros caros (fusión 8★+ a millones) solo afectan a pocos jugadores; los sumideros masivos (consumibles)
   tienen que crecer con el nivel.

## Reglas de seguridad económica (todas aprendidas a la fuerza)

1. **Una sola fuente de verdad para precios** (catálogo) y el servidor solo vende lo que está en él.
2. **Entregar y después cobrar**, con todo verificado antes: un inventario lleno no puede costar dinero.
3. **Todo o nada**: un intercambio, una compra, una fusión no pueden quedar por la mitad.
4. **Registrar cada movimiento de valor** (quién, cuánto, por qué). Sin registro no hay forma de encontrar un duplicado.
5. **El cliente nunca dice cuánto gana**: el servidor calcula la recompensa con sus datos.
6. **Límites**: 20 publicaciones por jugador en subasta, tope de 30.000 por partida, 12 casillas por intercambio.
7. **El dinero real es otra cosa**: el cash requiere pagos, impuestos, reembolsos y leyes de cajas aleatorias
   (mostrar probabilidades). No se mezcla con el oro.

## Mecánicas económicas en la librería

| Mecánica | Ficha | Código |
|---|---|---|
| Billetera multi-moneda y medios de pago | [moneda](../mecanicas/moneda.md) | `economia/billetera.ts` |
| Tienda con catálogo | [tienda](../mecanicas/tienda.md) | `economia/tienda.ts` |
| Venta al NPC | [venta](../mecanicas/venta-npc.md) | `economia/venta.ts` |
| Intercambio entre jugadores | [comercio](../mecanicas/comercio.md) | `economia/comercio.ts` |
| Casa de subastas | [subasta](../mecanicas/subasta.md) | `economia/subasta.ts` |
| Banco | [banco](../mecanicas/banco.md) | `inventario/inventario.ts` (`transferir`) |
