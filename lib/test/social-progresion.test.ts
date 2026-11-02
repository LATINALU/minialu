import { test } from "node:test";
import assert from "node:assert/strict";
import { DIA, RelojManual } from "../src/core/reloj.ts";
import { Billetera } from "../src/economia/billetera.ts";
import { Inventario } from "../src/inventario/inventario.ts";
import { PuntosHabilidad } from "../src/progresion/habilidades.ts";
import { RegistroMisiones, type DefinicionMision } from "../src/progresion/misiones.ts";
import { Buzon } from "../src/social/correo.ts";
import { Gremio } from "../src/social/gremios.ts";

const maxPila = (id: number) => (id === 1 ? 99 : 1);
const inv = (casillas = 3) => new Inventario({ pestanas: 1, casillasPorPestana: casillas, maxPila });

test("gremio: solicitudes, permisos y rangos", () => {
  const g = new Gremio("Tigres", "ana", { maxMiembros: 3, maxSubmaestros: 1 });
  g.solicitar("beto");
  g.solicitar("caro");
  g.solicitar("dani");
  assert.deepEqual(g.aprobar("beto", "caro"), { ok: false, error: "sin-permiso" });
  assert.ok(g.aprobar("ana", "beto").ok);
  assert.ok(g.cambiarRango("ana", "beto", "submaestro").ok);
  assert.ok(g.aprobar("beto", "caro").ok, "el submaestro aprueba");
  assert.deepEqual(g.aprobar("ana", "dani"), { ok: false, error: "lleno" });
  assert.deepEqual(g.expulsar("beto", "ana"), { ok: false, error: "sin-permiso" });
  assert.ok(g.expulsar("beto", "caro").ok);
  assert.deepEqual(g.solicitar("ana"), { ok: false, error: "ya-esta" });
});

test("gremio: si se va el maestro asciende el de mayor rango; el último lo disuelve", () => {
  const g = new Gremio("Tigres", "ana");
  for (const j of ["beto", "caro"]) { g.solicitar(j); g.aprobar("ana", j); }
  g.cambiarRango("ana", "caro", "submaestro");
  assert.deepEqual(g.salir("ana"), { ok: true, valor: { nuevoMaestro: "caro" } });
  assert.equal(g.maestro(), "caro");
  g.salir("beto");
  g.salir("caro");
  assert.equal(g.disuelto, true);
});

test("correo: cobrar es todo o nada, vencimiento y borrado protegido", () => {
  const reloj = new RelojManual();
  const buzon = new Buzon(reloj, 2);
  const i = inv(1);
  const b = new Billetera();
  const c = buzon.enviar({ remitente: "Juego", asunto: "Premio nivel 10", adjuntos: [{ objeto: 2, cantidad: 1 }, { objeto: 3, cantidad: 1 }], monedas: { oro: 1000 } });
  assert.ok(c.ok);
  const id = c.ok ? c.valor.id : 0;
  assert.deepEqual(buzon.cobrar(id, i, b), { ok: false, error: "sin-espacio" });
  assert.equal(b.saldo("oro"), 0);
  assert.deepEqual(buzon.borrar(id), { ok: false, error: "tiene-adjuntos" });
  assert.ok(buzon.cobrar(id, inv(2), b).ok);
  assert.equal(b.saldo("oro"), 1000);
  assert.deepEqual(buzon.cobrar(id, inv(2), b), { ok: false, error: "ya-cobrada" });
  buzon.enviar({ remitente: "x", asunto: "1" });
  assert.deepEqual(buzon.enviar({ remitente: "x", asunto: "2" }), { ok: false, error: "buzon-lleno" });
  reloj.avanzar(31 * DIA);
  assert.equal(buzon.limpiar().length, 0);
  assert.equal(buzon.listar().length, 0);
});

const MISIONES: Record<number, DefinicionMision> = {
  10: { id: 10, objetivos: [{ tipo: "matar", objetivo: 1, cantidad: 5 }], recompensa: { exp: 300, monedas: { oro: 300 } } },
  11: { id: 11, requiere: 10, nivelMinimo: 5, objetivos: [{ tipo: "matar", objetivo: 2, cantidad: 2 }, { tipo: "hablar", objetivo: 7, cantidad: 1 }], recompensa: { objetos: [{ objeto: 6, cantidad: 1 }] } },
  99: { id: 99, repetible: true, objetivos: [{ tipo: "ganar-partida", objetivo: -1, cantidad: 1 }], recompensa: { exp: 50 } },
};

test("misiones: aceptar, progresar, entregar y cadenas", () => {
  const m = new RegistroMisiones((id) => MISIONES[id], 2);
  assert.deepEqual(m.aceptar(11, 10), { ok: false, error: "falta-anterior" });
  assert.ok(m.aceptar(10, 1).ok);
  m.registrar("matar", 1, 3);
  assert.deepEqual(m.entregar(10), { ok: false, error: "incompleta" });
  m.registrar("matar", 9, 10); // otro monstruo: no cuenta
  m.registrar("matar", 1, 10);
  assert.deepEqual(m.listaActivas(), [{ id: 10, progreso: [5] }]);
  assert.deepEqual(m.entregar(10), { ok: true, valor: { exp: 300, monedas: { oro: 300 } } });
  assert.deepEqual(m.aceptar(10, 1), { ok: false, error: "ya-entregada" });
  assert.deepEqual(m.aceptar(11, 4), { ok: false, error: "nivel-insuficiente" });
  assert.ok(m.aceptar(11, 5).ok);
  m.registrar("matar", 2, 2);
  assert.equal(m.completa(11), false);
  m.registrar("hablar", 7);
  assert.equal(m.completa(11), true);
});

test("misiones: repetibles, límite de activas y guardado", () => {
  const m = new RegistroMisiones((id) => MISIONES[id], 1);
  m.aceptar(99, 1);
  assert.deepEqual(m.aceptar(10, 1), { ok: false, error: "demasiadas" });
  m.registrar("ganar-partida", 123);
  assert.ok(m.entregar(99).ok);
  assert.ok(m.aceptar(99, 1).ok, "repetible");
  const copia = new RegistroMisiones((id) => MISIONES[id]);
  copia.importar(m.exportar());
  assert.equal(copia.fueEntregada(99), true);
  assert.deepEqual(copia.listaActivas(), [{ id: 99, progreso: [0] }]);
});

test("puntos de habilidad: 5 por nivel nuevo, tope nivel-1, máximo y reinicio", () => {
  const p = new PuntosHabilidad();
  assert.equal(p.alcanzarNivel(5), 20);
  assert.equal(p.alcanzarNivel(3), 0, "bajar y subir no regala");
  assert.deepEqual(p.asignar(0, "golpe", 5, "max"), { ok: true, valor: 4 });
  assert.deepEqual(p.asignar(0, "golpe", 5), { ok: false, error: "al-tope" });
  p.asignar(0, "hp", 5, 3);
  p.asignar(0, "defensa", 5, 3);
  assert.equal(p.disponibles, 10);
  assert.deepEqual(p.capa(0), { golpe: 4, hp: 4, defensa: 1 });
  assert.deepEqual(p.capa(1), {});
  p.reiniciar();
  assert.equal(p.disponibles, 20);
});
