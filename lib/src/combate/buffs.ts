// Buffs temporales (GameClient.Buffs.cs + BuffDefine). Cubren pociones de EXP/oro, transformaciones en
// monstruo y habilidades temporales. Reglas del original:
//   - Repetir un buff renueva su tiempo (no se acumula).
//   - Grupo exclusivo: una sola transformación a la vez; la nueva reemplaza a la anterior.
//   - KEEP_TYPE: 0 se pierde al desconectar, 1 el tiempo sigue corriendo desconectado, 2 el tiempo se pausa.
//   - EFFECT <n> <valor>: cada efecto suma (p. ej. efecto 12 = +% EXP en batalla).

import type { Reloj } from "../core/reloj.ts";

export type Persistencia = "ninguna" | "tiempo-real" | "pausado";

export interface DefinicionBuff {
  readonly id: number;
  readonly duracionSeg: number;
  readonly persistencia: Persistencia;
  /** Buffs del mismo grupo se reemplazan entre sí. */
  readonly grupo?: string;
  readonly efectos: Readonly<Record<string, number>>;
}

export interface BuffActivo {
  readonly id: number;
  readonly vence: number;
}

export interface BuffGuardado {
  readonly id: number;
  readonly persistencia: Persistencia;
  readonly vence: number;
  readonly restanteMs: number;
}

export class GestorBuffs {
  private activos: BuffActivo[] = [];
  private readonly reloj: Reloj;
  private readonly definicion: (id: number) => DefinicionBuff | undefined;

  constructor(reloj: Reloj, definicion: (id: number) => DefinicionBuff | undefined) {
    this.reloj = reloj;
    this.definicion = definicion;
  }

  /** Agrega o renueva. Devuelve los ids reemplazados (para avisar al cliente que se quitaron). */
  agregar(id: number): { agregado: boolean; reemplazados: number[] } {
    const def = this.definicion(id);
    if (def === undefined) {
      return { agregado: false, reemplazados: [] };
    }
    const reemplazados: number[] = [];
    this.activos = this.activos.filter((b) => {
      if (b.id === id) return false;
      const otro = this.definicion(b.id);
      if (def.grupo !== undefined && otro?.grupo === def.grupo) {
        reemplazados.push(b.id);
        return false;
      }
      return true;
    });
    this.activos.push({ id, vence: this.reloj.ahora() + Math.max(1, def.duracionSeg) * 1000 });
    return { agregado: true, reemplazados };
  }

  quitar(id: number): boolean {
    const antes = this.activos.length;
    this.activos = this.activos.filter((b) => b.id !== id);
    return this.activos.length !== antes;
  }

  /** Quita los vencidos y devuelve sus ids (para mandar "buff terminado"). */
  vencer(): number[] {
    const ahora = this.reloj.ahora();
    const vencidos = this.activos.filter((b) => b.vence <= ahora).map((b) => b.id);
    this.activos = this.activos.filter((b) => b.vence > ahora);
    return vencidos;
  }

  lista(): readonly BuffActivo[] {
    this.vencer();
    return this.activos;
  }

  /** Suma de un efecto entre todos los buffs activos. */
  efecto(nombre: string): number {
    return this.lista().reduce((s, b) => s + (this.definicion(b.id)?.efectos[nombre] ?? 0), 0);
  }

  /** Lo que hay que guardar al desconectar. */
  guardar(): BuffGuardado[] {
    const ahora = this.reloj.ahora();
    return this.lista().flatMap((b) => {
      const def = this.definicion(b.id);
      if (def === undefined || def.persistencia === "ninguna") return [];
      return [{ id: b.id, persistencia: def.persistencia, vence: b.vence, restanteMs: b.vence - ahora }];
    });
  }

  /** Al conectar: los de tiempo real conservan su vencimiento, los pausados retoman lo que les quedaba. */
  restaurar(guardados: readonly BuffGuardado[]): void {
    const ahora = this.reloj.ahora();
    this.activos = guardados
      .map((g) => ({ id: g.id, vence: g.persistencia === "pausado" ? ahora + g.restanteMs : g.vence }))
      .filter((b) => b.vence > ahora);
  }
}
