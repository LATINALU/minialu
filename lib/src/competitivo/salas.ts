// Salas y emparejamiento (Room.cs, GameClient.OnRoomMake/OnRoomIn/OnReady/OnStart, DungeonRoom.cs).
// El original: salas de hasta 16 jugadores en dos equipos de 8 (A/B), con nombre, contraseña, rango de nivel,
// casillas que el anfitrión abre o cierra, modo de juego (guerra de gremios = cada equipo un gremio) y
// "anfitrión" que pasa a la siguiente casilla ocupada si se va. Mazmorras: salas de 4 sin equipos.
// No había emparejamiento automático (solo "entrada rápida" a una sala con lugar); acá se agrega uno por Elo.

import { exito, fallo, type Resultado } from "../core/resultado.ts";

export interface Participante {
  readonly id: string;
  readonly nivel: number;
  readonly gremio?: string;
}

export interface OpcionesSala {
  readonly nombre: string;
  readonly equipos: number;
  readonly porEquipo: number;
  readonly clave?: string;
  readonly nivelMin?: number;
  readonly nivelMax?: number;
  /** Cada equipo pertenece a un gremio (guerra de gremios). */
  readonly porGremio?: boolean;
}

export type ErrorSala =
  | "llena"
  | "clave"
  | "nivel"
  | "ya-esta"
  | "no-esta"
  | "no-es-anfitrion"
  | "gremio"
  | "equipo-lleno"
  | "no-listos"
  | "equipos-vacios"
  | "jugando";

interface Casilla {
  jugador: Participante | null;
  abierta: boolean;
  listo: boolean;
}

export class Sala {
  readonly op: OpcionesSala;
  private readonly casillas: Casilla[][];
  private readonly gremioDeEquipo: (string | undefined)[];
  private anfitrion: string | undefined;
  jugando = false;

  constructor(op: OpcionesSala, creador: Participante) {
    this.op = op;
    this.casillas = Array.from({ length: op.equipos }, () =>
      Array.from({ length: op.porEquipo }, () => ({ jugador: null, abierta: true, listo: false })));
    this.gremioDeEquipo = Array(op.equipos).fill(undefined);
    const r = this.entrar(creador, op.clave);
    if (!r.ok) throw new Error(`El creador no puede entrar: ${r.error}`);
  }

  get anfitrionId(): string | undefined {
    return this.anfitrion;
  }

  jugadores(): { jugador: Participante; equipo: number; listo: boolean }[] {
    return this.casillas.flatMap((eq, equipo) =>
      eq.flatMap((c) => (c.jugador === null ? [] : [{ jugador: c.jugador, equipo, listo: c.listo }])));
  }

  private donde(id: string): { equipo: number; i: number } | undefined {
    for (let equipo = 0; equipo < this.casillas.length; equipo++) {
      const i = this.casillas[equipo].findIndex((c) => c.jugador?.id === id);
      if (i >= 0) return { equipo, i };
    }
    return undefined;
  }

  private libres(equipo: number): number {
    return this.casillas[equipo].filter((c) => c.abierta && c.jugador === null).length;
  }

  private ocupados(equipo: number): number {
    return this.casillas[equipo].filter((c) => c.jugador !== null).length;
  }

  /** Entra al equipo pedido o al que tenga menos jugadores (balanceo). */
  entrar(p: Participante, clave?: string, equipoPedido?: number): Resultado<number, ErrorSala> {
    if (this.jugando) return fallo("jugando");
    if (this.donde(p.id) !== undefined) return fallo("ya-esta");
    if (this.op.clave !== undefined && this.op.clave !== clave) return fallo("clave");
    if (p.nivel < (this.op.nivelMin ?? 0) || p.nivel > (this.op.nivelMax ?? Infinity)) return fallo("nivel");
    let candidatos = this.casillas.map((_, e) => e).filter((e) => this.libres(e) > 0);
    if (this.op.porGremio === true) {
      if (p.gremio === undefined) return fallo("gremio");
      const suyo = this.gremioDeEquipo.indexOf(p.gremio);
      candidatos = suyo >= 0 ? candidatos.filter((e) => e === suyo) : candidatos.filter((e) => this.gremioDeEquipo[e] === undefined);
      if (candidatos.length === 0) return fallo(suyo >= 0 ? "equipo-lleno" : "gremio");
    }
    if (equipoPedido !== undefined) {
      if (!candidatos.includes(equipoPedido)) return fallo("equipo-lleno");
      candidatos = [equipoPedido];
    }
    if (candidatos.length === 0) return fallo("llena");
    const equipo = candidatos.sort((a, b) => this.ocupados(a) - this.ocupados(b) || a - b)[0];
    const casilla = this.casillas[equipo].find((c) => c.abierta && c.jugador === null)!;
    casilla.jugador = p;
    casilla.listo = false;
    if (this.op.porGremio === true) this.gremioDeEquipo[equipo] = p.gremio;
    this.anfitrion ??= p.id;
    return exito(equipo);
  }

  /** Sale; si era el anfitrión, pasa al siguiente en orden de casillas (Room.CheckMaster). */
  salir(id: string): Resultado<{ nuevoAnfitrion?: string; vacia: boolean }, ErrorSala> {
    const pos = this.donde(id);
    if (pos === undefined) return fallo("no-esta");
    this.casillas[pos.equipo][pos.i] = { jugador: null, abierta: true, listo: false };
    if (this.op.porGremio === true && this.ocupados(pos.equipo) === 0) this.gremioDeEquipo[pos.equipo] = undefined;
    let nuevoAnfitrion: string | undefined;
    if (this.anfitrion === id) {
      this.anfitrion = this.jugadores()[0]?.jugador.id;
      nuevoAnfitrion = this.anfitrion;
    }
    return exito({ nuevoAnfitrion, vacia: this.jugadores().length === 0 });
  }

  marcarListo(id: string, listo = true): Resultado<void, ErrorSala> {
    const pos = this.donde(id);
    if (pos === undefined) return fallo("no-esta");
    this.casillas[pos.equipo][pos.i].listo = listo;
    return exito(undefined);
  }

  cambiarEquipo(id: string, equipo: number): Resultado<void, ErrorSala> {
    const pos = this.donde(id);
    if (pos === undefined) return fallo("no-esta");
    if (this.op.porGremio === true) return fallo("gremio");
    if (equipo === pos.equipo) return exito(undefined);
    if (this.libres(equipo) === 0) return fallo("equipo-lleno");
    const c = this.casillas[pos.equipo][pos.i];
    const destino = this.casillas[equipo].find((x) => x.abierta && x.jugador === null)!;
    destino.jugador = c.jugador;
    destino.listo = false;
    this.casillas[pos.equipo][pos.i] = { jugador: null, abierta: true, listo: false };
    return exito(undefined);
  }

  /** El anfitrión abre o cierra una casilla vacía (para jugar 3 contra 3 en una sala de 8). */
  abrirCasilla(quien: string, equipo: number, i: number, abierta: boolean): Resultado<void, ErrorSala> {
    if (quien !== this.anfitrion) return fallo("no-es-anfitrion");
    const c = this.casillas[equipo]?.[i];
    if (c === undefined || c.jugador !== null) return fallo("llena");
    c.abierta = abierta;
    return exito(undefined);
  }

  /** Empieza si lo pide el anfitrión, todos los demás están listos y (con equipos) ninguno está vacío. */
  empezar(quien: string): Resultado<void, ErrorSala> {
    if (quien !== this.anfitrion) return fallo("no-es-anfitrion");
    if (this.jugadores().some((j) => j.jugador.id !== this.anfitrion && !j.listo)) return fallo("no-listos");
    if (this.op.equipos > 1 && this.casillas.some((_, e) => this.ocupados(e) === 0)) return fallo("equipos-vacios");
    this.jugando = true;
    return exito(undefined);
  }

  terminar(): void {
    this.jugando = false;
    for (const eq of this.casillas) for (const c of eq) c.listo = false;
  }
}

/** Promedio de nivel de un equipo (el original lo usaba en la recompensa: Room.GetAvgLevel). */
export function nivelPromedio(sala: Sala, equipo: number): number {
  const js = sala.jugadores().filter((j) => j.equipo === equipo);
  return js.length === 0 ? 0 : js.reduce((s, j) => s + j.jugador.nivel, 0) / js.length;
}

// ---------------- Emparejamiento ----------------

export interface EnCola {
  readonly id: string;
  readonly elo: number;
  readonly desde: number;
}

/**
 * Cola de emparejamiento por Elo. La ventana aceptada crece con la espera: al principio solo rivales parecidos,
 * después de un rato cualquiera (si no, a horas con poca gente nadie juega nunca).
 */
export class Emparejador {
  private cola: EnCola[] = [];
  private readonly tamano: number;
  private readonly ventanaInicial: number;
  private readonly crecimientoPorSegundo: number;

  constructor(tamanoPartida: number, ventanaInicial = 100, crecimientoPorSegundo = 10) {
    this.tamano = tamanoPartida;
    this.ventanaInicial = ventanaInicial;
    this.crecimientoPorSegundo = crecimientoPorSegundo;
  }

  encolar(j: EnCola): void {
    if (!this.cola.some((x) => x.id === j.id)) this.cola.push(j);
  }

  salir(id: string): void {
    this.cola = this.cola.filter((x) => x.id !== id);
  }

  get esperando(): number {
    return this.cola.length;
  }

  ventana(j: EnCola, ahora: number): number {
    return this.ventanaInicial + Math.max(0, (ahora - j.desde) / 1000) * this.crecimientoPorSegundo;
  }

  /** Arma todas las partidas posibles; el que más espera tiene prioridad. */
  emparejar(ahora: number): EnCola[][] {
    const partidas: EnCola[][] = [];
    const pendientes = [...this.cola].sort((a, b) => a.desde - b.desde);
    const usados = new Set<string>();
    for (const ancla of pendientes) {
      if (usados.has(ancla.id)) continue;
      const compatibles = pendientes
        .filter((o) => !usados.has(o.id) && o.id !== ancla.id &&
          Math.abs(o.elo - ancla.elo) <= Math.min(this.ventana(ancla, ahora), this.ventana(o, ahora)))
        .sort((a, b) => Math.abs(a.elo - ancla.elo) - Math.abs(b.elo - ancla.elo));
      if (compatibles.length + 1 >= this.tamano) {
        const grupo = [ancla, ...compatibles.slice(0, this.tamano - 1)];
        grupo.forEach((g) => usados.add(g.id));
        partidas.push(grupo);
      }
    }
    this.cola = this.cola.filter((x) => !usados.has(x.id));
    return partidas;
  }
}

/** Reparte un grupo en equipos parejos por Elo (serpiente: 1-2-2-1...). */
export function repartirEquipos<T extends { readonly elo: number }>(grupo: readonly T[], equipos = 2): T[][] {
  const res: T[][] = Array.from({ length: equipos }, () => []);
  [...grupo].sort((a, b) => b.elo - a.elo).forEach((j, i) => {
    const vuelta = Math.floor(i / equipos);
    const pos = i % equipos;
    res[vuelta % 2 === 0 ? pos : equipos - 1 - pos].push(j);
  });
  return res;
}
