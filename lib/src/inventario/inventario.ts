// Inventario por pestañas y casillas, con pilas. En MiniFighter: 4 pestañas de 30 casillas (5 con VIP),
// cada objeto con su MAX_ITEM_COUNT (pociones 99, equipo 1). El banco es otro inventario (70 casillas),
// así que mover objetos entre inventario y banco es `transferir`.
//
// Diferencia con el original: agregar y quitar son "todo o nada". El servidor original podía meter la mitad
// de una pila y perder el resto si no había lugar.

import { exito, fallo, type Resultado } from "../core/resultado.ts";

export interface Pila {
  readonly objeto: number;
  cantidad: number;
  /** Datos propios del ejemplar (stats aleatorios, fecha de vencimiento...). Solo pilas de 1. */
  readonly extra?: Readonly<Record<string, unknown>>;
}

export interface Posicion {
  readonly pestana: number;
  readonly casilla: number;
}

/** Lo único que el inventario necesita saber de un objeto. */
export type MaxPila = (objeto: number) => number | undefined;

export interface OpcionesInventario {
  readonly pestanas: number;
  readonly casillasPorPestana: number;
  readonly maxPila: MaxPila;
  /** Pestañas utilizables al empezar (por defecto todas). Las demás existen pero están cerradas (VIP). */
  readonly pestanasActivas?: number;
}

export type ErrorInventario = "objeto-desconocido" | "cantidad-invalida" | "sin-espacio" | "insuficiente" | "casilla-vacia";

export class Inventario {
  private readonly casillas: (Pila | null)[][];
  private readonly maxPila: MaxPila;
  private activas: number;

  constructor(op: OpcionesInventario) {
    this.casillas = Array.from({ length: op.pestanas }, () => Array<Pila | null>(op.casillasPorPestana).fill(null));
    this.maxPila = op.maxPila;
    this.activas = Math.min(op.pestanasActivas ?? op.pestanas, op.pestanas);
  }

  get pestanasActivas(): number {
    return this.activas;
  }

  /** Abre o cierra pestañas (VIP). Lo que haya en una pestaña cerrada se conserva pero no se usa. */
  cambiarPestanasActivas(n: number): void {
    this.activas = Math.max(0, Math.min(n, this.casillas.length));
  }

  en(p: Posicion): Pila | null {
    return this.casillas[p.pestana]?.[p.casilla] ?? null;
  }

  /** Recorre las casillas utilizables. */
  *posiciones(): Generator<Posicion> {
    for (let pestana = 0; pestana < this.activas; pestana++) {
      for (let casilla = 0; casilla < this.casillas[pestana].length; casilla++) {
        yield { pestana, casilla };
      }
    }
  }

  casillasLibres(): number {
    let n = 0;
    for (const p of this.posiciones()) {
      if (this.en(p) === null) {
        n++;
      }
    }
    return n;
  }

  contar(objeto: number): number {
    let total = 0;
    for (const p of this.posiciones()) {
      const pila = this.en(p);
      if (pila !== null && pila.objeto === objeto) {
        total += pila.cantidad;
      }
    }
    return total;
  }

  /** Cuántas unidades de `objeto` entran todavía (completando pilas y usando casillas vacías). */
  capacidadPara(objeto: number): number {
    const max = this.maxPila(objeto);
    if (max === undefined || max <= 0) {
      return 0;
    }
    let capacidad = 0;
    for (const p of this.posiciones()) {
      const pila = this.en(p);
      if (pila === null) {
        capacidad += max;
      } else if (pila.objeto === objeto && pila.extra === undefined) {
        capacidad += Math.max(0, max - pila.cantidad);
      }
    }
    return capacidad;
  }

  /** Agrega primero a pilas incompletas y después a casillas vacías. Todo o nada. */
  agregar(objeto: number, cantidad: number, extra?: Pila["extra"]): Resultado<Posicion[], ErrorInventario> {
    const max = this.maxPila(objeto);
    if (max === undefined) {
      return fallo("objeto-desconocido");
    }
    if (!Number.isInteger(cantidad) || cantidad <= 0 || (extra !== undefined && cantidad !== 1)) {
      return fallo("cantidad-invalida");
    }
    if (extra === undefined ? this.capacidadPara(objeto) < cantidad : this.casillasLibres() < 1) {
      return fallo("sin-espacio");
    }
    const tocadas: Posicion[] = [];
    let falta = cantidad;
    if (extra === undefined) {
      for (const p of this.posiciones()) {
        const pila = this.en(p);
        if (falta > 0 && pila !== null && pila.objeto === objeto && pila.extra === undefined && pila.cantidad < max) {
          const pone = Math.min(falta, max - pila.cantidad);
          pila.cantidad += pone;
          falta -= pone;
          tocadas.push(p);
        }
      }
    }
    for (const p of this.posiciones()) {
      if (falta > 0 && this.en(p) === null) {
        const pone = Math.min(falta, max);
        this.casillas[p.pestana][p.casilla] = extra === undefined ? { objeto, cantidad: pone } : { objeto, cantidad: pone, extra };
        falta -= pone;
        tocadas.push(p);
      }
    }
    return exito(tocadas);
  }

  /** Quita una cantidad repartida entre todas las pilas del objeto. Todo o nada. */
  quitar(objeto: number, cantidad: number): Resultado<Posicion[], ErrorInventario> {
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      return fallo("cantidad-invalida");
    }
    if (this.contar(objeto) < cantidad) {
      return fallo("insuficiente");
    }
    const tocadas: Posicion[] = [];
    let falta = cantidad;
    for (const p of this.posiciones()) {
      const pila = this.en(p);
      if (falta > 0 && pila !== null && pila.objeto === objeto) {
        const saca = Math.min(falta, pila.cantidad);
        pila.cantidad -= saca;
        falta -= saca;
        if (pila.cantidad === 0) {
          this.casillas[p.pestana][p.casilla] = null;
        }
        tocadas.push(p);
      }
    }
    return exito(tocadas);
  }

  /** Saca la pila entera (o parte) de una casilla y la devuelve. */
  sacarDe(p: Posicion, cantidad?: number): Resultado<Pila, ErrorInventario> {
    const pila = this.en(p);
    if (pila === null) {
      return fallo("casilla-vacia");
    }
    const n = cantidad ?? pila.cantidad;
    if (!Number.isInteger(n) || n <= 0 || n > pila.cantidad) {
      return fallo("cantidad-invalida");
    }
    if (n === pila.cantidad) {
      this.casillas[p.pestana][p.casilla] = null;
      return exito(pila);
    }
    pila.cantidad -= n;
    return exito({ objeto: pila.objeto, cantidad: n });
  }

  /** Coloca una pila en una casilla vacía concreta (por ejemplo, la que eligió el jugador en el banco). */
  ponerEn(p: Posicion, pila: Pila): Resultado<Posicion, ErrorInventario> {
    if (p.pestana >= this.activas || this.casillas[p.pestana]?.[p.casilla] === undefined) {
      return fallo("sin-espacio");
    }
    if (this.en(p) !== null) {
      return fallo("sin-espacio");
    }
    this.casillas[p.pestana][p.casilla] = { ...pila };
    return exito(p);
  }

  /** Ordena las pilas por id de objeto (botón "ordenar"). Comparador total: no rompe con objetos iguales. */
  ordenar(): void {
    const pilas: Pila[] = [];
    for (const p of this.posiciones()) {
      const pila = this.en(p);
      if (pila !== null) {
        pilas.push(pila);
      }
      this.casillas[p.pestana][p.casilla] = null;
    }
    pilas.sort((a, b) => a.objeto - b.objeto || b.cantidad - a.cantidad);
    let i = 0;
    for (const p of this.posiciones()) {
      if (i < pilas.length) {
        this.casillas[p.pestana][p.casilla] = pilas[i++];
      }
    }
  }

  /** Copia para simular una operación sin tocar el original. */
  clonar(): Inventario {
    const copia = new Inventario({
      pestanas: this.casillas.length,
      casillasPorPestana: this.casillas[0]?.length ?? 0,
      maxPila: this.maxPila,
      pestanasActivas: this.activas,
    });
    this.casillas.forEach((fila, t) => fila.forEach((pila, c) => {
      copia.casillas[t][c] = pila === null ? null : { ...pila };
    }));
    return copia;
  }
}

/**
 * Mueve una casilla de un inventario a otro (inventario <-> banco). Si `destino` no se indica, va a donde entre.
 * Si no entra, no se mueve nada.
 */
export function transferir(
  origen: Inventario,
  desde: Posicion,
  destino: Inventario,
  hacia?: Posicion,
): Resultado<Posicion[], ErrorInventario> {
  const pila = origen.en(desde);
  if (pila === null) {
    return fallo("casilla-vacia");
  }
  const r = hacia !== undefined ? destino.ponerEn(hacia, pila) : destino.agregar(pila.objeto, pila.cantidad, pila.extra);
  if (!r.ok) {
    return fallo(r.error);
  }
  origen.sacarDe(desde);
  return exito(Array.isArray(r.valor) ? r.valor : [r.valor]);
}
