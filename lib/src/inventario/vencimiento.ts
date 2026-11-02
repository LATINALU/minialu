// Objetos con vencimiento y suscripciones por tiempo (Item.IsPeriodItem / USE_PERIOD_HOUR, GameClient.Vip.cs).
//   - Un objeto con USE_PERIOD_HOUR > 0 dura esas horas desde que se obtiene; vencido, desaparece.
//     Los objetos temporales no se venden ni (normalmente) se comercian.
//   - VIP: un paquete da 30 días. Si ya era VIP, los días se SUMAN al vencimiento actual (no se pierden).
//     Mientras dure, el inventario tiene una pestaña más; al vencer se cierra pero no se borra lo que tiene.
// El vencimiento se guarda en `extra.vence` de la pila (las pilas con extra no se apilan: cada una tiene su fecha).

import { DIA, HORA, type Reloj } from "../core/reloj.ts";
import type { Inventario, Pila, Posicion } from "./inventario.ts";

export function venceEn(desde: number, horas: number): number {
  return desde + horas * HORA;
}

export function vencimientoDe(pila: Pila): number | undefined {
  const v = pila.extra?.["vence"];
  return typeof v === "number" ? v : undefined;
}

export function estaVencido(pila: Pila, ahora: number): boolean {
  const v = vencimientoDe(pila);
  return v !== undefined && v <= ahora;
}

/** Agrega un objeto temporal (cantidad 1, con su fecha). */
export function agregarTemporal(inv: Inventario, objeto: number, horas: number, reloj: Reloj, extra: Readonly<Record<string, unknown>> = {}) {
  return inv.agregar(objeto, 1, { ...extra, vence: venceEn(reloj.ahora(), horas) });
}

/** Quita los objetos vencidos y devuelve qué se quitó (para avisar al jugador). */
export function quitarVencidos(inv: Inventario, reloj: Reloj): { posicion: Posicion; pila: Pila }[] {
  const ahora = reloj.ahora();
  const quitados: { posicion: Posicion; pila: Pila }[] = [];
  for (const p of inv.posiciones()) {
    const pila = inv.en(p);
    if (pila !== null && estaVencido(pila, ahora)) {
      const r = inv.sacarDe(p);
      if (r.ok) quitados.push({ posicion: p, pila: r.valor });
    }
  }
  return quitados;
}

/** Suscripción acumulable por tiempo (VIP, pase de batalla, bonus de EXP de 7 días...). */
export class Suscripcion {
  private hasta: number;
  private readonly reloj: Reloj;

  constructor(reloj: Reloj, hasta = 0) {
    this.reloj = reloj;
    this.hasta = hasta;
  }

  get activa(): boolean {
    return this.hasta > this.reloj.ahora();
  }

  get vence(): number {
    return this.hasta;
  }

  restanteMs(): number {
    return Math.max(0, this.hasta - this.reloj.ahora());
  }

  /** Suma tiempo desde el vencimiento actual si sigue activa, o desde ahora si ya venció. */
  extender(ms: number): number {
    this.hasta = Math.max(this.hasta, this.reloj.ahora()) + ms;
    return this.hasta;
  }

  extenderDias(dias: number): number {
    return this.extender(dias * DIA);
  }
}

/** VIP del original: 30 días por paquete y una pestaña extra de inventario. */
export const VIP_MINIFIGHTER = { diasPorPaquete: 30, pestanasNormales: 4, pestanasVip: 5 } as const;

/** Sincroniza las pestañas del inventario con el estado de la suscripción. */
export function aplicarVip(inv: Inventario, vip: Suscripcion, normales: number = VIP_MINIFIGHTER.pestanasNormales, conVip: number = VIP_MINIFIGHTER.pestanasVip): void {
  inv.cambiarPestanasActivas(vip.activa ? conVip : normales);
}
