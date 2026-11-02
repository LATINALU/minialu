# 12. Cómo armar un juego nuevo con esto

## Arquitectura de referencia

```
 contenido/            JSON/CSV: objetos, cartas, monstruos, drops, tiendas, niveles  (diseño)
     │ validar al arrancar
     ▼
 servidor/
   red/         WebSocket + Despachador (paquetes o JSON)        ← lib/red
   casos-de-uso comprar, vender, fusionar, terminarPartida...    ← orquestan dominio + repositorio
   dominio/     minialu-mecanicas (Inventario, Billetera, ...)   ← lib/ (puro, probado)
   repositorio/ Postgres: una transacción por caso de uso + ledger de movimientos
 cliente/
   motor (Godot/Phaser/Unity), escenas = pantallas, UI = ventanas
   recibe el estado del servidor; nunca decide recompensas
```

## Un caso de uso de ejemplo

```ts
// servidor/casos-de-uso/comprar.ts
export async function casoComprar(db: Db, sesion: Sesion, objeto: number) {
  return db.transaccion(async (tx) => {
    const jugador = await tx.cargarJugador(sesion.personajeId);          // Inventario + Billetera
    const r = comprar({
      catalogo, tienda: "npc", objeto,
      inventario: jugador.inventario,
      pago: pagoConBilletera(jugador.billetera, "oro"),
      nivelJugador: jugador.nivel,
      nivelRequerido: (id) => objetos.requerir(id).nivel,
    });
    if (r.ok) {
      await tx.guardarJugador(jugador);
      await tx.registrarMovimiento(jugador.id, "oro", -r.valor.articulo.precio, "tienda", objeto);
    }
    return r;                                                            // -> paquete de respuesta
  });
}
```

## Recetas: cambiar de juego cambiando datos

| Juego nuevo | Qué se reusa | Qué se cambia |
|---|---|---|
| RPG de acción online | todo | contenido, render, combate autoritativo |
| Juego de cartas coleccionables | cartas (rareza, fusión, mejora), economía, tienda, subasta | combate por turnos |
| Tycoon / granja | inventario, billetera, tienda, venta, buffs (bonificaciones temporales), niveles | sin combate; fuentes = producción |
| Juego de mascotas | fusión (evolucionar), mejora, buffs, drops (cofres), niveles | stats → necesidades |
| Shooter con progresión | niveles, recompensa por partida, tienda, cajas (rareza) | sin inventario de pilas |

## Agregar una mecánica nueva a la librería

1. Escribir su ficha en `mecanicas/` con la [plantilla](../mecanicas/README.md#plantilla).
2. Implementarla en `lib/src/<área>/` como funciones/clases puras: entra estado + datos + `Azar`/`Reloj`, sale
   `Resultado`.
3. Constantes del juego de origen como `NOMBRE_MINIFIGHTER` (o del juego que sea) para tener la referencia.
4. Tests en `lib/test/` con `AzarSemilla`/`azarFijo` y `RelojManual`.
5. Exportarla en `lib/src/index.ts` y sumarla al índice de `mecanicas/README.md`.

## Pendientes del análisis (para seguir aprendiendo)

- Formato `.ani` (animaciones) y `.mif` (mapas): con eso se pueden reconstruir escenas completas.
- Misiones: 129 en `Quest.dat`, protocolo C→S 124 / S→C 119 (ver `MiniFighter\docs\MISIONES.md`).
- Runas, coliseo, torre de la oportunidad, pesca: sistemas del cliente sin servidor todavía.
