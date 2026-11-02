# 4. Cliente y render: cómo se dibuja Mini Fighter

Fuentes: imports del `Client.exe` desempaquetado (Remastered ES), RTTI (`rea\client_classes.txt`, 424 clases),
`rea\client_decomp.c`, `MiniFighter\tools\spr2png.py`.

## Con qué está hecho (imports)

| DLL | Para qué | Funciones |
|---|---|---|
| `DDRAW` | Pantalla | **solo `DirectDrawCreateEx`**: se usa para presentar el cuadro terminado, no para dibujar |
| `GDI32` | Texto y fuentes | `CreateFontA`, `TextOutW`, `CreateDIBSection`, `BitBlt` |
| `DINPUT8` | Teclado y joystick | `DirectInput8Create` |
| `OpenAL32` + `DSOUND` | Sonido (efectos y música en streaming) | `alGenSources`, `alSourceQueueBuffers`... |
| `WINMM` | Reloj del juego y MIDI/CD | `timeGetTime`, `timeSetEvent` |
| `ijl15` | Imágenes JPEG (Intel JPEG Library) | |
| `WS2_32` | Red TCP/UDP | `WSASendTo`, `WSARecv`... |
| `IMM32` | Escribir en coreano/chino (IME) | |
| `WININET` | Bajar avisos/eventos por HTTP | |

## Render por software en 16 bits

El cliente **no usa la tarjeta de video para dibujar**. Todo se compone en memoria, píxel por píxel:

1. Hay un búfer de 800×600 en **RGB565** (16 bits por píxel: 5 rojo, 6 verde, 5 azul).
2. Cada cuadro se compone por capas (fondo de la zona `*Back.spr` → mapa → personajes/monstruos → efectos →
   interfaz → texto con GDI). El orden exacto de cada escena no se verificó función por función; es el esquema
   general que muestran los recursos que carga cada una.
3. Los sprites se copian ("blit") al búfer saltando el color **0xF81F** (magenta) = transparente (*color key*).
4. Los efectos semitransparentes mezclan con alfa de 0 a 32 usando un truco de máscaras: rojo y azul (`0xF81F`)
   se multiplican juntos en una sola operación y el verde (`0x07E0`) aparte (`FUN_0055f5f0`, que además procesa
   varios píxeles por vez con registros de 64 bits).
   En la librería: `escalar565` / `mezclar565`.
5. DirectDraw solo copia el búfer terminado a la ventana.

Por eso el juego necesita "modo de color 16 bits" en Windows modernos y por eso `cnc-ddraw` (reemplazo de
`ddraw.dll`) puede escalarlo a HD: intercepta ese último paso.

## Formato `.spr`

```
[64 bytes de cabecera cifrada][u32 0x7A6][u32 cantidad de cuadros]
por cuadro: [u32 ancho][u32 alto][ancho × alto × u16 RGB565]
cuadro vacío: FFFFFFFF FFFFFFFF + u16
```

Decodificador: [`lib/src/assets/sprites.ts`](../lib/src/assets/sprites.ts) (devuelve RGBA listo para `ImageData`).
Probado con los sprites sueltos de `data\`: 73 de 83 se leen (401 cuadros); `Loader*.spr` y otros 7 usan una variante.

Un personaje = un `.ark` (ZIP) con su `.spr` (todos los cuadros) y su `.ani` (qué cuadros forman cada acción:
quieto, caminar, golpe, patada, especial...). Ejemplos: `Xiah.ark`, `Tien.ark`, `Hikaru.ark`; `*_ForTown.ark` es la
versión liviana para el pueblo.

## Arquitectura del cliente (por nombres de clases)

```
CGlobalManager ── raíz: managers y estado global
 ├─ Escenas (CSceneBase)        una por pantalla: CSceneLobby, CSceneRoom, CSceneDungeonRoom, CSceneWorldMap,
 │                              CSceneCashShop, CSceneCardMix, CSceneAuction, CSceneBank... (≈50)
 │    └─ Interfaz (CUIBase)     una ventana por función: CUIInventory, CUICardMix, CUIAuction, CUIBank... (≈250)
 │         └─ Controles (CUIControl) Button, EditBox, ListBox, ComboBox, Scroll, TabCtrl, Progress, ToolTip,
 │                                    ItemIcon, CardIcon...  + CUIEventPump (reparte clics y teclas)
 ├─ Definiciones (Base+Define)  CItemDefine, CBuffDefine, CEnemyDefine, CZoneDefine, CCashItemListDefine...
 ├─ Managers                    CSpriteManager, CSoundManager, CMusic, CMissileManager, CBuffManager,
 │                              CCoolTimeManager, CUserManager, CAiNPCManager, CMsgManager, CListObjectManager
 ├─ Mundo                       CZoneBase, CPortal, CNavimap (minimapa), CEnemyBase, CMissile, CEfx (efectos)
 ├─ Red                         ServerListClient_Socket, ChannelServerClient_Socket, GameServerClient_Socket,
 │                              MessengerServerClient_Socket, CUDPClient
 └─ Eventos de temporada        CEvent + ~40 subclases (CEventSongpyun, CEventPepero, CXMasEvent...)
```

Patrones para copiar:
- **Escena = pantalla, UI = ventana, Control = widget.** Una escena activa a la vez; las ventanas se apilan.
- **Un manager por recurso** (sprites, sonido, misiles): carga perezosa y caché por nombre de archivo.
- **Eventos de temporada como clases** que se enchufan (CEvent): el juego cambiaba cada mes sin tocar el núcleo.
  En un motor moderno: datos + un script por evento.
- **Una escena por mecánica de cartas** (fusionar, mejorar, dividir, extraer, despertar, furia...): cada sistema de
  la economía tiene su pantalla; el servidor tiene su paquete. Diseño vertical, fácil de agregar.

## Traducirlo a un motor actual

| Original | Hoy |
|---|---|
| Búfer RGB565 + blit por software | GPU: sprites como texturas, atlas, shaders |
| Color key 0xF81F | PNG con canal alfa (`decodificarSpr` ya convierte) |
| `.ani` con índices de cuadros | Animaciones del motor (AnimatedSprite, Animator) |
| 800×600 fijo | Resolución lógica + escalado |
| DirectInput | Input del motor (teclado, mando, táctil) |
| OpenAL/DirectSound | Audio del motor |
