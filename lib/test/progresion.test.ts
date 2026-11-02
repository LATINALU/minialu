import { test } from "node:test";
import assert from "node:assert/strict";
import { CURVA_MINIFIGHTER, curvaPolinomica } from "../src/progresion/niveles.ts";
import {
  aplicarBonus,
  premiosPorSubida,
  recompensaPartida,
  RECOMPENSA_MAZMORRA_MINIFIGHTER,
} from "../src/progresion/recompensas.ts";

test("curva MiniFighter: niveles y porcentaje", () => {
  assert.deepEqual(CURVA_MINIFIGHTER.nivelDe(0), { nivel: 1, porcentaje: 0 });
  assert.deepEqual(CURVA_MINIFIGHTER.nivelDe(150), { nivel: 1, porcentaje: 50 });
  assert.equal(CURVA_MINIFIGHTER.nivelDe(300).nivel, 2);
  assert.equal(CURVA_MINIFIGHTER.nivelDe(10000).nivel, 11);
  assert.deepEqual(CURVA_MINIFIGHTER.nivelDe(11211750), { nivel: 100, porcentaje: 0 });
  assert.deepEqual(CURVA_MINIFIGHTER.nivelDe(99999999), { nivel: 100, porcentaje: 0 });
  assert.equal(CURVA_MINIFIGHTER.experienciaPara(2), 300);
});

test("curva polinómica crece y es válida", () => {
  const c = curvaPolinomica(50, 100, 1.5);
  assert.equal(c.nivelMaximo, 50);
  assert.equal(c.nivelDe(c.experienciaPara(10)).nivel, 10);
});

const PARTIDA = { nivel: 45, gano: true, muertes: 5, duracionMs: 360_000, presentes: 8, total: 8 };

test("recompensa de partida (fórmula de MiniFighter)", () => {
  // EXP = 400 (nivel 40-49) + (360-60)/5 = 60 + 20*5 = 100 -> 560
  // Monedas = (120 + 400 + 300/3) + 100 = 720 -> ×20 = 14400
  assert.deepEqual(recompensaPartida(PARTIDA), { exp: 560, monedas: 14400 });
});

test("perder da 2/3 de la base; más de 20 muertes rinden menos; tope 30000", () => {
  const perdio = recompensaPartida({ ...PARTIDA, gano: false });
  assert.equal(perdio.exp, Math.floor(400 * 2 / 3) + 60 + 100);
  const muchas = recompensaPartida({ ...PARTIDA, muertes: 30 });
  assert.equal(muchas.exp, 400 + 60 + 20 * 20);
  assert.equal(recompensaPartida({ ...PARTIDA, muertes: 500 }).monedas, 30000);
});

test("el tiempo premiado va de 60 s a 660 s", () => {
  assert.equal(recompensaPartida({ ...PARTIDA, muertes: 0, duracionMs: 30_000 }).exp, 400);
  assert.equal(recompensaPartida({ ...PARTIDA, muertes: 0, duracionMs: 3_600_000 }).exp, 400 + 120);
});

test("mazmorra: la muerte vale 4", () => {
  assert.equal(recompensaPartida(PARTIDA, RECOMPENSA_MAZMORRA_MINIFIGHTER).exp, 400 + 60 + 20);
});

test("bonus porcentual y premios por nivel", () => {
  assert.equal(aplicarBonus(1000, 50), 1500);
  assert.equal(aplicarBonus(1000, 0), 1000);
  const tabla = [
    { nivel: 2, objeto: 1507, cantidad: 1, monedas: 1000 },
    { nivel: 3, objeto: 2, cantidad: 5, monedas: 1000 },
    { nivel: 5, objeto: 5055, cantidad: 1, monedas: 1000 },
  ];
  assert.deepEqual(premiosPorSubida(tabla, 1, 3).map((p) => p.nivel), [2, 3]);
  assert.deepEqual(premiosPorSubida(tabla, 3, 3), []);
});
