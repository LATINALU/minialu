// Decodificador de sprites .spr de MiniFighter (ver docs/04-cliente-y-render.md).
//   [64 bytes de cabecera cifrada][u32 0x7A6][u32 cuadros] y por cuadro [u32 ancho][u32 alto][píxeles RGB565]
//   Un cuadro vacío es FFFFFFFF FFFFFFFF + u16. El color 0xF81F (magenta) es transparente ("color key").
// Sirve también como ejemplo de cómo leer cualquier formato de imagen propio: cabecera, cuadros, píxeles.
// La salida (RGBA) se puede pasar directo a ImageData en un navegador o a un PNG en Node.

export const MAGIA_SPR = 0x7a6;
export const TRANSPARENTE_RGB565 = 0xf81f;

export interface Cuadro {
  readonly ancho: number;
  readonly alto: number;
  /** ancho * alto * 4 bytes (R, G, B, A). */
  readonly rgba: Uint8ClampedArray;
}

/** Color de 16 bits 5-6-5 a RGBA de 8 bits por canal. */
export function rgb565ARgba(c: number): [number, number, number, number] {
  if (c === TRANSPARENTE_RGB565) return [0, 0, 0, 0];
  return [
    Math.floor((((c >> 11) & 31) * 255) / 31),
    Math.floor((((c >> 5) & 63) * 255) / 63),
    Math.floor(((c & 31) * 255) / 31),
    255,
  ];
}

export function decodificarSpr(datos: Uint8Array): { cuadros: Cuadro[]; bytesUsados: number } {
  const v = new DataView(datos.buffer, datos.byteOffset, datos.byteLength);
  if (datos.length < 72 || v.getUint32(64, true) !== MAGIA_SPR) {
    throw new Error("No es un .spr de MiniFighter (falta 0x7A6 en el byte 64)");
  }
  const cantidad = v.getUint32(68, true);
  const cuadros: Cuadro[] = [];
  let pos = 72;
  while (cuadros.length < cantidad) {
    if (pos + 8 > datos.length) throw new Error(`Cuadro ${cuadros.length} cortado`);
    const ancho = v.getUint32(pos, true);
    const alto = v.getUint32(pos + 4, true);
    pos += 8;
    if (ancho === 0xffffffff && alto === 0xffffffff) {
      pos += 2;
      cuadros.push({ ancho: 1, alto: 1, rgba: new Uint8ClampedArray(4) });
      continue;
    }
    if (ancho === 0 || alto === 0 || ancho > 4096 || alto > 4096 || pos + ancho * alto * 2 > datos.length) {
      throw new Error(`Cuadro ${cuadros.length} inválido (${ancho}x${alto})`);
    }
    const rgba = new Uint8ClampedArray(ancho * alto * 4);
    for (let i = 0; i < ancho * alto; i++) {
      const [r, g, b, a] = rgb565ARgba(v.getUint16(pos + i * 2, true));
      rgba[i * 4] = r;
      rgba[i * 4 + 1] = g;
      rgba[i * 4 + 2] = b;
      rgba[i * 4 + 3] = a;
    }
    pos += ancho * alto * 2;
    cuadros.push({ ancho, alto, rgba });
  }
  return { cuadros, bytesUsados: pos };
}

/**
 * Escala un color RGB565 por alfa (0~32) con DOS multiplicaciones en vez de tres: el truco del cliente original
 * (FUN_0055f5f0). Rojo y azul (máscara 0xF81F) quedan tan separados que se multiplican juntos sin pisarse;
 * el verde (0x07E0) va aparte.
 */
export function escalar565(c: number, alfa: number): number {
  return ((((c & 0x07e0) * alfa) >> 5) & 0x07e0) | ((((c & 0xf81f) * alfa) >> 5) & 0xf81f);
}

/** Mezcla `arriba` sobre `abajo` con alfa 0~32 (32 = opaco). */
export function mezclar565(arriba: number, abajo: number, alfa: number): number {
  return (escalar565(arriba, alfa) + escalar565(abajo, 32 - alfa)) & 0xffff;
}
