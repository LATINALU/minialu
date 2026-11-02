// Tienda con catálogo único. Lección del proyecto MiniFighter: el cliente mostraba precios de un archivo y el
// servidor cobraba los de otro, y vendía cualquier id que le pidieran. La regla que lo arregló (ShopCatalog.cs):
//   1. Una sola fuente de verdad para lo que se vende y su precio (catalogo.csv -> cliente y servidor).
//   2. El servidor solo vende lo que está en el catálogo, al precio del catálogo.
//   3. Primero se entrega el objeto y después se cobra: un inventario lleno nunca hace perder dinero.

import { exito, fallo, type Resultado } from "../core/resultado.ts";
import type { Inventario, Posicion } from "../inventario/inventario.ts";
import type { MedioDePago } from "./billetera.ts";

export interface Articulo {
  readonly tienda: string;
  readonly pestana: number;
  readonly objeto: number;
  readonly precio: number;
  /** Unidades que entrega una compra (por defecto 1). */
  readonly cantidad?: number;
}

export class Catalogo {
  private readonly porClave = new Map<string, Articulo>();

  constructor(articulos: Iterable<Articulo>) {
    for (const a of articulos) {
      if (!Number.isSafeInteger(a.precio) || a.precio <= 0) {
        throw new Error(`Catálogo: precio inválido para ${a.tienda}/${a.objeto}`);
      }
      this.porClave.set(Catalogo.clave(a.tienda, a.pestana, a.objeto), a);
      // Para clientes que no mandan la pestaña al comprar (como la tienda NPC y la cash del original).
      const sinPestana = Catalogo.clave(a.tienda, -1, a.objeto);
      if (!this.porClave.has(sinPestana)) {
        this.porClave.set(sinPestana, a);
      }
    }
  }

  private static clave(tienda: string, pestana: number, objeto: number): string {
    return `${tienda}/${pestana}/${objeto}`;
  }

  buscar(tienda: string, objeto: number, pestana = -1): Articulo | undefined {
    return this.porClave.get(Catalogo.clave(tienda, pestana, objeto));
  }

  /** Objetos de una tienda (para cajas del tipo "un objeto cualquiera de la tienda X"). */
  objetosDe(tienda: string): number[] {
    const set = new Set<number>();
    for (const a of this.porClave.values()) {
      if (a.tienda === tienda) {
        set.add(a.objeto);
      }
    }
    return [...set];
  }
}

export type ErrorCompra = "no-a-la-venta" | "nivel-insuficiente" | "sin-espacio" | "sin-fondos";

export interface PedidoCompra {
  readonly catalogo: Catalogo;
  readonly tienda: string;
  readonly objeto: number;
  readonly pestana?: number;
  readonly inventario: Inventario;
  readonly pago: MedioDePago;
  readonly nivelJugador?: number;
  /** Nivel mínimo para usar el objeto (REQUEST_LEVEL). */
  readonly nivelRequerido?: (objeto: number) => number;
}

export interface Compra {
  readonly articulo: Articulo;
  readonly posiciones: Posicion[];
  readonly saldoRestante: number;
}

export function comprar(p: PedidoCompra): Resultado<Compra, ErrorCompra> {
  const articulo = p.catalogo.buscar(p.tienda, p.objeto, p.pestana ?? -1);
  if (articulo === undefined) {
    return fallo("no-a-la-venta");
  }
  if (p.nivelRequerido !== undefined && (p.nivelJugador ?? 0) < p.nivelRequerido(p.objeto)) {
    return fallo("nivel-insuficiente");
  }
  const cantidad = articulo.cantidad ?? 1;
  if (p.pago.saldo() < articulo.precio) {
    return fallo("sin-fondos");
  }
  if (p.inventario.capacidadPara(p.objeto) < cantidad) {
    return fallo("sin-espacio");
  }
  const entrega = p.inventario.agregar(p.objeto, cantidad);
  if (!entrega.ok) {
    return fallo("sin-espacio");
  }
  const cobro = p.pago.cobrar(articulo.precio);
  if (!cobro.ok) {
    // No debería pasar (se comprobó el saldo), pero si pasa se devuelve lo entregado.
    p.inventario.quitar(p.objeto, cantidad);
    return fallo("sin-fondos");
  }
  return exito({ articulo, posiciones: entrega.valor, saldoRestante: cobro.valor });
}
