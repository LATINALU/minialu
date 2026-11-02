# 5. Servidor

Fuente: `MiniFighter\server_src\` — KartNew, un emulador hecho por la comunidad sobre la base de uno de
KartRider (por eso hay clases `Kart*`, `Track*` sin uso). .NET Framework 4.5, ~36.000 líneas, recompilable con
`dotnet build server_src\KartNew\KartNew.csproj -c Release`.

## Arranque (`Program.Main`)

```
1. Leer credenciales (db.txt) y probar la base         Database.Test / Analyze
2. Limpiar estado sucio: "nadie está conectado"         UPDATE UserInfoVariable SET ConnectChannel = -1
3. Arrancar los listeners de red                        GameServer.Start
4. Cargar TODAS las tablas en singletons                UserLevel, ZoneDefine, CharCardDefine, ItemDefine,
                                                        CardGenerator(MixInfo), EnemyDefine, EnemyStatDefine,
                                                        KamilaShop, ShopCatalog, QuestData, EventLevel
5. Bucle de consola para comandos de administrador      /stop, /aa ...
```

Detalle a mejorar: la red arranca (3) antes de cargar las tablas (4); un jugador rápido podría entrar con las
tablas a medio cargar. Orden correcto: datos → validación de datos → red.

## Organización del código

| Carpeta | Contenido |
|---|---|
| `Common\KartRider.Net` | `Session` (socket, tramas, cifrado), `DogCrypto` |
| `Common\KartRider.IO.Packet` | `InPacket` / `OutPacket` |
| `Common\KartRider.Data` | Acceso a MySQL con SQL armado como texto (`Database.FormatSafe` escapa) |
| `KartNew\KartNew.Handler` | Login, canal, salas (separados del juego) |
| `KartNew\KartNew\GameClient.cs` | **La sesión del jugador: 9.864 líneas** con casi toda la lógica |
| `GameClient.*.cs` (partial) | Lo agregado en el proyecto, un archivo por sistema: Shop, Bank, Auction, Buffs, Boxes, Drops, Vip, CardItems... |
| `CardGenerator`, `ExperienceCalculation`, `UserLevel` | Reglas de cartas, recompensas y niveles |
| `Room`, `GameRoom`, `DungeonRoom`, `ZoneBase` | Salas PvP, mazmorras (4 jugadores), zonas |
| `Trade`, `AuctionHouse`, `KamilaShop`, `ShopCatalog` | Economía |
| `C2C`, `C2S`, `S2C` | Stubs de ProudNet (P2P) |

## El "objeto dios" GameClient

`GameClient` es a la vez: la conexión, el jugador (oro, nivel, inventario, cartas en campos privados), el
despachador de paquetes y la lógica de todos los sistemas. Funciona, pero:

- Cualquier sistema puede tocar el oro directamente (`_coin += x`) → difícil saber de dónde sale el dinero.
- No se puede probar una regla sin un socket y una base de datos.
- Agregar un sistema = editar el archivo más grande del proyecto.

El proyecto empezó a separarlo con archivos `partial` por sistema. El siguiente paso es lo que hace la
[librería](../lib/): **reglas puras** (inventario, tienda, subasta) que reciben el estado y devuelven el resultado,
y una sesión delgada que solo traduce paquetes ↔ llamadas.

```
Paquete ─> Despachador ─> Caso de uso (tienda.comprar) ─> Dominio puro (Inventario, Billetera, Catalogo)
                                                       └─> Repositorio (guardar en la base, en transacción)
```

## Estado en memoria y persistencia

- Al entrar (`OnLogin`) se carga todo el jugador a memoria; se juega en memoria; al salir (`OnDisconnect`) se guarda.
- El cash, en cambio, se lee y escribe directo en la base en cada compra (con un `lock` global `s_cashLock`).
- La subasta es compartida: lista en memoria + tabla `auction`, cada cambio se guarda al momento.

Riesgo: una caída del servidor pierde el progreso de la sesión de todos, y un error entre "dar objeto" y "cobrar"
puede duplicar o perder cosas. Para un juego nuevo: **cada operación económica = una transacción de base de datos**
(o un registro de eventos), no "guardar al salir".

## Concurrencia

Un hilo por evento de socket; los jugadores se tocan entre sí (comercio, salas, subasta) con `lock`. Problemas
encontrados en la auditoría: `System.Random` compartido entre hilos se corrompía y devolvía siempre 0 (todas las
cajas iguales hasta reiniciar) → `SafeRandom` con candado. Para un juego nuevo: un hilo/actor por sala o un bucle de
eventos único (Node), y el azar inyectado (`Azar` en la librería).

## Herramientas de operación que valen la pena

- Comandos de GM por chat (`/dar`, `/oro`, `/nivel`, `/buff`, `/evento`): imprescindibles para probar.
- Modo prueba por archivo (`ModoPrueba.txt`): reglas relajadas sin recompilar.
- Registros por sistema (`CardGenerator.log`, `ItemBuy.log`, `CashItemBuy.log`): toda generación de valor queda
  escrita. Es lo que permite investigar un duplicado o una queja.
- `--revisar-tienda`: el servidor valida sus datos sin arrancar (objetos a la venta que no se pueden usar).
