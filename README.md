# minialu — cómo está hecho un juego online, de punta a punta

Repositorio de estudio y reutilización armado con ingeniería inversa de **Mini Fighter Temporada 3**
(cliente C++ de 2010, servidor C# de la comunidad, base MariaDB). El objetivo no es el juego en sí, sino:

1. **Entender** cómo se compone un juego online completo: launcher, cliente, render, datos, red, servidor, base de datos.
2. **Catalogar** sus mecánicas (economía, progresión, gacha, combate) de forma que sirvan para otros juegos.
3. **Reusar** esas mecánicas desde una librería propia, sin red, sin base de datos y sin motor gráfico atados.

## Mapa del repositorio

| Carpeta | Qué hay |
|---|---|
| [`docs/`](docs/) | La anatomía del juego, capítulo por capítulo (leer en orden). |
| [`mecanicas/`](mecanicas/) | Catálogo de mecánicas: una ficha por mecánica con reglas, datos, números originales y variantes. |
| [`lib/`](lib/) | Librería TypeScript `minialu-mecanicas`: implementación limpia y probada de las mecánicas. |
| [`referencia/`](referencia/) | Esquema de la base de datos y muestras de los archivos de datos originales. |

## Recorrido de lectura

1. [Metodología de ingeniería inversa](docs/00-metodologia.md): cómo se sacó todo esto (REA, Ghidra, decompilación .NET).
2. [Anatomía de un juego online](docs/01-anatomia.md): las piezas y el viaje desde el doble clic hasta la partida.
3. [Red y protocolo](docs/02-red-y-protocolo.md)
4. [Datos del juego](docs/03-datos.md): el juego es "dirigido por datos".
5. [Cliente y render](docs/04-cliente-y-render.md): cómo se dibuja (por software, en 16 bits).
6. [Servidor](docs/05-servidor.md)
7. [Base de datos](docs/06-base-de-datos.md)
8. [Economía](docs/07-economia.md): fuentes, sumideros y por qué se infla el oro.
9. [Progresión](docs/08-progresion.md)
10. [Cartas y gacha](docs/09-cartas-y-gacha.md)
11. [Combate y PvE](docs/10-combate-y-pve.md)
12. [Lecciones y antipatrones](docs/11-lecciones.md): los errores del original que no hay que repetir.
13. [Cómo armar un juego nuevo con esto](docs/12-juego-nuevo.md)

## Usar la librería

Requiere Node 23.6 o más nuevo (ejecuta TypeScript directo, sin compilar ni instalar dependencias).

```bash
cd lib
npm test                      # 61 pruebas
node ejemplos/economia.ts     # simula 200 partidas: fuentes y sumideros de oro
```

```ts
import { Inventario, Billetera, pagoConBilletera, Catalogo, comprar } from "./lib/src/index.ts";

const inventario = new Inventario({ pestanas: 4, casillasPorPestana: 30, maxPila: (id) => tabla.buscar(id)?.maxPila });
const billetera = new Billetera({ oro: 5000 });
const catalogo = new Catalogo([{ tienda: "npc", pestana: 0, objeto: 0, precio: 2000 }]);
comprar({ catalogo, tienda: "npc", objeto: 0, inventario, pago: pagoConBilletera(billetera, "oro") });
// -> { ok: true, valor: { articulo, posiciones, saldoRestante: 3000 } }
```

## Origen y límites

- Fuentes analizadas (en otra carpeta, no copiadas acá): `Desktop\MiniFighter` — servidor `server_src\` (decompilado y
  recompilado), cliente `rea\client_decomp.c` (40.087 funciones de Ghidra), datos `server\Server MF\define\`.
- La librería es código **nuevo** escrito a partir de las reglas, no una copia del servidor. Los números originales
  (curva de EXP, probabilidades, precios) están como constantes `*_MINIFIGHTER` para comparar y como punto de partida.
- Gráficos, nombres y marca de Mini Fighter son de sus dueños (Netmarble / desarrolladores originales).
  Para un juego publicado: arte y nombres propios.
