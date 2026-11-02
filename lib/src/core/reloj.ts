// Tiempo inyectable: subastas, buffs y VIP dependen de la hora. Con un reloj manual se prueban
// 48 horas de subasta en un milisegundo.

export interface Reloj {
  /** Milisegundos desde la época Unix. */
  ahora(): number;
}

export class RelojSistema implements Reloj {
  ahora(): number {
    return Date.now();
  }
}

export class RelojManual implements Reloj {
  private ms: number;

  constructor(inicio = 0) {
    this.ms = inicio;
  }

  ahora(): number {
    return this.ms;
  }

  avanzar(ms: number): void {
    this.ms += ms;
  }
}

export const SEGUNDO = 1000;
export const MINUTO = 60 * SEGUNDO;
export const HORA = 60 * MINUTO;
export const DIA = 24 * HORA;
