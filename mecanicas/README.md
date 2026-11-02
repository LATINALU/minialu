# Catálogo de mecánicas

Cada ficha describe una mecánica de forma independiente del juego: qué problema resuelve, sus reglas, qué datos
necesita, los números de MiniFighter como referencia, variantes para otros géneros y dónde está en la librería.

| Área | Mecánica | Ficha | Código (`lib/src/`) | Estado |
|---|---|---|---|---|
| Base | Azar inyectable y tablas de probabilidad | [azar](azar.md) | `core/azar.ts` | ✅ |
| Base | Tablas de datos (Base + Define) | [datos](datos.md) | `datos/` | ✅ |
| Objetos | Inventario por pestañas con pilas | [inventario](inventario.md) | `inventario/inventario.ts` | ✅ |
| Objetos | Banco / almacén | [banco](banco.md) | `inventario/inventario.ts` | ✅ |
| Economía | Monedas y medios de pago | [moneda](moneda.md) | `economia/billetera.ts` | ✅ |
| Economía | Tienda con catálogo | [tienda](tienda.md) | `economia/tienda.ts` | ✅ |
| Economía | Venta al NPC | [venta-npc](venta-npc.md) | `economia/venta.ts` | ✅ |
| Economía | Intercambio entre jugadores | [comercio](comercio.md) | `economia/comercio.ts` | ✅ |
| Economía | Casa de subastas | [subasta](subasta.md) | `economia/subasta.ts` | ✅ |
| Progresión | Curva de niveles | [niveles](niveles.md) | `progresion/niveles.ts` | ✅ |
| Progresión | Recompensa por partida | [recompensa-partida](recompensa-partida.md) | `progresion/recompensas.ts` | ✅ |
| Progresión | Bonificaciones y premios por nivel | [bonus](bonus.md) | `progresion/recompensas.ts` | ✅ |
| Colección | Rareza (gacha) | [rareza](rareza.md) | `cartas/cartas.ts` | ✅ |
| Colección | Fusión 3 → 1 | [fusion](fusion.md) | `cartas/cartas.ts` | ✅ |
| Colección | Mejora / encantamiento | [mejora](mejora.md) | `cartas/cartas.ts` | ✅ |
| Combate | Stats por capas | [stats](stats.md) | `combate/stats.ts` | ✅ |
| Combate | Buffs temporales | [buffs](buffs.md) | `combate/buffs.ts` | ✅ |
| Combate | Botín (drops) | [drops](drops.md) | `combate/drops.ts` | ✅ |
| Red | Paquetes binarios y despachador | [protocolo](protocolo.md) | `red/paquetes.ts` | ✅ |
| Assets | Sprites RGB565 | [sprites](sprites.md) | `assets/sprites.ts` | ✅ |
| Social | Gremios | [gremios](gremios.md) | `social/gremios.ts` | ✅ |
| Social | Correo con adjuntos | [correo](correo.md) | `social/correo.ts` | ✅ |
| Progresión | Misiones (matar N, entregar, cadenas) | [misiones](misiones.md) | `progresion/misiones.ts` | ✅ |
| Progresión | Puntos de habilidad | [habilidades](habilidades.md) | `progresion/habilidades.ts` | ✅ |
| Objetos | Objetos con vencimiento / VIP por tiempo | [vencimiento](vencimiento.md) | `inventario/vencimiento.ts` | ✅ |
| Objetos | Cajas con contenido fijo o aleatorio | [cajas](cajas.md) | `inventario/cajas.ts` | ✅ |
| Competitivo | Ranking y temporadas (+ Elo) | [ranking](ranking.md) | `competitivo/ranking.ts` | ✅ |
| Competitivo | Salas y emparejamiento | [salas](salas.md) | `competitivo/salas.ts` | ✅ |

## Plantilla

```markdown
# Nombre de la mecánica

**Problema que resuelve:** una línea.

## Reglas
- ...

## Datos que necesita
| Campo | Significado |

## En MiniFighter
Archivo de origen, números reales, curiosidades.

## Variantes
- Para otros géneros...

## En la librería
Archivo, funciones, ejemplo corto.
```
