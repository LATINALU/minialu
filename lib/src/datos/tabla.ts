// Patrón "Base + Define" del juego original: cada fila es un XxxBase (ItemBase, EnemyBase, BuffBase) y la tabla
// completa es un XxxDefine que se carga una vez al arrancar (singletons en Program.Main del servidor y clases
// CItemDefine, CBuffDefine... en el cliente). Cliente y servidor leen LA MISMA tabla: así el precio que se ve es
// el que se cobra. Tabla<T> es ese Define, genérico.

export class Tabla<T> {
  readonly nombre: string;
  private readonly filas = new Map<number, T>();

  constructor(nombre: string, filas: Iterable<T>, idDe: (fila: T) => number) {
    this.nombre = nombre;
    for (const fila of filas) {
      const id = idDe(fila);
      if (this.filas.has(id)) {
        throw new Error(`${nombre}: id repetido ${id}`);
      }
      this.filas.set(id, fila);
    }
  }

  get tamano(): number {
    return this.filas.size;
  }

  buscar(id: number): T | undefined {
    return this.filas.get(id);
  }

  /** Igual que buscar, pero un id inexistente es un error de datos. */
  requerir(id: number): T {
    const fila = this.filas.get(id);
    if (fila === undefined) {
      throw new Error(`${this.nombre}: no existe el id ${id}`);
    }
    return fila;
  }

  existe(id: number): boolean {
    return this.filas.has(id);
  }

  todas(): IterableIterator<T> {
    return this.filas.values();
  }
}
