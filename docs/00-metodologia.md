# 0. Metodología: cómo se le hace ingeniería inversa a un juego

Un juego online abandonado se compone de tres cosas que hay que abrir con herramientas distintas:

| Pieza | Formato | Herramienta | Qué se obtiene |
|---|---|---|---|
| Servidor `KartNew.exe` | .NET (C#, bytecode IL) | decompilador .NET (ILSpy/dnSpy) + **REA** (`inspect_managed_artifact`) | Código C# casi original: nombres de clases, métodos y campos. Se pudo **recompilar**. |
| Cliente `Client.exe` | C++ nativo x86 empaquetado con MoleBox | volcado de memoria + **Ghidra** + **REA** (`inspect_pe_imports`) | Pseudo-C sin nombres (`FUN_005eaa80`), pero con **RTTI**: 424 nombres de clases. |
| Datos `data\*.dat`, `.ark`, `.spr` | formatos propios | lectura de bytes + el código que los carga | Tablas de juego en texto, sprites, mapas. |

## Paso a paso (lo que se hizo con MiniFighter)

1. **Clasificar los binarios** (REA). `server_managed.json` dice "managed, dotnet-framework, il-only, 32-bit": es C#,
   o sea que se recupera casi todo el código. `client_imports.json` del cliente empaquetado solo mostraba 21 imports
   de `KERNEL32`/`USER32`: señal de que el exe está **empaquetado** (MoleBox) y hay que desempaquetarlo.
2. **Desempaquetar el cliente**: se arrancó el juego y se volcó la memoria ya descomprimida (`rea\Client_dump.exe`).
   La versión "Remastered ES" ya venía desempaquetada con la tabla de imports reconstruida (488 imports): mucho mejor.
3. **Leer los imports** (qué APIs del sistema usa) responde "¿con qué está hecho?" sin leer código:
   `DDRAW` (pantalla), `DINPUT8` (teclado), `OpenAL32` + `DSOUND` (sonido), `WS2_32` (red), `GDI32` (texto),
   `ijl15` (JPEG), `WINMM` (temporizador). Ver [cliente y render](04-cliente-y-render.md).
4. **RTTI**: los compiladores de C++ guardan los nombres de las clases con métodos virtuales. 424 clases
   (`CSceneCardMix`, `CUIAuction`, `CBuffManager`, `CItemDefine`...) dan el mapa de la arquitectura del cliente
   (`rea\client_classes.txt`).
5. **Decompilar con Ghidra** todo el cliente (`rea\client_decomp.c`, 33 MB, 40.087 funciones).
6. **Buscar por cadenas**: los nombres de archivos (`"CardMix.spr"`, `"Ani0001.ark"`) y textos de error llevan directo
   a la función que los usa. Así se encontró el cargador de recursos (`FUN_005eaa80`: abre un `.ani`/`.spr` suelto o
   desde dentro de un `.ark`) y el lector de `.dat` con su clave TEA (`FUN_004f76e0`).
7. **Buscar por constantes**: `0xF81F` (magenta en RGB565) llevó a la rutina de mezcla de colores; `0x7A6` al lector
   de sprites; `0x9E3779B9` (constante de TEA) al cifrado de datos.
8. **Mapear el protocolo**: se buscaron todas las llamadas a la función que escribe el número de paquete
   (`FUN_00544140(buf, id)`) → `rea\send_map.txt` = todo lo que el cliente puede enviar. Se cruzó con el `switch` del
   servidor para encontrar los paquetes que nadie manejaba (`rea\missing.txt`).
9. **Validar en vivo**: servidor con registro de paquetes (`LogPaquetes.txt`) + cliente real. Lo que el análisis
   estático no resuelve, lo resuelve una captura.

## Reglas que funcionaron

- **El código que carga un archivo es su documentación.** Para entender `.spr` no se adivinó el formato: se leyó
  la función que lo abre.
- **Del dato al código, no al revés.** Empezar por algo visible (un precio, un texto, un nombre de archivo) y
  buscar quién lo usa es más rápido que leer 40.000 funciones.
- **Cada hallazgo se anota** (en `docs\` del proyecto) con la función o archivo de origen, para poder volver.
- **Dos versiones del mismo juego** (S3 empaquetada, Remastered ES desempaquetada, 1.5 china) se comparan por
  dirección: lo que cambia entre ellas son parches y traducciones; lo que no, es el motor.

## REA en esta PC

REA (`npx rea-agents@6.8.0`) se usó el 25 y 27 de octubre; sus salidas están en `MiniFighter\rea\` y
`MiniFighter\rea\rea_27oct\`. Para un análisis nativo nuevo hace falta Ghidra 12.1 + JDK 21. Para este repositorio
alcanzó con esas salidas, el código del servidor y los datos; los imports completos del cliente se leyeron del
`Client.exe` desempaquetado de la versión Remastered ES con un lector PE mínimo.
