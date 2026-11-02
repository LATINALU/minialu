// Botín de monstruos (DropItemDefine.cs, DropItemBase.cs, GameClient.Drops.cs).
//
// Ojo con cómo se lee una tabla de drops; hay tres formas y dan economías MUY distintas:
//   "uno-y-tirar"  (MiniFighter): se elige UNA entrada al azar y después se tira su probabilidad. Las
//                  probabilidades de una tabla pueden sumar más de 1. Cada muerte da 0 o 1 objeto.
//   "cada-uno":    se tira cada entrada por separado. Una muerte puede dar varios objetos.
//   "ponderado":   las probabilidades son pesos y siempre sale exactamente uno.
// La tabla que se usa depende del nivel del monstruo (rangos Lv1~5 -> tabla 38, ..., Lv69+ -> tabla 64),
// y los jefes tienen su propia tabla por mazmorra.

import { elegirPorPeso, entero, type Azar } from "../core/azar.ts";

export type EntradaDrop = readonly [objeto: number, probabilidad: number];
export type ModoDrop = "uno-y-tirar" | "cada-uno" | "ponderado";

export function tirarDrop(azar: Azar, tabla: readonly EntradaDrop[], modo: ModoDrop = "uno-y-tirar", multiplicador = 1): number[] {
  if (tabla.length === 0) {
    return [];
  }
  switch (modo) {
    case "uno-y-tirar": {
      const tirada = azar.siguiente();
      const [objeto, prob] = tabla[entero(azar, tabla.length)];
      return prob * multiplicador > tirada ? [objeto] : [];
    }
    case "cada-uno":
      return tabla.filter(([, prob]) => azar.siguiente() < prob * multiplicador).map(([objeto]) => objeto);
    case "ponderado":
      return [elegirPorPeso(azar, tabla)];
  }
}

/** Probabilidad real de que salga cada objeto en una muerte (para equilibrar y para mostrar al jugador). */
export function probabilidadReal(tabla: readonly EntradaDrop[], modo: ModoDrop = "uno-y-tirar"): Map<number, number> {
  const res = new Map<number, number>();
  const pesoTotal = tabla.reduce((s, [, p]) => s + Math.max(0, p), 0);
  for (const [objeto, prob] of tabla) {
    const p = Math.min(1, Math.max(0, prob));
    const real = modo === "uno-y-tirar" ? p / tabla.length : modo === "cada-uno" ? p : pesoTotal > 0 ? Math.max(0, prob) / pesoTotal : 0;
    res.set(objeto, (res.get(objeto) ?? 0) + real);
  }
  return res;
}

/** Elige la tabla según el nivel: rangos [nivel máximo, tabla] ordenados; si se pasa del último, `defecto`. */
export function tablaPorNivel(rangos: ReadonlyArray<readonly [number, number]>, defecto: number): (nivel: number) => number {
  return (nivel) => {
    for (const [maximo, tabla] of rangos) {
      if (nivel <= maximo) {
        return tabla;
      }
    }
    return defecto;
  };
}

/** Rangos originales de MiniFighter (GameClient.Drops.cs). */
export const RANGOS_DROP_MINIFIGHTER: ReadonlyArray<readonly [number, number]> = [
  [5, 38], [8, 39], [10, 40], [12, 41], [15, 42], [18, 43], [20, 44], [22, 45], [25, 46], [28, 47], [30, 48],
  [32, 49], [35, 50], [38, 51], [40, 52], [42, 53], [45, 54], [48, 55], [50, 56], [52, 57], [55, 58], [58, 59],
  [60, 60], [62, 61], [65, 62], [68, 63],
];
