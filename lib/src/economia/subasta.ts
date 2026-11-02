// Casa de subastas compartida (AuctionHouse.cs + GameClient.Auction.cs). Precio fijo, 48 h, 20 publicaciones
// por jugador, 15 resultados por página. El objeto queda "en custodia" en la casa mientras está publicado.
//
// Estados:  EN_VENTA --comprar--> VENDIDA --cobrar--> CERRADA
//           EN_VENTA --vence----> VENCIDA --recuperar--> CERRADA
//           EN_VENTA --cancelar-> CERRADA
//
// El original no cobraba comisión: la subasta movía oro entre jugadores sin sacar nada de la economía.
// Acá la comisión es un parámetro (un sumidero de oro muy usado en MMOs).

import { HORA, type Reloj } from "../core/reloj.ts";
import { exito, fallo, type Resultado } from "../core/resultado.ts";
import type { Pila } from "../inventario/inventario.ts";
import type { MedioDePago } from "./billetera.ts";

export type EstadoSubasta = "en-venta" | "vendida" | "vencida" | "cerrada";

export interface Publicacion {
  readonly id: number;
  readonly vendedor: string;
  readonly pila: Pila;
  readonly precio: number;
  readonly vence: number;
  estado: EstadoSubasta;
  comprador?: string;
  /** Lo que cobra el vendedor (precio - comisión). */
  aCobrar: number;
}

export interface OpcionesSubasta {
  readonly reloj: Reloj;
  readonly duracionMs?: number;
  readonly maxPorVendedor?: number;
  /** Porcentaje que se queda la casa (0~100). */
  readonly comisionPorcentaje?: number;
}

export type ErrorSubasta = "precio-invalido" | "limite" | "no-existe" | "no-disponible" | "no-es-tuyo" | "propia" | "sin-fondos";

export class CasaDeSubastas {
  private readonly publicaciones = new Map<number, Publicacion>();
  private readonly reloj: Reloj;
  private readonly duracionMs: number;
  private readonly maxPorVendedor: number;
  private readonly comision: number;
  private proximoId = 1;
  /** Oro que la comisión sacó de la economía. */
  retirado = 0;

  constructor(op: OpcionesSubasta) {
    this.reloj = op.reloj;
    this.duracionMs = op.duracionMs ?? 48 * HORA;
    this.maxPorVendedor = op.maxPorVendedor ?? 20;
    this.comision = op.comisionPorcentaje ?? 0;
  }

  /** Pasa a VENCIDA lo que se quedó sin tiempo. Se llama antes de cada consulta (igual que el original). */
  vencer(): void {
    const ahora = this.reloj.ahora();
    for (const p of this.publicaciones.values()) {
      if (p.estado === "en-venta" && p.vence <= ahora) {
        p.estado = "vencida";
      }
    }
  }

  /** El llamador ya sacó la pila del inventario del vendedor. */
  publicar(vendedor: string, pila: Pila, precio: number): Resultado<Publicacion, ErrorSubasta> {
    if (!Number.isSafeInteger(precio) || precio <= 0) return fallo("precio-invalido");
    if (this.delVendedor(vendedor).length >= this.maxPorVendedor) return fallo("limite");
    const pub: Publicacion = {
      id: this.proximoId++,
      vendedor,
      pila,
      precio,
      vence: this.reloj.ahora() + this.duracionMs,
      estado: "en-venta",
      aCobrar: 0,
    };
    this.publicaciones.set(pub.id, pub);
    return exito(pub);
  }

  buscar(filtro: (p: Publicacion) => boolean = () => true, pagina = 0, porPagina = 15): Publicacion[] {
    this.vencer();
    return [...this.publicaciones.values()]
      .filter((p) => p.estado === "en-venta" && filtro(p))
      .sort((a, b) => a.vence - b.vence)
      .slice(pagina * porPagina, (pagina + 1) * porPagina);
  }

  /** Publicaciones del vendedor que todavía no se cerraron (cuentan para el límite). */
  delVendedor(vendedor: string): Publicacion[] {
    this.vencer();
    return [...this.publicaciones.values()].filter((p) => p.vendedor === vendedor && p.estado !== "cerrada");
  }

  /** Devuelve la pila comprada; el llamador la pone en el inventario del comprador. */
  comprar(id: number, comprador: string, pago: MedioDePago): Resultado<Pila, ErrorSubasta> {
    this.vencer();
    const p = this.publicaciones.get(id);
    if (p === undefined) return fallo("no-existe");
    if (p.estado !== "en-venta") return fallo("no-disponible");
    if (p.vendedor === comprador) return fallo("propia");
    if (!pago.cobrar(p.precio).ok) return fallo("sin-fondos");
    const comision = Math.floor((p.precio * this.comision) / 100);
    this.retirado += comision;
    p.estado = "vendida";
    p.comprador = comprador;
    p.aCobrar = p.precio - comision;
    return exito(p.pila);
  }

  cancelar(id: number, vendedor: string): Resultado<Pila, ErrorSubasta> {
    return this.cerrar(id, vendedor, "en-venta", (p) => exito(p.pila));
  }

  recuperar(id: number, vendedor: string): Resultado<Pila, ErrorSubasta> {
    return this.cerrar(id, vendedor, "vencida", (p) => exito(p.pila));
  }

  /** Cobra una venta: paga al vendedor por el medio indicado. */
  cobrar(id: number, vendedor: string, destino: MedioDePago): Resultado<number, ErrorSubasta> {
    return this.cerrar(id, vendedor, "vendida", (p) => {
      destino.pagar(p.aCobrar);
      return exito(p.aCobrar);
    });
  }

  private cerrar<T>(
    id: number,
    vendedor: string,
    estado: EstadoSubasta,
    alCerrar: (p: Publicacion) => Resultado<T, ErrorSubasta>,
  ): Resultado<T, ErrorSubasta> {
    this.vencer();
    const p = this.publicaciones.get(id);
    if (p === undefined) return fallo("no-existe");
    if (p.vendedor !== vendedor) return fallo("no-es-tuyo");
    if (p.estado !== estado) return fallo("no-disponible");
    p.estado = "cerrada";
    return alCerrar(p);
  }
}
