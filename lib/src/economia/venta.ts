// Venta de objetos al NPC (GameClient.OnItemSell). Es el principal "sumidero inverso": convierte objetos en
// oro, así que su precio fija cuánto valen los drops. MiniFighter pagaba 1/10 del precio de tienda, repartido
// por unidad según SELL_COUNT (o MAX_ITEM_COUNT si no hay SELL_COUNT), y nunca menos de 1.

export interface DatosVenta {
  /** PRICE del objeto (precio en la tienda NPC). */
  readonly precio: number;
  readonly vendible: boolean;
  /** Objetos con vencimiento no se venden. */
  readonly temporal?: boolean;
  /** SELL_COUNT: cuántas unidades forman el "lote" que vale precio/divisor. */
  readonly loteVenta?: number;
  /** MAX_ITEM_COUNT. */
  readonly maxPila: number;
}

export const DIVISOR_VENTA_MINIFIGHTER = 10;

/** Oro que recibe el jugador por vender `cantidad` unidades. 0 = no se puede vender. */
export function precioDeVenta(d: DatosVenta, cantidad: number, divisor = DIVISOR_VENTA_MINIFIGHTER): number {
  if (!d.vendible || d.temporal === true || cantidad < 1) {
    return 0;
  }
  const base = Math.floor(d.precio / divisor);
  if (base <= 0) {
    return 0;
  }
  const lote = d.loteVenta !== undefined && d.loteVenta > 0 ? d.loteVenta : d.maxPila;
  const total = cantidad * Math.floor(base / Math.max(1, lote));
  return Math.max(1, total);
}
