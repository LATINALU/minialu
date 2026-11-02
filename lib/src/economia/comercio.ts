// Intercambio entre dos jugadores (Trade.cs / TradeUser.cs). Cada lado ofrece hasta 12 casillas y oro;
// los dos "aceptan" y luego "confirman", y recién ahí el servidor revisa todo y mueve las cosas de una vez.
//
// Mejora sobre el original: cualquier cambio en la oferta borra las aceptaciones de AMBOS lados (evita el
// truco de cambiar el objeto después de que el otro aceptó), y el espacio se calcula simulando el intercambio.

import { exito, fallo, type Resultado } from "../core/resultado.ts";
import type { Inventario, Posicion } from "../inventario/inventario.ts";
import type { MedioDePago } from "./billetera.ts";

export interface Participante {
  readonly inventario: Inventario;
  readonly dinero: MedioDePago;
}

export type Lado = 0 | 1;

export type ErrorComercio =
  | "cerrado"
  | "casilla-vacia"
  | "no-comerciable"
  | "oferta-llena"
  | "repetido"
  | "sin-fondos"
  | "sin-espacio"
  | "falta-aceptar";

interface Oferta {
  casillas: Posicion[];
  dinero: number;
  aceptado: boolean;
  confirmado: boolean;
}

export interface OpcionesComercio {
  readonly maxCasillas?: number;
  /** ENABLE_TRADE del objeto. */
  readonly comerciable?: (objeto: number) => boolean;
}

export class Comercio {
  private readonly partes: readonly [Participante, Participante];
  private readonly ofertas: [Oferta, Oferta];
  private readonly maxCasillas: number;
  private readonly comerciable: (objeto: number) => boolean;
  private abierto = true;

  constructor(a: Participante, b: Participante, op: OpcionesComercio = {}) {
    this.partes = [a, b];
    this.ofertas = [Comercio.ofertaVacia(), Comercio.ofertaVacia()];
    this.maxCasillas = op.maxCasillas ?? 12;
    this.comerciable = op.comerciable ?? (() => true);
  }

  private static ofertaVacia(): Oferta {
    return { casillas: [], dinero: 0, aceptado: false, confirmado: false };
  }

  private cambio(): void {
    for (const o of this.ofertas) {
      o.aceptado = false;
      o.confirmado = false;
    }
  }

  ofrecerCasilla(lado: Lado, p: Posicion): Resultado<void, ErrorComercio> {
    if (!this.abierto) return fallo("cerrado");
    const pila = this.partes[lado].inventario.en(p);
    if (pila === null) return fallo("casilla-vacia");
    if (!this.comerciable(pila.objeto)) return fallo("no-comerciable");
    const oferta = this.ofertas[lado];
    if (oferta.casillas.some((c) => c.pestana === p.pestana && c.casilla === p.casilla)) return fallo("repetido");
    if (oferta.casillas.length >= this.maxCasillas) return fallo("oferta-llena");
    oferta.casillas.push(p);
    this.cambio();
    return exito(undefined);
  }

  retirarCasilla(lado: Lado, p: Posicion): void {
    const oferta = this.ofertas[lado];
    oferta.casillas = oferta.casillas.filter((c) => c.pestana !== p.pestana || c.casilla !== p.casilla);
    this.cambio();
  }

  ofrecerDinero(lado: Lado, monto: number): Resultado<void, ErrorComercio> {
    if (!this.abierto) return fallo("cerrado");
    if (!Number.isSafeInteger(monto) || monto < 0 || this.partes[lado].dinero.saldo() < monto) return fallo("sin-fondos");
    this.ofertas[lado].dinero = monto;
    this.cambio();
    return exito(undefined);
  }

  aceptar(lado: Lado): void {
    this.ofertas[lado].aceptado = true;
  }

  /** Segunda confirmación. Cuando confirman los dos, se ejecuta. */
  confirmar(lado: Lado): Resultado<"esperando" | "hecho", ErrorComercio> {
    if (!this.abierto) return fallo("cerrado");
    if (!this.ofertas[0].aceptado || !this.ofertas[1].aceptado) return fallo("falta-aceptar");
    this.ofertas[lado].confirmado = true;
    if (!this.ofertas[0].confirmado || !this.ofertas[1].confirmado) return exito("esperando");
    const r = this.ejecutar();
    return r.ok ? exito("hecho") : r;
  }

  cancelar(): void {
    this.abierto = false;
  }

  private ejecutar(): Resultado<void, ErrorComercio> {
    // 1. Validar todo antes de mover nada.
    for (const lado of [0, 1] as const) {
      const { inventario, dinero } = this.partes[lado];
      const oferta = this.ofertas[lado];
      if (dinero.saldo() < oferta.dinero) return fallo("sin-fondos");
      if (oferta.casillas.some((p) => inventario.en(p) === null)) return fallo("casilla-vacia");
    }
    // 2. Simular el intercambio en copias para saber si todo entra.
    const copias = [this.partes[0].inventario.clonar(), this.partes[1].inventario.clonar()];
    const salen = [0, 1].map((lado) => this.ofertas[lado].casillas.map((p) => copias[lado].sacarDe(p)));
    for (const lado of [0, 1] as const) {
      for (const s of salen[1 - lado]) {
        if (!s.ok || !copias[lado].agregar(s.valor.objeto, s.valor.cantidad, s.valor.extra).ok) return fallo("sin-espacio");
      }
    }
    // 3. Ejecutar de verdad.
    const reales = [0, 1].map((lado) =>
      this.ofertas[lado].casillas.map((p) => this.partes[lado].inventario.sacarDe(p)),
    );
    for (const lado of [0, 1] as const) {
      for (const s of reales[1 - lado]) {
        if (s.ok) this.partes[lado].inventario.agregar(s.valor.objeto, s.valor.cantidad, s.valor.extra);
      }
      const otro = (1 - lado) as Lado;
      this.partes[lado].dinero.cobrar(this.ofertas[lado].dinero);
      this.partes[otro].dinero.pagar(this.ofertas[lado].dinero);
    }
    this.abierto = false;
    return exito(undefined);
  }
}
