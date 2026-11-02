// Curva de experiencia (UserLevel.cs). La experiencia es acumulada: umbrales[k] = experiencia mínima para
// estar en el nivel k+1. MiniFighter: 100 niveles, 11.575.000 de EXP total, y la curva crece por tramos de
// 10 niveles (dentro de un tramo, cada nivel cuesta un poco más que el anterior; al cambiar de tramo, salto).

export class CurvaNiveles {
  readonly umbrales: readonly number[];
  readonly nivelMaximo: number;

  constructor(umbrales: readonly number[], nivelMaximo = umbrales.length) {
    if (umbrales.length === 0 || umbrales[0] !== 0) {
      throw new Error("La curva tiene que empezar en 0 (nivel 1 sin experiencia)");
    }
    for (let i = 1; i < umbrales.length; i++) {
      if (umbrales[i] <= umbrales[i - 1]) {
        throw new Error(`La curva tiene que crecer: nivel ${i + 1}`);
      }
    }
    this.umbrales = umbrales;
    this.nivelMaximo = Math.min(nivelMaximo, umbrales.length);
  }

  experienciaPara(nivel: number): number {
    const n = Math.max(1, Math.min(nivel, this.nivelMaximo));
    return this.umbrales[n - 1];
  }

  /** Nivel y porcentaje hacia el siguiente (0~100). En el nivel máximo el porcentaje es 0. */
  nivelDe(experiencia: number): { nivel: number; porcentaje: number } {
    let nivel = 1;
    while (nivel < this.nivelMaximo && experiencia >= this.umbrales[nivel]) {
      nivel++;
    }
    if (nivel >= this.nivelMaximo) {
      return { nivel: this.nivelMaximo, porcentaje: 0 };
    }
    const desde = this.umbrales[nivel - 1];
    const hasta = this.umbrales[nivel];
    return { nivel, porcentaje: ((experiencia - desde) / (hasta - desde)) * 100 };
  }
}

/** Genera una curva con costo por nivel = base * nivel^exponente (redondeado). Para juegos nuevos. */
export function curvaPolinomica(niveles: number, base: number, exponente: number): CurvaNiveles {
  const umbrales = [0];
  for (let n = 1; n < niveles; n++) {
    umbrales.push(umbrales[n - 1] + Math.max(1, Math.round(base * Math.pow(n, exponente))));
  }
  return new CurvaNiveles(umbrales);
}

/** Tabla original de MiniFighter S3 (umbrales de los niveles 1 a 101; el 101 solo cierra el nivel 100). */
export const UMBRALES_MINIFIGHTER: readonly number[] = [
  0, 300, 640, 1020, 1440, 1990, 3000, 4200, 5500, 6900,
  10000, 13750, 18000, 22750, 28000, 33750, 40000, 46750, 54000, 61750,
  75000, 89250, 104500, 120750, 138000, 156250, 175500, 195750, 217000, 239250,
  270000, 302250, 336000, 371250, 408000, 446250, 486000, 527250, 570000, 614250,
  670000, 727750, 787500, 849250, 913000, 978750, 1046500, 1116250, 1188000, 1261750,
  1350000, 1440750, 1534000, 1629750, 1728000, 1828750, 1932000, 2037750, 2146000, 2256750,
  2385000, 2516250, 2650500, 2787750, 2928000, 3071250, 3217500, 3366750, 3519000, 3674250,
  3850000, 4029250, 4212000, 4398250, 4588000, 4781250, 4978000, 5178250, 5382000, 5589250,
  5820000, 6054750, 6293500, 6536250, 6783000, 7033750, 7288500, 7547250, 7810000, 8076750,
  8370000, 8667750, 8970000, 9276750, 9588000, 9903750, 10224000, 10548750, 10878000, 11211750,
  11575000,
];

export const CURVA_MINIFIGHTER = new CurvaNiveles(UMBRALES_MINIFIGHTER, 100);
