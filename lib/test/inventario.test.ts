import { test } from "node:test";
import assert from "node:assert/strict";
import { Inventario, transferir } from "../src/inventario/inventario.ts";

const POCION = 1;
const ESPADA = 2;
const maxPila = (id: number) => ({ [POCION]: 99, [ESPADA]: 1 } as Record<number, number>)[id];

function inv(pestanas = 1, casillas = 3) {
  return new Inventario({ pestanas, casillasPorPestana: casillas, maxPila });
}

test("apila hasta el máximo y después usa casillas nuevas", () => {
  const i = inv();
  assert.ok(i.agregar(POCION, 150).ok);
  assert.equal(i.en({ pestana: 0, casilla: 0 })?.cantidad, 99);
  assert.equal(i.en({ pestana: 0, casilla: 1 })?.cantidad, 51);
  assert.ok(i.agregar(POCION, 10).ok);
  assert.equal(i.en({ pestana: 0, casilla: 1 })?.cantidad, 61);
  assert.equal(i.contar(POCION), 160);
});

test("agregar es todo o nada", () => {
  const i = inv(1, 2);
  i.agregar(ESPADA, 1);
  const r = i.agregar(POCION, 100);
  assert.deepEqual(r, { ok: false, error: "sin-espacio" });
  assert.equal(i.contar(POCION), 0);
  assert.equal(i.capacidadPara(POCION), 99);
});

test("objetos desconocidos y cantidades inválidas", () => {
  assert.equal(inv().agregar(999, 1).ok, false);
  assert.equal(inv().agregar(POCION, 0).ok, false);
  assert.equal(inv().agregar(POCION, 1.5).ok, false);
});

test("quitar reparte entre pilas y libera casillas", () => {
  const i = inv();
  i.agregar(POCION, 150);
  assert.ok(i.quitar(POCION, 120).ok);
  assert.equal(i.contar(POCION), 30);
  assert.equal(i.casillasLibres(), 2);
  assert.deepEqual(i.quitar(POCION, 31), { ok: false, error: "insuficiente" });
});

test("pestaña VIP: cerrada no se usa pero conserva lo que tiene", () => {
  const i = new Inventario({ pestanas: 2, casillasPorPestana: 1, maxPila, pestanasActivas: 1 });
  i.agregar(ESPADA, 1);
  assert.equal(i.agregar(ESPADA, 1).ok, false);
  i.cambiarPestanasActivas(2);
  assert.ok(i.agregar(ESPADA, 1).ok);
  i.cambiarPestanasActivas(1);
  assert.equal(i.contar(ESPADA), 1);
  i.cambiarPestanasActivas(2);
  assert.equal(i.contar(ESPADA), 2);
});

test("objetos únicos (con extra) no se apilan", () => {
  const i = inv();
  i.agregar(POCION, 1, { calidad: 5 });
  i.agregar(POCION, 1);
  assert.equal(i.casillasLibres(), 1);
  assert.equal(i.agregar(POCION, 2, { calidad: 1 }).ok, false);
});

test("transferir al banco y de vuelta", () => {
  const mochila = inv();
  const banco = new Inventario({ pestanas: 1, casillasPorPestana: 70, maxPila });
  mochila.agregar(ESPADA, 1);
  assert.ok(transferir(mochila, { pestana: 0, casilla: 0 }, banco, { pestana: 0, casilla: 69 }).ok);
  assert.equal(mochila.contar(ESPADA), 0);
  assert.equal(banco.en({ pestana: 0, casilla: 69 })?.objeto, ESPADA);
  assert.ok(transferir(banco, { pestana: 0, casilla: 69 }, mochila).ok);
  assert.equal(mochila.contar(ESPADA), 1);
});

test("ordenar agrupa sin perder nada", () => {
  const i = inv(1, 4);
  i.agregar(ESPADA, 1);
  i.agregar(POCION, 5);
  i.agregar(ESPADA, 1);
  i.ordenar();
  assert.equal(i.en({ pestana: 0, casilla: 0 })?.objeto, POCION);
  assert.equal(i.contar(ESPADA), 2);
});
