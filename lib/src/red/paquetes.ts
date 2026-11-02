// Protocolo binario como el del juego original (InPacket/OutPacket, little-endian):
//   trama = [u16 largo total][cuerpo]   y el primer byte del cuerpo es el número de paquete.
//   Cadenas "cortas" = u16 largo + bytes.
// El original además cifraba cada trama (DogCrypto) y llevaba un contador 1..255 para detectar paquetes
// repetidos o inyectados. Para un juego nuevo: WebSocket + TLS ya resuelven el cifrado, y el contador sigue
// siendo buena idea contra la repetición.

export class EscritorPaquete {
  private buf = new Uint8Array(64);
  private vista = new DataView(this.buf.buffer);
  private pos = 0;

  private asegurar(n: number): void {
    if (this.pos + n <= this.buf.length) return;
    let largo = this.buf.length * 2;
    while (largo < this.pos + n) largo *= 2;
    const nuevo = new Uint8Array(largo);
    nuevo.set(this.buf);
    this.buf = nuevo;
    this.vista = new DataView(nuevo.buffer);
  }

  u8(v: number): this { this.asegurar(1); this.vista.setUint8(this.pos, v); this.pos += 1; return this; }
  i16(v: number): this { this.asegurar(2); this.vista.setInt16(this.pos, v, true); this.pos += 2; return this; }
  u16(v: number): this { this.asegurar(2); this.vista.setUint16(this.pos, v, true); this.pos += 2; return this; }
  i32(v: number): this { this.asegurar(4); this.vista.setInt32(this.pos, v, true); this.pos += 4; return this; }
  u32(v: number): this { this.asegurar(4); this.vista.setUint32(this.pos, v, true); this.pos += 4; return this; }
  i64(v: bigint): this { this.asegurar(8); this.vista.setBigInt64(this.pos, v, true); this.pos += 8; return this; }
  f32(v: number): this { this.asegurar(4); this.vista.setFloat32(this.pos, v, true); this.pos += 4; return this; }
  bool(v: boolean): this { return this.u8(v ? 1 : 0); }

  bytes(b: Uint8Array): this {
    this.asegurar(b.length);
    this.buf.set(b, this.pos);
    this.pos += b.length;
    return this;
  }

  cadenaCorta(s: string): this {
    const b = new TextEncoder().encode(s);
    return this.u16(b.length).bytes(b);
  }

  get largo(): number {
    return this.pos;
  }

  aBytes(): Uint8Array {
    return this.buf.slice(0, this.pos);
  }
}

export class ErrorLectura extends Error {}

export class LectorPaquete {
  private readonly vista: DataView;
  private readonly datos: Uint8Array;
  pos = 0;

  constructor(datos: Uint8Array) {
    this.datos = datos;
    this.vista = new DataView(datos.buffer, datos.byteOffset, datos.byteLength);
  }

  private pedir(n: number): number {
    if (this.pos + n > this.datos.length) {
      throw new ErrorLectura(`Paquete corto: faltan ${this.pos + n - this.datos.length} bytes`);
    }
    const p = this.pos;
    this.pos += n;
    return p;
  }

  get disponible(): number { return this.datos.length - this.pos; }
  u8(): number { return this.vista.getUint8(this.pedir(1)); }
  i16(): number { return this.vista.getInt16(this.pedir(2), true); }
  u16(): number { return this.vista.getUint16(this.pedir(2), true); }
  i32(): number { return this.vista.getInt32(this.pedir(4), true); }
  u32(): number { return this.vista.getUint32(this.pedir(4), true); }
  i64(): bigint { return this.vista.getBigInt64(this.pedir(8), true); }
  f32(): number { return this.vista.getFloat32(this.pedir(4), true); }
  bool(): boolean { return this.u8() !== 0; }
  bytes(n: number): Uint8Array { const p = this.pedir(n); return this.datos.slice(p, p + n); }
  cadenaCorta(): string { return new TextDecoder().decode(this.bytes(this.u16())); }
}

/** Arma una trama: [u16 largo total][cuerpo]. */
export function enmarcar(cuerpo: Uint8Array): Uint8Array {
  const total = cuerpo.length + 2;
  if (total > 0xffff) throw new Error("Trama demasiado grande");
  const t = new Uint8Array(total);
  new DataView(t.buffer).setUint16(0, total, true);
  t.set(cuerpo, 2);
  return t;
}

/**
 * TCP no respeta los límites de los paquetes: un `recv` puede traer media trama o tres juntas.
 * Este acumulador (como Session.EndReceive) junta bytes y devuelve solo tramas completas.
 */
export class ExtractorTramas {
  private pendiente = new Uint8Array(0);

  empujar(trozo: Uint8Array): Uint8Array[] {
    const junto = new Uint8Array(this.pendiente.length + trozo.length);
    junto.set(this.pendiente);
    junto.set(trozo, this.pendiente.length);
    const tramas: Uint8Array[] = [];
    let pos = 0;
    while (junto.length - pos >= 2) {
      const largo = junto[pos] | (junto[pos + 1] << 8);
      if (largo < 2) throw new ErrorLectura(`Largo de trama inválido: ${largo}`);
      if (junto.length - pos < largo) break;
      tramas.push(junto.slice(pos + 2, pos + largo));
      pos += largo;
    }
    this.pendiente = junto.slice(pos);
    return tramas;
  }
}

export type Manejador<C> = (ctx: C, lector: LectorPaquete) => void;

/**
 * Despachador por número de paquete. Reemplaza el `switch` de ~120 casos de GameClient.OnPacket.
 * Lección de la auditoría: un error dentro de un manejador desconectaba al jugador; acá se registra y sigue.
 */
export class Despachador<C> {
  private readonly manejadores = new Map<number, Manejador<C>>();
  private readonly alError: (id: number, error: unknown) => void;

  constructor(alError: (id: number, error: unknown) => void = () => {}) {
    this.alError = alError;
  }

  registrar(id: number, manejador: Manejador<C>): this {
    if (this.manejadores.has(id)) throw new Error(`Paquete ${id} ya registrado`);
    this.manejadores.set(id, manejador);
    return this;
  }

  /** `cuerpo` = cuerpo de la trama; su primer byte es el número de paquete. */
  manejar(ctx: C, cuerpo: Uint8Array): "ok" | "desconocido" | "error" {
    const lector = new LectorPaquete(cuerpo);
    let id = -1;
    try {
      id = lector.u8();
      const m = this.manejadores.get(id);
      if (m === undefined) return "desconocido";
      m(ctx, lector);
      return "ok";
    } catch (e) {
      this.alError(id, e);
      return "error";
    }
  }

  registrados(): number[] {
    return [...this.manejadores.keys()].sort((a, b) => a - b);
  }
}
