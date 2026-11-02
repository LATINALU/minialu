// Gremios (GameClient.OnGuild*, tablas guilddata / guildmemberlist). Reglas del original:
//   - Crear: nivel 10 y 1.000.000 de oro, nombre único. El creador es maestro.
//   - Rangos: 0 solicitante (pidió entrar), 1 miembro, 2 submaestro, 3 maestro.
//   - Maestro y submaestros aprueban/rechazan solicitudes y expulsan miembros.
//   - Si el maestro se va, asciende el de mayor rango (y entre iguales, el más antiguo). Si era el último, se disuelve.
//   - Puntos y victorias del gremio alimentan el ranking de gremios y la guerra de castillo.
// El costo y el nivel los valida quien llama (con MedioDePago) para que el gremio no dependa de la economía.

import { exito, fallo, type Resultado } from "../core/resultado.ts";

export type Rango = "solicitante" | "miembro" | "submaestro" | "maestro";

const PESO: Record<Rango, number> = { solicitante: 0, miembro: 1, submaestro: 2, maestro: 3 };

export interface Miembro {
  readonly jugador: string;
  rango: Rango;
  readonly desde: number;
}

export type ErrorGremio =
  | "ya-esta"
  | "no-esta"
  | "lleno"
  | "sin-permiso"
  | "no-es-solicitante"
  | "es-maestro";

export interface OpcionesGremio {
  readonly maxMiembros?: number;
  readonly maxSubmaestros?: number;
}

export class Gremio {
  readonly nombre: string;
  puntos = 0;
  victorias = 0;
  derrotas = 0;
  private readonly miembros = new Map<string, Miembro>();
  private readonly maxMiembros: number;
  private readonly maxSubmaestros: number;
  private orden = 0;

  constructor(nombre: string, fundador: string, op: OpcionesGremio = {}) {
    this.nombre = nombre;
    this.maxMiembros = op.maxMiembros ?? 50;
    this.maxSubmaestros = op.maxSubmaestros ?? 3;
    this.miembros.set(fundador, { jugador: fundador, rango: "maestro", desde: this.orden++ });
  }

  get disuelto(): boolean {
    return this.activos().length === 0;
  }

  rangoDe(jugador: string): Rango | undefined {
    return this.miembros.get(jugador)?.rango;
  }

  /** Miembros con rango (sin solicitantes), del más alto al más bajo. */
  activos(): Miembro[] {
    return [...this.miembros.values()]
      .filter((m) => m.rango !== "solicitante")
      .sort((a, b) => PESO[b.rango] - PESO[a.rango] || a.desde - b.desde);
  }

  solicitudes(): Miembro[] {
    return [...this.miembros.values()].filter((m) => m.rango === "solicitante");
  }

  maestro(): string | undefined {
    return this.activos().find((m) => m.rango === "maestro")?.jugador;
  }

  solicitar(jugador: string): Resultado<void, ErrorGremio> {
    if (this.miembros.has(jugador)) return fallo("ya-esta");
    this.miembros.set(jugador, { jugador, rango: "solicitante", desde: this.orden++ });
    return exito(undefined);
  }

  private puedeGestionar(quien: string): boolean {
    const r = this.rangoDe(quien);
    return r === "maestro" || r === "submaestro";
  }

  aprobar(quien: string, jugador: string): Resultado<void, ErrorGremio> {
    if (!this.puedeGestionar(quien)) return fallo("sin-permiso");
    const m = this.miembros.get(jugador);
    if (m === undefined || m.rango !== "solicitante") return fallo("no-es-solicitante");
    if (this.activos().length >= this.maxMiembros) return fallo("lleno");
    m.rango = "miembro";
    return exito(undefined);
  }

  rechazar(quien: string, jugador: string): Resultado<void, ErrorGremio> {
    if (!this.puedeGestionar(quien)) return fallo("sin-permiso");
    if (this.rangoDe(jugador) !== "solicitante") return fallo("no-es-solicitante");
    this.miembros.delete(jugador);
    return exito(undefined);
  }

  /** Solo se puede expulsar a alguien de rango menor. */
  expulsar(quien: string, jugador: string): Resultado<void, ErrorGremio> {
    const r = this.rangoDe(quien);
    const objetivo = this.rangoDe(jugador);
    if (objetivo === undefined) return fallo("no-esta");
    if (r === undefined || !this.puedeGestionar(quien) || PESO[r] <= PESO[objetivo]) return fallo("sin-permiso");
    this.miembros.delete(jugador);
    return exito(undefined);
  }

  /** Solo el maestro nombra o quita submaestros. */
  cambiarRango(quien: string, jugador: string, rango: "miembro" | "submaestro"): Resultado<void, ErrorGremio> {
    if (this.rangoDe(quien) !== "maestro") return fallo("sin-permiso");
    const m = this.miembros.get(jugador);
    if (m === undefined || m.rango === "solicitante") return fallo("no-esta");
    if (m.rango === "maestro") return fallo("es-maestro");
    if (rango === "submaestro" && m.rango !== "submaestro" &&
      this.activos().filter((x) => x.rango === "submaestro").length >= this.maxSubmaestros) {
      return fallo("lleno");
    }
    m.rango = rango;
    return exito(undefined);
  }

  /** Salir. Si sale el maestro, asciende el siguiente. Devuelve el nuevo maestro, si cambió. */
  salir(jugador: string): Resultado<{ nuevoMaestro?: string }, ErrorGremio> {
    const m = this.miembros.get(jugador);
    if (m === undefined) return fallo("no-esta");
    this.miembros.delete(jugador);
    if (m.rango !== "maestro") return exito({});
    const sucesor = this.activos()[0];
    if (sucesor === undefined) {
      this.miembros.clear(); // gremio disuelto: las solicitudes pendientes también se van
      return exito({});
    }
    sucesor.rango = "maestro";
    return exito({ nuevoMaestro: sucesor.jugador });
  }

  registrarGuerra(gano: boolean, puntos: number): void {
    if (gano) this.victorias++;
    else this.derrotas++;
    this.puntos = Math.max(0, this.puntos + puntos);
  }
}

/** Costo y requisitos de fundación del original (GameClient.OnGuildMake). */
export const FUNDAR_GREMIO_MINIFIGHTER = { nivelMinimo: 10, costo: 1_000_000 } as const;
