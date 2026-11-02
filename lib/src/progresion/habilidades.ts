// Puntos de habilidad (GameClient.IncreaseSkillPoint / OnSkillPoint / GetBattleSkillValue).
//   - Cada nivel NUEVO da 5 puntos (solo la primera vez que se alcanza: bajar y volver a subir no regala).
//   - Los puntos se ponen por personaje y por habilidad; cada habilidad tiene tope = nivel - 1.
//   - "Máximo" pone de una todos los que entren.
//   - Un objeto de reinicio (267) devuelve todos los puntos.
//   - Cada punto se convierte en stat con un factor: golpe 1, defensa 1/3, HP 4/3...
// Lo que se gasta es la pila de puntos; el resultado es una capa más para componerStats.

import { exito, fallo, type Resultado } from "../core/resultado.ts";
import type { Capa } from "../combate/stats.ts";

export type ErrorHabilidad = "sin-puntos" | "al-tope" | "cantidad-invalida";

export interface ReglasHabilidades {
  readonly puntosPorNivel: number;
  /** Tope de puntos de una habilidad según el nivel del jugador. */
  readonly tope: (nivel: number) => number;
  /** Puntos -> valor de stat de cada habilidad. */
  readonly factor: Readonly<Record<string, number>>;
}

/** Valores del original: tipo de habilidad -> stat y factor. */
export const HABILIDADES_MINIFIGHTER: ReglasHabilidades = {
  puntosPorNivel: 5,
  tope: (nivel) => Math.max(0, nivel - 1),
  factor: {
    golpe: 1, patada: 1, defensa: 1 / 3, hp: 4 / 3, mp: 1,
    habilidad: 1, habilidadNueva: 1, especial: 1, especialFinal: 1, agarre: 1,
  },
};

export class PuntosHabilidad {
  private readonly reglas: ReglasHabilidades;
  private totales = 0;
  private libres = 0;
  private nivelMasAlto = 1;
  private readonly asignados = new Map<string, number>();

  constructor(reglas: ReglasHabilidades = HABILIDADES_MINIFIGHTER) {
    this.reglas = reglas;
  }

  get disponibles(): number {
    return this.libres;
  }

  get total(): number {
    return this.totales;
  }

  /** Llamar al subir de nivel. Solo los niveles nunca alcanzados dan puntos. Devuelve los puntos ganados. */
  alcanzarNivel(nivel: number): number {
    if (nivel <= this.nivelMasAlto) return 0;
    const ganados = (nivel - this.nivelMasAlto) * this.reglas.puntosPorNivel;
    this.nivelMasAlto = nivel;
    this.totales += ganados;
    this.libres += ganados;
    return ganados;
  }

  /** Puntos extra (libros de habilidad). */
  sumarPuntos(n: number): void {
    this.totales += n;
    this.libres += n;
  }

  private clave(personaje: number, habilidad: string): string {
    return `${personaje}/${habilidad}`;
  }

  puntos(personaje: number, habilidad: string): number {
    return this.asignados.get(this.clave(personaje, habilidad)) ?? 0;
  }

  /** `cantidad = "max"` pone todo lo que entre hasta el tope. */
  asignar(personaje: number, habilidad: string, nivel: number, cantidad: number | "max" = 1): Resultado<number, ErrorHabilidad> {
    const actual = this.puntos(personaje, habilidad);
    const lugar = this.reglas.tope(nivel) - actual;
    if (lugar <= 0) return fallo("al-tope");
    if (this.libres <= 0) return fallo("sin-puntos");
    if (cantidad !== "max" && (!Number.isInteger(cantidad) || cantidad <= 0)) return fallo("cantidad-invalida");
    const pone = Math.min(cantidad === "max" ? lugar : cantidad, lugar, this.libres);
    this.asignados.set(this.clave(personaje, habilidad), actual + pone);
    this.libres -= pone;
    return exito(actual + pone);
  }

  /** Devuelve todos los puntos (objeto de reinicio). */
  reiniciar(): void {
    this.asignados.clear();
    this.libres = this.totales;
  }

  /** Capa de stats del personaje para componerStats. */
  capa(personaje: number): Capa {
    const capa: Record<string, number> = {};
    for (const [habilidad, factor] of Object.entries(this.reglas.factor)) {
      const p = this.puntos(personaje, habilidad);
      if (p > 0) capa[habilidad] = Math.floor(p * factor);
    }
    return capa;
  }
}
