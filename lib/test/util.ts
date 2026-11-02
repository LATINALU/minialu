import type { Azar } from "../src/core/azar.ts";

/** Azar que devuelve una secuencia fija (para forzar ramas). */
export function azarFijo(...valores: number[]): Azar {
  let i = 0;
  return { siguiente: () => valores[i++ % valores.length] };
}
