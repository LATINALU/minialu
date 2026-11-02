import { test } from "node:test";
import assert from "node:assert/strict";
import { decodificarSpr, escalar565, mezclar565, rgb565ARgba } from "../src/assets/sprites.ts";
import { Despachador, enmarcar, EscritorPaquete, ExtractorTramas, LectorPaquete } from "../src/red/paquetes.ts";

test("escribir y leer un paquete", () => {
  const w = new EscritorPaquete().u8(39).u8(1).i64(123456789012n).i32(-5).i16(3).cadenaCorta("Poción");
  const r = new LectorPaquete(w.aBytes());
  assert.equal(r.u8(), 39);
  assert.equal(r.u8(), 1);
  assert.equal(r.i64(), 123456789012n);
  assert.equal(r.i32(), -5);
  assert.equal(r.i16(), 3);
  assert.equal(r.cadenaCorta(), "Poción");
  assert.equal(r.disponible, 0);
  assert.throws(() => r.u8(), /Paquete corto/);
});

test("el extractor arma tramas partidas o pegadas", () => {
  const t1 = enmarcar(new Uint8Array([1, 2, 3]));
  const t2 = enmarcar(new Uint8Array([9]));
  const todo = new Uint8Array([...t1, ...t2]);
  const ex = new ExtractorTramas();
  assert.deepEqual(ex.empujar(todo.slice(0, 3)), []);
  const tramas = ex.empujar(todo.slice(3));
  assert.deepEqual(tramas.map((t) => [...t]), [[1, 2, 3], [9]]);
});

test("despachador: manejador, desconocido y error aislado", () => {
  const errores: number[] = [];
  const d = new Despachador<{ oro: number }>((id) => errores.push(id));
  d.registrar(33, (ctx, r) => { ctx.oro -= r.i32(); });
  const ctx = { oro: 100 };
  assert.equal(d.manejar(ctx, new EscritorPaquete().u8(33).i32(40).aBytes()), "ok");
  assert.equal(ctx.oro, 60);
  assert.equal(d.manejar(ctx, new Uint8Array([77])), "desconocido");
  assert.equal(d.manejar(ctx, new Uint8Array([33, 1])), "error");
  assert.deepEqual(errores, [33]);
  assert.throws(() => d.registrar(33, () => {}), /ya registrado/);
});

test("RGB565: colores puros, transparente y mezcla", () => {
  assert.deepEqual(rgb565ARgba(0xf800), [255, 0, 0, 255]);
  assert.deepEqual(rgb565ARgba(0x07e0), [0, 255, 0, 255]);
  assert.deepEqual(rgb565ARgba(0xf81f), [0, 0, 0, 0]);
  assert.equal(escalar565(0xffff, 32), 0xffff);
  assert.equal(escalar565(0xffff, 0), 0);
  assert.equal(mezclar565(0xf800, 0x001f, 32), 0xf800);
  const mitad = rgb565ARgba(mezclar565(0xf800, 0x001f, 16));
  assert.ok(mitad[0] > 100 && mitad[0] < 160 && mitad[2] > 100 && mitad[2] < 160);
});

test("decodificar un .spr armado a mano", () => {
  const w = new EscritorPaquete();
  w.bytes(new Uint8Array(64)).u32(0x7a6).u32(2);
  w.u32(2).u32(1).u16(0xf800).u16(0xf81f); // cuadro 2x1: rojo + transparente
  w.u32(0xffffffff).u32(0xffffffff).u16(0); // cuadro vacío
  const { cuadros, bytesUsados } = decodificarSpr(w.aBytes());
  assert.equal(cuadros.length, 2);
  assert.deepEqual([...cuadros[0].rgba], [255, 0, 0, 255, 0, 0, 0, 0]);
  assert.equal(cuadros[1].ancho, 1);
  assert.equal(bytesUsados, w.largo);
  assert.throws(() => decodificarSpr(new Uint8Array(80)), /0x7A6/);
});
