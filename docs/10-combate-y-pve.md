# 10. Combate y PvE

Fuentes: `GameClient.GetProcessUserPower`, `FightController.cs`, `DungeonRoom.cs`, `EnemyStatDefine.cs`,
`GameClient.Buffs.cs`, `GameClient.Drops.cs`, `DropItemBase.cs`. Código: [`lib/src/combate/`](../lib/src/combate/).

## Stats del jugador: suma de capas

```
poder(stat) = base + carta elegida + puntos de habilidad + opciones del equipo
base: 200 en todo, 3500 de HP
```

| Stat | Origen en la carta |
|---|---|
| golpe, patada | PUNCH_POWER, KICK_POWER |
| defensa | DEFENCE |
| HP, MP | HP, MP |
| habilidad, habilidad nueva | SKILL, ADVSKILL |
| especial, especial final | SPECIAL, ADVSPECIAL |
| agarre | CATCH |

Detalle interesante: en el modo 11 (arena "justa"), el servidor **reemplaza** la carta del jugador por una
genérica de su tipo con nivel recortado entre 7★ y 9★. Así se arma un modo competitivo sin ventaja de cartas
pagas sin cambiar nada más. `componerStats(capas)` permite lo mismo: cambiar o quitar una capa.

## Combate

El daño entre jugadores se calcula en los clientes (P2P, ver [red](02-red-y-protocolo.md)). El servidor guarda
estados de pelea (`FightController`), cuenta muertes y decide el ganador por rondas (`AWin`/`BWin`, gana quien
llega a `MaxWinCount`). Para un juego nuevo, el daño se calcula en el servidor con estos stats.

## Mazmorras (PvE)

- Sala de hasta **4 jugadores** (`DungeonRoom`), 16 mazmorras (Tantalus, Sirookia, Nuke, ... Delta-M), cada una
  arranca en la zona 87 + 4×N.
- Los monstruos tienen stats **por nivel** (`EnemyStatDefine`: HP, DEFENSA, PODER para nivel 1, 2, 3...). Si falta
  un nivel, se usa el más cercano (antes la zona quedaba vacía).
- La EXP por monstruo se reparte **a todos los del grupo** (había un bug que solo le daba al primero).
- Jefe final: al morir termina la mazmorra y cada jugador recibe su propia tirada de botín.

## Botín (drops)

```
monstruo de nivel N ──> tabla por rango de nivel (Lv1~5 → 38, Lv6~8 → 39, ..., Lv69+ → 64)
jefe de la mazmorra ──> tabla propia (Tantalus → 13, Sirookia → 14, ...)
tabla ──> se elige UNA entrada al azar ──> se tira su probabilidad ──> objeto o nada
```

El modo "uno y tirar" hace que la probabilidad real de un objeto sea `prob / cantidad de entradas`. Una tabla con 9
entradas y la gema al 0,9 la da en realidad al 10%. `probabilidadReal(tabla, modo)` lo calcula; conviene mostrarlo en
las herramientas de diseño, porque leer la tabla engaña.

| Modo | Objetos por muerte | Cuándo usarlo |
|---|---|---|
| `uno-y-tirar` (original) | 0 o 1 | economía controlada, tablas largas |
| `cada-uno` | 0 a N | botín generoso, juegos de looteo |
| `ponderado` | siempre 1 | cofres, recompensas garantizadas |

## Buffs

Duran `KEEP_TIME` segundos; repetir uno renueva el tiempo; una sola transformación a la vez; al desconectar
se pierden (KEEP_TYPE 0), siguen corriendo (1) o se pausan (2). Los efectos se suman por número de efecto
(+% EXP, +% oro, transformación en monstruo). Las transformaciones además cambian las recompensas: EXP y oro por
muerte, límite de muertes y drops propios (ver `BuffDefine`). `GestorBuffs` en la librería.
