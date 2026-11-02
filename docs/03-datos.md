# 3. Datos del juego: un juego dirigido por datos

El código de MiniFighter casi no tiene contenido adentro. Qué objetos existen, cuánto cuestan, qué hace cada
poción, qué suelta cada monstruo, qué zonas hay: todo son **tablas**. El código las carga al arrancar y las
interpreta. Por eso un diseñador puede agregar 164 paquetes nuevos a la tienda sin recompilar (lo que se hizo).

## Formato de bloques

Todas las tablas de definición usan el mismo formato de texto (cp949):

```
*ITEM_INFO
{
	*INDEX			0
	*TYPE			5
	*NAME			"[Menor]Pocion HP"
	*PRICE			2000
	*ENABLE_TRADE		1
	*MAX_ITEM_COUNT		99
	*SELL_COUNT		20
	*BUFF_INDEX		-1
}
```

- `*ETIQUETA` + `{ ... }` = una fila. Dentro, `*CLAVE valor [valor...]`.
- Una clave puede repetirse (`*DROP_ITEM 282 0.1` varias veces = lista).
- Fuera de bloques hay líneas sueltas de configuración (`*MIX_CARD 5 5 0.30`).
- Lector genérico: [`lib/src/datos/bloques.ts`](../lib/src/datos/bloques.ts). Probado con los archivos reales:
  5651 objetos, 67 cartas, 239 buffs, 65 tablas de drop, 65 monstruos, 163 zonas, 99 premios de nivel.

## Las tablas principales

| Archivo | Bloque | Define | Campos clave |
|---|---|---|---|
| `ItemDefine` | `ITEM_INFO` | 5651 objetos | TYPE, USE_TYPE, REQUEST_LEVEL, PRICE, CASH_PRICE, ENABLE_TRADE/DROP/SELL, MAX_ITEM_COUNT, SELL_COUNT, rangos MIN/MAX de stats, USE_PERIOD_HOUR, BUFF_INDEX |
| `CardDefine` | `CARD_INFO` | stats de cada tipo × nivel de carta | PUNCH/KICK_POWER, DEFENCE, HP, MP, SKILL, ADVSKILL, SPECIAL, CATCH |
| `MixInfo` | líneas | probabilidades de fusión | MIX_CARD tipo nivel prob, LUCKY_CARD_PROBABILITY, MIX_ALPHABET_PROBABILITY |
| `BuffDefine` | `BUFF_INFO` | 239 buffs | KEEP_TYPE, KEEP_TIME, EFFECT n valor, EXP/COIN_PER_ONE_KILL, DROP_ITEM |
| `BattleDropItem` | `DROP_INFO` | 65 tablas de botín | INDEX, DROP_ITEM objeto prob (repetido) |
| `EnemyStatDefine` | `ENEMY_STAT` | stats por monstruo y nivel | HP, DEFENCE, POWER (y \_2, \_3... por nivel) |
| `ZoneDefine` | `ZONE_INFO` | 163 zonas | PROJECT (mapa .mif), ENABLE_PARTY/FISHING/..., EXIT_ZONE, WORLD_INDEX |
| `EventLevel` | `LEVEL_LIST` | premio al alcanzar cada nivel | LEVEL, ITEM_LIST, ITEM_COUNT, MIFA |
| `QuestDefine` | `QUEST_INFO` | misiones | MOB_INDEX, MOB_COUNT, COMPLETE_EXPERIENCE/MONEY/ITEM |
| `ShopCatalog.txt` | líneas `tienda pestaña objeto precio` | lo que se vende | generado desde `catalogo.csv` |

## El patrón Base + Define

En el código, cada tabla es una pareja de clases (aparece igual en cliente y servidor):

- `CItemBase` / `ItemBase`: **una fila** (un objeto).
- `CItemDefine` / `ItemDefine`: **la tabla**, un singleton que se carga una vez (`TSingleton<ItemDefine>.CreateInstance()`
  en `Program.Main`) y responde `GetItemBase(id)`.

El cliente tiene 15 de estas parejas (Item, Buff, Enemy, EnemyMissile, Zone, CashItemList, ShopItemList,
KamilaShopList, CoinShopList, MedalShopList, MonsterChange, SkyEnemy...). En la librería: `Tabla<T>` en
[`lib/src/datos/tabla.ts`](../lib/src/datos/tabla.ts).

## Cliente y servidor leen la misma tabla

El precio que el cliente muestra sale de su `ItemInfo.dat`; el que el servidor cobra, de su `ItemDefine.txt`.
Si no coinciden, el jugador ve un precio y paga otro (pasó). La solución del proyecto (`tools\shop\tienda.py`):

```
catalogo.csv  ──generar──>  data\*.dax (cliente)   +   define\ShopCatalog.txt (servidor)
     ▲
  única fuente de verdad, editable en una planilla
```

Para un juego nuevo: las tablas viven en un solo lugar (JSON/CSV en el repositorio), el servidor las carga y el
cliente las recibe del servidor o del mismo paquete de build.

## Formatos binarios del cliente

| Extensión | Qué es | Cómo se lee |
|---|---|---|
| `.dat` | Una tabla de arriba, cifrada | Cabecera de 51 bytes + cuerpo TEA (32 rondas, clave `E4CBB478 A946D929 BA72D541 15752A28`) + suma de control en el byte 0x12. Herramienta: `MiniFighter\tools\mfdat.py` |
| `.ark` | Paquete de recursos | **ZIP común** con `.spr` y `.ani` adentro |
| `.spr` | Hoja de sprites | [ver render](04-cliente-y-render.md) |
| `.ani` | Animaciones: qué cuadros del `.spr` y en qué orden | 64 bytes cifrados + tablas de índices (sin terminar de descifrar) |
| `.mif` | Mapa de una zona | sin analizar |
| `Text(kor).dat` | Textos de la interfaz | **sin cifrar**, UTF-16: `<_CLAVE_> <texto>` (3783 textos) — base para traducir |

Por qué cifrar los `.dat`: para que el jugador no edite los precios o las probabilidades en su disco. No sirve de
mucho (la clave está en el exe) y además no importa si el servidor es autoritativo: el servidor usa SUS tablas.
