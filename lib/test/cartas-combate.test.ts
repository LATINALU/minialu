import { test } from "node:test";
import assert from "node:assert/strict";
import { AzarSemilla } from "../src/core/azar.ts";
import { RelojManual, SEGUNDO } from "../src/core/reloj.ts";
import {
  fusionar,
  mejorar,
  probabilidadesVisibles,
  PROB_FUSION_NORMAL_MINIFIGHTER,
  RAREZA_PARTIDA,
  tirarRareza,
  type CartaBase,
  type ReglasFusion,
} from "../src/cartas/cartas.ts";
import { GestorBuffs, type DefinicionBuff } from "../src/combate/buffs.ts";
import { probabilidadReal, RANGOS_DROP_MINIFIGHTER, tablaPorNivel, tirarDrop } from "../src/combate/drops.ts";
import { BASE_MINIFIGHTER, componerStats, desglose } from "../src/combate/stats.ts";
import { azarFijo } from "./util.ts";

const reglas = (azar = azarFijo(0.5)): ReglasFusion<CartaBase> => ({
  azar,
  probabilidad: (_tipo, nivel) => PROB_FUSION_NORMAL_MINIFIGHTER.get(nivel),
  nivelMaximo: 11,
  personajesPosibles: () => [7, 8, 9],
  crear: (tipo, nivel, personaje) => ({ tipo, nivel, personaje }),
});

const carta = (nivel: number, personaje = 1, tipo = 0): CartaBase => ({ tipo, nivel, personaje });

test("rareza de partida: proporciones aproximadas", () => {
  const azar = new AzarSemilla(7);
  let unaEstrella = 0;
  for (let i = 0; i < 10000; i++) if (tirarRareza(azar, RAREZA_PARTIDA, [4]) === 0) unaEstrella++;
  assert.ok(Math.abs(unaEstrella / 10000 - 0.63) < 0.02);
  assert.equal(probabilidadesVisibles(RAREZA_PARTIDA)[0].porcentaje, 63);
});

test("fusión: niveles bajos siempre suben; mismo personaje se conserva", () => {
  const r = fusionar([carta(2), carta(2), carta(2)], reglas());
  assert.deepEqual(r, { ok: true, valor: { carta: carta(3), subio: true } });
});

test("fusión: 6★ (nivel 5) sube solo con 30%; personajes distintos dan uno al azar", () => {
  const falla = fusionar([carta(5, 1), carta(5, 2), carta(5, 3)], reglas(azarFijo(0.0, 0.9)));
  assert.ok(falla.ok && !falla.valor.subio && falla.valor.carta.nivel === 5);
  assert.ok(falla.ok && [7, 8, 9].includes(falla.valor.carta.personaje));
  const sube = fusionar([carta(5), carta(5), carta(5)], reglas(azarFijo(0.1)));
  assert.ok(sube.ok && sube.valor.subio);
});

test("fusión: carta de éxito asegura; reglas de entrada", () => {
  const r = fusionar([carta(8), carta(8), carta(8)], reglas(), true);
  assert.ok(r.ok && r.valor.carta.nivel === 9);
  assert.deepEqual(fusionar([carta(1), carta(2), carta(1)], reglas()), { ok: false, error: "distinto-nivel" });
  assert.deepEqual(fusionar([carta(1), carta(1, 1, 5), carta(1)], reglas()), { ok: false, error: "distinto-tipo" });
  assert.deepEqual(fusionar([carta(11), carta(11), carta(11)], reglas()), { ok: false, error: "nivel-maximo" });
});

test("mejora: suma lo mismo a todo sin pasar el máximo", () => {
  const r = mejorar({ golpe: 10, patada: 49 }, { golpe: 50, patada: 50 }, azarFijo(0.3));
  assert.deepEqual(r, { ok: true, valor: { incremento: 2, stats: { golpe: 12, patada: 50 } } });
  assert.deepEqual(mejorar({ golpe: 50 }, { golpe: 50 }, azarFijo(0)), { ok: false, error: "al-maximo" });
});

test("stats por capas", () => {
  const capas = { base: BASE_MINIFIGHTER, carta: { golpe: 310, hp: 2740 }, equipo: { golpe: 30 } };
  const total = componerStats(Object.values(capas));
  assert.equal(total.golpe, 540);
  assert.equal(total.hp, 6240);
  assert.deepEqual(desglose(capas, "golpe").map((d) => d.valor), [200, 310, 30]);
});

const BUFFS: Record<number, DefinicionBuff> = {
  1: { id: 1, duracionSeg: 600, persistencia: "ninguna", grupo: "transformacion", efectos: {} },
  2: { id: 2, duracionSeg: 600, persistencia: "ninguna", grupo: "transformacion", efectos: {} },
  12: { id: 12, duracionSeg: 3600, persistencia: "tiempo-real", efectos: { expBatalla: 50 } },
  13: { id: 13, duracionSeg: 3600, persistencia: "pausado", efectos: { expBatalla: 25 } },
};

test("buffs: transformación exclusiva, renovar, efectos y vencimiento", () => {
  const reloj = new RelojManual();
  const g = new GestorBuffs(reloj, (id) => BUFFS[id]);
  g.agregar(1);
  assert.deepEqual(g.agregar(2).reemplazados, [1]);
  g.agregar(12);
  g.agregar(13);
  assert.equal(g.efecto("expBatalla"), 75);
  reloj.avanzar(601 * SEGUNDO);
  assert.deepEqual(g.vencer(), [2]);
  assert.equal(g.lista().length, 2);
});

test("buffs: guardar y restaurar (tiempo real sigue corriendo, pausado no)", () => {
  const reloj = new RelojManual();
  const g = new GestorBuffs(reloj, (id) => BUFFS[id]);
  g.agregar(1);
  g.agregar(12);
  g.agregar(13);
  const guardado = g.guardar();
  assert.deepEqual(guardado.map((b) => b.id), [12, 13]);
  reloj.avanzar(2 * 3600 * SEGUNDO);
  g.restaurar(guardado);
  assert.deepEqual(g.lista().map((b) => b.id), [13]);
});

test("drops: uno-y-tirar da 0 o 1 objeto; probabilidad real", () => {
  const tabla = [[100, 0.9], [200, 0.1]] as const;
  assert.deepEqual(tirarDrop(azarFijo(0.5, 0.0), tabla), [100]);
  assert.deepEqual(tirarDrop(azarFijo(0.5, 0.99), tabla), []);
  assert.deepEqual(tirarDrop(azarFijo(0.05, 0.05), tabla, "cada-uno"), [100, 200]);
  const real = probabilidadReal(tabla);
  assert.equal(real.get(100), 0.45);
  assert.equal(real.get(200), 0.05);
});

test("drops: tabla por nivel del monstruo", () => {
  const tabla = tablaPorNivel(RANGOS_DROP_MINIFIGHTER, 64);
  assert.equal(tabla(1), 38);
  assert.equal(tabla(6), 39);
  assert.equal(tabla(68), 63);
  assert.equal(tabla(90), 64);
});
