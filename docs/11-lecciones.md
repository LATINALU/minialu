# 11. Lecciones y antipatrones

Todo lo de esta lista se encontró en el servidor real (auditoría del 27 de octubre de 2026, logs de excepciones
del servidor original) y se corrigió en el proyecto MiniFighter. La librería ya nace con cada corrección.

| # | Problema | Síntoma | Regla | En la librería |
|---|---|---|---|---|
| 1 | `System.Random` compartido entre hilos | Todas las cajas/drops salían iguales hasta reiniciar | Azar inyectado; uno por hilo o con candado | `Azar`, `AzarSemilla` |
| 2 | SQL armado con texto | Un apodo con `'` ejecutaba SQL | Consultas parametrizadas, siempre | (fuera de alcance: usar el driver) |
| 3 | `Thread.Sleep(100)` y volcado a consola por paquete | Lag para todos | Nada bloqueante en el camino de un paquete | `Despachador` sin esperas |
| 4 | Error en un manejador = desconexión | Jugadores expulsados por bugs menores | Aislar errores por paquete y registrarlos | `Despachador(alError)` |
| 5 | Precio del cliente ≠ precio del servidor | Se cobraba otro precio | Una sola fuente de datos | `Catalogo` |
| 6 | El servidor vendía cualquier id | Objetos de GM comprables | Lista blanca de lo que se vende | `comprar` → `no-a-la-venta` |
| 7 | Cobrar antes de entregar | Inventario lleno = dinero perdido | Validar todo, entregar, cobrar | `comprar` |
| 8 | Probabilidad 0~1 comparada con entero 0~9 | 30% salía 10% | Unidades explícitas en los datos | probabilidades 0~1 documentadas |
| 9 | Tablas incompletas (`KeyNotFoundException`) | La fusión se cortaba | Valor por defecto explícito y validación al arrancar | `probabilidad(...) ?? 1` |
| 10 | Variable de bucle reutilizada (`i`) | Solo el primero del grupo recibía EXP | Funciones chicas y probadas | tests |
| 11 | Comparador de ordenamiento inconsistente | Excepción al ordenar con objetos iguales | Orden total (desempatar) | `Inventario.ordenar` |
| 12 | Premios que apuntan a objetos inexistentes | Correo imposible de cobrar | Validar referencias entre tablas | `Tabla.requerir` |
| 13 | Contraseñas en texto plano | — | Hash | (esquema recomendado) |
| 14 | Estado solo en memoria, guardado al salir | Caída = progreso perdido | Transacción por operación económica | (esquema `movimiento`) |
| 15 | El cliente decide el combate (P2P) | Trampas | Servidor autoritativo para lo que da recompensas | — |
| 16 | División entera en fórmulas | Participación 400 o 0 | Revisar tipos en fórmulas | `recompensaPartida` |
| 17 | Una clase de 9.864 líneas | Imposible de probar | Un módulo por sistema, dominio puro | estructura de `lib/` |

## Cinco principios que salen de todo esto

1. **Datos fuera del código**, con una sola fuente de verdad y validación al arrancar.
2. **Dominio puro**: las reglas no conocen sockets ni SQL; se prueban en milisegundos.
3. **El servidor es la autoridad** de todo lo que vale algo.
4. **Todo o nada** en cada operación que mueve valor, y un **registro** de cada movimiento.
5. **Azar y tiempo inyectados**: lo que no se puede repetir no se puede depurar.
