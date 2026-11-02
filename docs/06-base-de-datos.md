# 6. Base de datos

Esquema completo: [`referencia/mf_game.sql`](../referencia/mf_game.sql) (MariaDB 10.5). Tablas agregadas por el
proyecto: `auction`, `bankitem`, `bankcard`, `userbuff`.

## Modelo

```
userinfo (cuenta)            1 ── 1  userinfovariable (progreso)
  UserIndex, UserID, clave,           Experience, UserLevel, Coin (oro), Win/Lose, UserZone, PosX/Y,
  NickName, Cash, IsBlocked           MaxCharSlot, RemainingSP/TotalSP, SkillData, VipUntil...
     │
     ├── 1..N  mychardata   personajes del jugador (cartas "puestas" en las casillas de personaje)
     ├── 1..N  carddata     cartas en el inventario de cartas
     ├── 1..N  iteminfo     objetos: ItemInventory (pestaña), ItemSlot, ItemNumber (id), ItemCount,
     │                      stats propios del ejemplar (PunchPower...), ItemOption "op:valor,op:valor"
     ├── 1..N  equipinfo    objetos equipados por personaje (CharType, EquipSlot)
     ├── 1..N  bankitem / bankcard   banco (70 + 70)
     ├── 1..N  userbuff     buffs que sobreviven a la desconexión
     ├── 1..N  questdata    misiones en curso
     ├── N..N  frienddata   amigos
     └── N..1  guildmemberlist ─ guilddata (gremios: puntos, victorias)
auction (compartida)          vendedor, comprador, precio, estado, vence, Data (objeto/carta serializado)
```

## Decisiones del original, buenas y malas

| Decisión | Evaluación |
|---|---|
| **Cuenta separada del progreso** (`userinfo` / `userinfovariable`) | Buena: lo que cambia cada partida está aparte de los datos de la cuenta. |
| **Cada ejemplar de objeto es una fila con sus stats** (`iteminfo.PunchPower...`) | Buena para objetos con stats aleatorios; las pilas (pociones) son una fila con `ItemCount`. |
| **Oro en `userinfovariable.Coin`, cash en `userinfo.Cash`** | Buena: la moneda de pago real separada de la del juego. |
| Opciones como texto `"0:15,3:200"` | Rápido de hacer, imposible de consultar ("¿quién tiene +200 HP?"). Mejor: tabla `item_option` o JSON. |
| Contraseñas en texto plano | **Mala**: siempre hash (argon2/bcrypt). |
| Índices propios en tablas `*index` (`carddataindex`, `iteminfoindex`) | Generar ids a mano; mejor `AUTO_INCREMENT`/secuencias. |
| Fechas por defecto `2017-06-20` | Valor mágico; mejor `NULL` o `CURRENT_TIMESTAMP`. |
| Sin transacciones en compras/intercambios | **Mala**: una caída a mitad puede duplicar o perder objetos. |
| Sin registro histórico de oro | Los `.log` en archivos suplen; mejor una tabla `ledger` (ver [economía](07-economia.md)). |

## Esquema recomendado para un juego nuevo (mínimo)

```sql
cuenta(id, usuario UNIQUE, hash_clave, creada, bloqueada)
personaje(id, cuenta_id, nombre UNIQUE, nivel, experiencia, zona, x, y)
saldo(personaje_id, moneda, monto, PRIMARY KEY(personaje_id, moneda))        -- oro, cash, fichas...
objeto(id, personaje_id, contenedor, pestana, casilla, definicion_id, cantidad, extra JSON,
       UNIQUE(personaje_id, contenedor, pestana, casilla))                     -- contenedor: mochila/banco/equipo
movimiento(id, fecha, personaje_id, moneda, delta, motivo, referencia)        -- libro contable de TODO el valor
subasta(id, vendedor_id, objeto JSON, precio, estado, vence, comprador_id)
buff(personaje_id, buff_id, persistencia, vence, restante_ms)
```

La tabla `movimiento` (ledger) es lo que más le faltó al original: cada oro que entra o sale tiene un motivo
("partida", "tienda", "subasta", "fusión"), y con eso se miden las fuentes y sumideros de la economía.
