import { test } from "node:test";
import assert from "node:assert/strict";
import { HORA, RelojManual } from "../src/core/reloj.ts";
import { Billetera, pagoConBilletera, pagoConObjeto } from "../src/economia/billetera.ts";
import { Comercio } from "../src/economia/comercio.ts";
import { CasaDeSubastas } from "../src/economia/subasta.ts";
import { Catalogo, comprar } from "../src/economia/tienda.ts";
import { precioDeVenta } from "../src/economia/venta.ts";
import { Inventario } from "../src/inventario/inventario.ts";

const POCION = 1;
const ESPADA = 2;
const FICHA = 3;
const maxPila = (id: number) => ({ [POCION]: 99, [ESPADA]: 1, [FICHA]: 999 } as Record<number, number>)[id];
const inv = (casillas = 5) => new Inventario({ pestanas: 1, casillasPorPestana: casillas, maxPila });

const catalogo = new Catalogo([
  { tienda: "npc", pestana: 0, objeto: POCION, precio: 2000 },
  { tienda: "npc", pestana: 1, objeto: ESPADA, precio: 50000 },
  { tienda: "fichas", pestana: 0, objeto: ESPADA, precio: 10 },
]);

test("billetera: no deja saldo negativo ni montos raros", () => {
  const b = new Billetera({ oro: 100 });
  assert.deepEqual(b.debitar("oro", 101), { ok: false, error: "sin-fondos" });
  assert.equal(b.debitar("oro", -5).ok, false);
  assert.equal(b.acreditar("oro", 0.5).ok, false);
  assert.ok(b.debitar("oro", 100).ok);
  assert.equal(b.saldo("oro"), 0);
});

test("tienda: compra con oro, verifica catálogo, nivel, fondos y espacio", () => {
  const b = new Billetera({ oro: 3000 });
  const i = inv(1);
  const base = { catalogo, tienda: "npc", inventario: i, pago: pagoConBilletera(b, "oro") };
  assert.deepEqual(comprar({ ...base, objeto: 999 }), { ok: false, error: "no-a-la-venta" });
  assert.deepEqual(
    comprar({ ...base, objeto: POCION, nivelJugador: 1, nivelRequerido: () => 10 }),
    { ok: false, error: "nivel-insuficiente" },
  );
  assert.ok(comprar({ ...base, objeto: POCION }).ok);
  assert.equal(b.saldo("oro"), 1000);
  assert.deepEqual(comprar({ ...base, objeto: POCION }), { ok: false, error: "sin-fondos" });
  b.acreditar("oro", 100000);
  assert.deepEqual(comprar({ ...base, objeto: ESPADA }), { ok: false, error: "sin-espacio" });
  assert.equal(b.saldo("oro"), 101000, "sin espacio no cobra");
});

test("tienda: pagar con objetos (fichas)", () => {
  const i = inv();
  i.agregar(FICHA, 15);
  const r = comprar({ catalogo, tienda: "fichas", pestana: 0, objeto: ESPADA, inventario: i, pago: pagoConObjeto(i, FICHA) });
  assert.ok(r.ok);
  assert.equal(i.contar(FICHA), 5);
  assert.equal(i.contar(ESPADA), 1);
});

test("venta: 1/10 del precio repartido por lote, mínimo 1", () => {
  // Poción: 2000 de precio, SELL_COUNT 20 -> 200/20 = 10 por unidad.
  assert.equal(precioDeVenta({ precio: 2000, vendible: true, loteVenta: 20, maxPila: 99 }, 7), 70);
  assert.equal(precioDeVenta({ precio: 50000, vendible: true, maxPila: 1 }, 1), 5000);
  assert.equal(precioDeVenta({ precio: 30, vendible: true, loteVenta: 20, maxPila: 99 }, 1), 1);
  assert.equal(precioDeVenta({ precio: 2000, vendible: false, maxPila: 99 }, 1), 0);
  assert.equal(precioDeVenta({ precio: 2000, vendible: true, temporal: true, maxPila: 1 }, 1), 0);
});

function dosJugadores() {
  const a = { inventario: inv(2), billetera: new Billetera({ oro: 1000 }) };
  const b = { inventario: inv(2), billetera: new Billetera({ oro: 0 }) };
  a.inventario.agregar(ESPADA, 1);
  b.inventario.agregar(POCION, 50);
  const c = new Comercio(
    { inventario: a.inventario, dinero: pagoConBilletera(a.billetera, "oro") },
    { inventario: b.inventario, dinero: pagoConBilletera(b.billetera, "oro") },
  );
  return { a, b, c };
}

test("comercio: espada + 300 de oro por 50 pociones", () => {
  const { a, b, c } = dosJugadores();
  c.ofrecerCasilla(0, { pestana: 0, casilla: 0 });
  c.ofrecerDinero(0, 300);
  c.ofrecerCasilla(1, { pestana: 0, casilla: 0 });
  c.aceptar(0);
  c.aceptar(1);
  assert.deepEqual(c.confirmar(0), { ok: true, valor: "esperando" });
  assert.deepEqual(c.confirmar(1), { ok: true, valor: "hecho" });
  assert.equal(a.inventario.contar(POCION), 50);
  assert.equal(b.inventario.contar(ESPADA), 1);
  assert.equal(a.billetera.saldo("oro"), 700);
  assert.equal(b.billetera.saldo("oro"), 300);
});

test("comercio: cambiar la oferta borra las aceptaciones", () => {
  const { c } = dosJugadores();
  c.ofrecerCasilla(0, { pestana: 0, casilla: 0 });
  c.aceptar(0);
  c.aceptar(1);
  c.ofrecerDinero(0, 1);
  assert.deepEqual(c.confirmar(1), { ok: false, error: "falta-aceptar" });
});

test("comercio: sin espacio no se mueve nada", () => {
  const { a, b, c } = dosJugadores();
  b.inventario.agregar(ESPADA, 1); // b queda lleno (2 casillas)
  c.ofrecerCasilla(0, { pestana: 0, casilla: 0 });
  c.aceptar(0);
  c.aceptar(1);
  c.confirmar(0);
  assert.deepEqual(c.confirmar(1), { ok: false, error: "sin-espacio" });
  assert.equal(a.inventario.contar(ESPADA), 1);
  assert.equal(b.inventario.contar(ESPADA), 1);
});

test("subasta: publicar, comprar con comisión y cobrar", () => {
  const reloj = new RelojManual();
  const casa = new CasaDeSubastas({ reloj, comisionPorcentaje: 5 });
  const comprador = new Billetera({ oro: 10000 });
  const vendedor = new Billetera();
  const pub = casa.publicar("ana", { objeto: ESPADA, cantidad: 1 }, 10000);
  assert.ok(pub.ok);
  const id = pub.ok ? pub.valor.id : -1;
  assert.deepEqual(casa.comprar(id, "ana", pagoConBilletera(vendedor, "oro")), { ok: false, error: "propia" });
  const compra = casa.comprar(id, "beto", pagoConBilletera(comprador, "oro"));
  assert.deepEqual(compra, { ok: true, valor: { objeto: ESPADA, cantidad: 1 } });
  assert.equal(comprador.saldo("oro"), 0);
  assert.deepEqual(casa.cobrar(id, "ana", pagoConBilletera(vendedor, "oro")), { ok: true, valor: 9500 });
  assert.equal(vendedor.saldo("oro"), 9500);
  assert.equal(casa.retirado, 500);
  assert.equal(casa.cobrar(id, "ana", pagoConBilletera(vendedor, "oro")).ok, false, "no se cobra dos veces");
});

test("subasta: vence a las 48 h y se recupera; límite por vendedor", () => {
  const reloj = new RelojManual();
  const casa = new CasaDeSubastas({ reloj, maxPorVendedor: 2 });
  const p1 = casa.publicar("ana", { objeto: POCION, cantidad: 5 }, 100);
  casa.publicar("ana", { objeto: POCION, cantidad: 5 }, 100);
  assert.deepEqual(casa.publicar("ana", { objeto: POCION, cantidad: 5 }, 100), { ok: false, error: "limite" });
  reloj.avanzar(48 * HORA);
  assert.equal(casa.buscar().length, 0);
  const id = p1.ok ? p1.valor.id : -1;
  assert.equal(casa.comprar(id, "beto", pagoConBilletera(new Billetera({ oro: 999 }), "oro")).ok, false);
  assert.deepEqual(casa.recuperar(id, "ana"), { ok: true, valor: { objeto: POCION, cantidad: 5 } });
  assert.equal(casa.delVendedor("ana").length, 1);
});
