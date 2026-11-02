// Cajas y paquetes (GameClient.Boxes.cs + define/ContenidoCajas.txt, GameClient.Packages.cs).
// Los datos del juego no traían el contenido de las cajas, así que el proyecto inventó un formato de texto:
//
//   17152	carta normal 5-9 azar; mifa 1000-5000; uno: item 1 x3 / item 2 x3 / tienda cash
//
// Entradas separadas por ";". Cada entrada se entrega SIEMPRE, salvo "uno:" que elige una opción al azar.
// Este módulo generaliza ese formato: objeto fijo, moneda en rango, uno-de (con pesos opcionales) y grupo
// (un objeto cualquiera de una lista, como "tienda cash"). Abrir = tirar el contenido; entregar = todo o nada.

import { elegirPorPeso, elegirUno, type Azar } from "../core/azar.ts";
import { exito, fallo, type Resultado } from "../core/resultado.ts";
import type { Billetera } from "../economia/billetera.ts";
import type { Inventario } from "./inventario.ts";

export type EntradaCaja =
  | { readonly tipo: "objeto"; readonly objeto: number; readonly cantidad: number }
  | { readonly tipo: "moneda"; readonly moneda: string; readonly min: number; readonly max: number }
  | { readonly tipo: "grupo"; readonly grupo: string; readonly cantidad: number }
  | { readonly tipo: "uno"; readonly opciones: ReadonlyArray<{ readonly entrada: EntradaCaja; readonly peso: number }> };

export type Premio =
  | { readonly tipo: "objeto"; readonly objeto: number; readonly cantidad: number }
  | { readonly tipo: "moneda"; readonly moneda: string; readonly monto: number };

/** `grupos`: nombre -> ids posibles (por ejemplo "cash" -> objetos de la tienda cash). */
export function abrirCaja(
  contenido: readonly EntradaCaja[],
  azar: Azar,
  grupos: (nombre: string) => readonly number[] = () => [],
): Premio[] {
  const premios: Premio[] = [];
  const resolver = (e: EntradaCaja): void => {
    switch (e.tipo) {
      case "objeto":
        premios.push(e);
        break;
      case "moneda":
        premios.push({ tipo: "moneda", moneda: e.moneda, monto: e.min + Math.floor(azar.siguiente() * (e.max - e.min + 1)) });
        break;
      case "grupo": {
        const ids = grupos(e.grupo);
        if (ids.length > 0) premios.push({ tipo: "objeto", objeto: elegirUno(azar, ids), cantidad: e.cantidad });
        break;
      }
      case "uno":
        resolver(elegirPorPeso(azar, e.opciones.map((o) => [o.entrada, o.peso] as const)));
        break;
    }
  };
  contenido.forEach(resolver);
  return premios;
}

/** Entrega los premios: si algún objeto no entra, no se entrega nada. */
export function entregarPremios(premios: readonly Premio[], inventario: Inventario, billetera: Billetera): Resultado<void, "sin-espacio"> {
  const prueba = inventario.clonar();
  for (const p of premios) {
    if (p.tipo === "objeto" && !prueba.agregar(p.objeto, p.cantidad).ok) return fallo("sin-espacio");
  }
  for (const p of premios) {
    if (p.tipo === "objeto") inventario.agregar(p.objeto, p.cantidad);
    else billetera.acreditar(p.moneda, p.monto);
  }
  return exito(undefined);
}

/**
 * Lee el formato de ContenidoCajas: `mifa A-B`, `item ID [xN]`, `tienda NOMBRE`, `uno: a / b / c`.
 * `item ID xN @peso` permite pesos dentro de "uno:". Las entradas desconocidas (como `carta` del original,
 * propia de MiniFighter) se pasan a `otra` para que cada juego las resuelva.
 */
export function leerContenido(
  linea: string,
  monedaPrincipal = "oro",
  otra: (texto: string) => EntradaCaja | undefined = () => undefined,
): EntradaCaja[] {
  const entrada = (texto: string): EntradaCaja => {
    const t = texto.trim();
    if (t.startsWith("uno:")) {
      return {
        tipo: "uno",
        opciones: t.slice(4).split("/").map((o) => {
          const [cuerpo, peso] = o.split("@");
          return { entrada: entrada(cuerpo), peso: peso === undefined ? 1 : Number(peso) };
        }),
      };
    }
    const w = t.split(/\s+/);
    const xN = /^x(\d+)$/.exec(w[w.length - 1] ?? "");
    const cantidad = xN ? Number(xN[1]) : 1;
    switch (w[0]) {
      case "mifa":
      case "oro": {
        const [min, max] = w[1].split("-").map(Number);
        return { tipo: "moneda", moneda: monedaPrincipal, min, max: max ?? min };
      }
      case "item":
        return { tipo: "objeto", objeto: Number(w[1]), cantidad };
      case "tienda":
        return { tipo: "grupo", grupo: w[1], cantidad };
      default: {
        const e = otra(t);
        if (e === undefined) throw new Error(`Entrada de caja desconocida: "${t}"`);
        return e;
      }
    }
  };
  return linea.split(";").map((s) => s.trim()).filter((s) => s.length > 0).map(entrada);
}

/** Valor esperado en una moneda (para equilibrar cajas): promedio de los premios en moneda. */
export function monedaEsperada(contenido: readonly EntradaCaja[], moneda: string): number {
  const esperado = (e: EntradaCaja): number => {
    if (e.tipo === "moneda") return e.moneda === moneda ? (e.min + e.max) / 2 : 0;
    if (e.tipo === "uno") {
      const total = e.opciones.reduce((s, o) => s + o.peso, 0);
      return total > 0 ? e.opciones.reduce((s, o) => s + (o.peso / total) * esperado(o.entrada), 0) : 0;
    }
    return 0;
  };
  return contenido.reduce((s, e) => s + esperado(e), 0);
}
