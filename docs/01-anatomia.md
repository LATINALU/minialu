# 1. Anatomía de un juego online

## Las piezas

```
 ┌──────────┐  usuario/clave   ┌─────────────────────── Cliente (Client.exe, C++) ───────────────────────┐
 │ Launcher │ ───────────────> │ escenas · interfaz · render por software · sonido · red · datos (.dat)  │
 └──────────┘  (portapapeles)  └───────┬──────────────────────┬──────────────────────────┬──────────────┘
                                       │ TCP 21872            │ TCP 20000 / 23001        │ UDP/TCP 30643
                               ┌───────▼───────┐      ┌───────▼────────┐        ┌─────────▼──────────┐
                               │ Lista de      │      │ Servidor de    │        │ ProudNet (P2P)     │
                               │ servidores    │      │ canal y juego  │        │ movimiento/combate │
                               └───────────────┘      │ (KartNew.exe)  │        │ entre clientes     │
                                                      └───────┬────────┘        └────────────────────┘
                                                              │ SQL
                                                      ┌───────▼────────┐   define\*.txt  (mismas tablas
                                                      │ MariaDB        │   que usa el cliente)
                                                      │ mf_game        │
                                                      └────────────────┘
```

| Pieza | Responsabilidad | En un juego nuevo |
|---|---|---|
| Launcher | Autenticación, actualizaciones, arrancar el cliente con los parámetros | Launcher web/Steam o pantalla de login dentro del juego |
| Cliente | Mostrar, recibir entradas, predecir movimiento, reproducir sonido | Motor (Godot/Unity/Phaser/Three) |
| Datos | Definen el contenido: objetos, cartas, monstruos, zonas, buffs, drops | JSON/CSV versionados, generados desde una planilla |
| Servidor de lista | Decir qué servidores existen y su IP | Un endpoint HTTP |
| Servidor de juego | Reglas, economía, persistencia, salas | API + WebSocket, **autoridad sobre todo lo que vale dinero** |
| P2P (ProudNet) | Sincronizar el combate entre jugadores | Servidor autoritativo o relay; P2P = trampas fáciles |
| Base de datos | Cuentas, personajes, inventario, banco, subasta | Postgres/MySQL con transacciones |

## El viaje: del doble clic a la partida

1. **Launcher** pide usuario y contraseña y los deja en el portapapeles con el formato
   `IP,PUERTO,usuario,clave,parametros` (formato de Netmarble). Arranca `Client.exe` e inyecta un proxy de red.
2. **Arranque del cliente**: carga las tablas `data\*.dat` (descifra TEA), las imágenes de la interfaz y conecta.
3. **Lista de servidores** (TCP 21872) → el cliente elige canal.
4. **Canal / login** (TCP 20000): valida la cuenta (`LoginHandler`), el servidor manda la clave de sesión.
5. **Juego** (TCP 23001): paquete 0 `OnLogin` → el servidor carga TODO el jugador de la base (info, cartas,
   objetos, equipo, buffs, misiones) en memoria y manda `SendMyInfo`.
6. **Pueblo** (zona): el jugador se mueve; el servidor solo sabe en qué zona está. Los demás jugadores de la zona
   forman un grupo P2P y se ven entre ellos.
7. **Sala** (`OnRoomMake` / `OnRoomIn` / `OnReady` / `OnGameLoad`) → partida PvP o mazmorra.
8. **Durante la partida** el combate corre entre clientes (P2P). El servidor recibe resultados: muertes
   (`OnMyKill`), monstruos muertos (`OnKillNPC`), fin (`OnGameEnd`).
9. **Fin**: el servidor calcula EXP, oro y carta ganada ([progresión](08-progresion.md)), los suma en memoria y
   los manda.
10. **Desconexión**: `OnDisconnect` guarda todo a la base (`SaveUserInfoVariable`, `SaveCards`, `SaveItems`, buffs).

> Fijarse en el punto 10: el estado vive en memoria y se guarda al salir. Si el servidor se cae, se pierde la
> sesión de todos. Ver [lecciones](11-lecciones.md).

## Los tres "mundos" de datos

| Mundo | Dónde vive | Quién lo cambia | Ejemplo |
|---|---|---|---|
| **Definiciones** (contenido) | archivos `define\` y `data\` | diseñadores | "La poción cuesta 2000 y cura 300" |
| **Estado del jugador** | base de datos + memoria del servidor | el servidor, por reglas | "Ana tiene 14 pociones" |
| **Estado de la partida** | memoria del servidor y de los clientes | la simulación | "Ana tiene 1200 HP ahora" |

Separar estos tres mundos es la decisión de arquitectura más importante, y MiniFighter la respeta: el código no
tiene precios ni nombres de objetos, los lee de las tablas. Eso es lo que hace que sus mecánicas sean reutilizables.
