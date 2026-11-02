# Cajas con contenido fijo o aleatorio

**Problema que resuelve:** empaquetar varias recompensas en un objeto (paquetes de la tienda, botín de jefe,
premios de evento) con partes fijas y partes al azar.

## Reglas
- Contenido = lista de entradas; **todas** se entregan, salvo "uno de" que elige una opción (con pesos).
- Entradas: objeto fijo, moneda en un rango, uno de varios, un objeto cualquiera de un grupo (por ejemplo "de la
  tienda cash").
- Abrir (tirar el contenido) y entregar son pasos separados: se puede mostrar lo que salió antes de darlo.
- Entregar es **todo o nada**: si algo no entra, no se abre (o se manda por [correo](correo.md)).
- Calcular el valor esperado antes de ponerle precio.

## En MiniFighter
Los datos del juego no traían el contenido de las cajas: el proyecto creó `define/ContenidoCajas.txt`
(`GameClient.Boxes.cs`) con el formato `id <tab> mifa 1000-5000; item 17 x3; uno: a / b; tienda cash`, más
`carta TIPO estrellas fila` para cartas. Los 164 paquetes de la tienda cash (`GameClient.Packages.cs`) usan lo mismo.

## Variantes
- Llaves: la caja se abre solo con otro objeto (monetización clásica).
- Cajas con "lástima" (ver [rareza](rareza.md)).
- Mostrar las probabilidades al jugador (obligatorio en varios países para cajas pagas).

## En la librería
`inventario/cajas.ts`: `leerContenido` (formato de ContenidoCajas, con `@peso` opcional), `abrirCaja`,
`entregarPremios`, `monedaEsperada`.
