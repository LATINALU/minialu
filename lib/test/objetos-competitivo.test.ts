import { test } from "node:test";
import assert from "node:assert/strict";
import { AzarSemilla } from "../src/core/azar.ts";
import { DIA, HORA, RelojManual } from "../src/core/reloj.ts";
import { Billetera } from "../src/economia/billetera.ts";
import { abrirCaja, entregarPremios, leerContenido, monedaEsperada } from "../src/inventario/cajas.ts";
import { Inventario } from "../src/inventario/inventario.ts";
import { agregarTemporal, aplicarVip, quitarVencidos, Suscripcion } from "../src/inventario/vencimiento.ts";
import { actualizarElo, esperadoElo, Ranking } from "../src/competitivo/ranking.ts";
import { Emparejador, repartirEquipos, Sala } from "../src/competitivo/salas.ts";
import { azarFijo } from "./util.ts";

const maxPila = (id: number) => (id === 1 ? 99 : 1);

test("objetos temporales vencen y se quitan", () => {
  const reloj = new RelojManual();
  const inv = new Inventario({ pestanas: 1, casillasPorPestana: 5, maxPila });
  agregarTemporal(inv, 50, 24, reloj);
  agregarTemporal(inv, 50, 72, reloj);
  inv.agregar(1, 10);
  reloj.avanzar(25 * HORA);
  const fuera = quitarVencidos(inv, reloj);
  assert.equal(fuera.length, 1);
  assert.equal(inv.contar(50), 1);
  assert.equal(inv.contar(1), 10);
});

test("VIP: los días se acumulan y la pestaña se abre y cierra", () => {
  const reloj = new RelojManual();
  const vip = new Suscripcion(reloj);
  const inv = new Inventario({ pestanas: 5, casillasPorPestana: 1, maxPila });
  aplicarVip(inv, vip);
  assert.equal(inv.pestanasActivas, 4);
  vip.extenderDias(30);
  reloj.avanzar(10 * DIA);
  vip.extenderDias(30);
  assert.equal(vip.restanteMs(), 50 * DIA);
  aplicarVip(inv, vip);
  assert.equal(inv.pestanasActivas, 5);
  reloj.avanzar(51 * DIA);
  vip.extenderDias(1);
  assert.equal(vip.restanteMs(), 1 * DIA, "vencida: cuenta desde ahora");
});

test("cajas: leer el formato de ContenidoCajas y abrir", () => {
  const contenido = leerContenido("mifa 1000-3000; item 1 x5; uno: item 7 / item 8 @3; tienda cash");
  assert.equal(contenido.length, 4);
  assert.equal(monedaEsperada(contenido, "oro"), 2000);
  const premios = abrirCaja(contenido, azarFijo(0.5, 0.9, 0.0), () => [700, 701]);
  assert.deepEqual(premios, [
    { tipo: "moneda", moneda: "oro", monto: 2000 },
    { tipo: "objeto", objeto: 1, cantidad: 5 },
    { tipo: "objeto", objeto: 8, cantidad: 1 },
    { tipo: "objeto", objeto: 700, cantidad: 1 },
  ]);
  assert.throws(() => leerContenido("carta normal 5 azar"), /desconocida/);
  const conCartas = leerContenido("carta normal 5 azar", "oro", () => ({ tipo: "objeto", objeto: 9000, cantidad: 1 }));
  assert.equal(conCartas[0].tipo, "objeto");
});

test("cajas: entregar es todo o nada", () => {
  const inv = new Inventario({ pestanas: 1, casillasPorPestana: 1, maxPila });
  const b = new Billetera();
  const premios = abrirCaja(leerContenido("oro 100; item 7; item 8"), new AzarSemilla(1));
  assert.deepEqual(entregarPremios(premios, inv, b), { ok: false, error: "sin-espacio" });
  assert.equal(b.saldo("oro"), 0);
  assert.equal(inv.casillasLibres(), 1);
});

test("ranking: empates, top y cierre de temporada con reinicio suave", () => {
  const r = new Ranking();
  r.sumar("ana", 100);
  r.sumar("beto", 80);
  r.sumar("caro", 80);
  r.sumar("dani", 10);
  assert.deepEqual(r.tabla().map((p) => [p.jugador, p.puesto]), [["ana", 1], ["beto", 2], ["caro", 2], ["dani", 4]]);
  const premios = r.cerrarTemporada([{ hasta: 1, premio: "oro" }, { hasta: 3, premio: "plata" }], 0.5);
  assert.deepEqual(premios.map((p) => [p.jugador, p.premio]), [["ana", "oro"], ["beto", "plata"], ["caro", "plata"]]);
  assert.equal(r.puntosDe("ana"), 50);
  assert.equal(r.puntosDe("dani"), 5);
  assert.equal(r.temporada, 2);
});

test("Elo", () => {
  assert.equal(esperadoElo(1500, 1500), 0.5);
  assert.deepEqual(actualizarElo(1500, 1500, 1), [1516, 1484]);
  const [a] = actualizarElo(1800, 1400, 1);
  assert.ok(a - 1800 < 4, "ganarle a uno mucho peor da poco");
});

test("sala: balanceo, clave, nivel, anfitrión y empezar", () => {
  const s = new Sala({ nombre: "1v1", equipos: 2, porEquipo: 2, clave: "x", nivelMin: 5 }, { id: "ana", nivel: 10 });
  assert.deepEqual(s.entrar({ id: "beto", nivel: 10 }), { ok: false, error: "clave" });
  assert.deepEqual(s.entrar({ id: "beto", nivel: 3 }, "x"), { ok: false, error: "nivel" });
  assert.deepEqual(s.entrar({ id: "beto", nivel: 10 }, "x"), { ok: true, valor: 1 });
  assert.deepEqual(s.empezar("ana"), { ok: false, error: "no-listos" });
  s.marcarListo("beto");
  assert.deepEqual(s.empezar("beto"), { ok: false, error: "no-es-anfitrion" });
  assert.deepEqual(s.salir("ana"), { ok: true, valor: { nuevoAnfitrion: "beto", vacia: false } });
  assert.deepEqual(s.empezar("beto"), { ok: false, error: "equipos-vacios" });
  s.entrar({ id: "caro", nivel: 9 }, "x");
  assert.deepEqual(s.empezar("beto"), { ok: false, error: "no-listos" });
  s.marcarListo("caro");
  assert.ok(s.empezar("beto").ok);
  assert.deepEqual(s.entrar({ id: "dani", nivel: 9 }, "x"), { ok: false, error: "jugando" });
});

test("sala: guerra de gremios y casillas cerradas", () => {
  const s = new Sala({ nombre: "GvG", equipos: 2, porEquipo: 2, porGremio: true }, { id: "a1", nivel: 10, gremio: "Tigres" });
  assert.deepEqual(s.entrar({ id: "a2", nivel: 10, gremio: "Tigres" }), { ok: true, valor: 0 });
  assert.deepEqual(s.entrar({ id: "b1", nivel: 10, gremio: "Leones" }), { ok: true, valor: 1 });
  assert.deepEqual(s.entrar({ id: "a3", nivel: 10, gremio: "Tigres" }), { ok: false, error: "equipo-lleno" });
  assert.deepEqual(s.entrar({ id: "c1", nivel: 10, gremio: "Osos" }), { ok: false, error: "gremio" });
  assert.deepEqual(s.entrar({ id: "x", nivel: 10 }), { ok: false, error: "gremio" });
  assert.ok(s.abrirCasilla("a1", 1, 1, false).ok);
  assert.deepEqual(s.entrar({ id: "b2", nivel: 10, gremio: "Leones" }), { ok: false, error: "equipo-lleno" });
});

test("emparejador: la ventana crece con la espera", () => {
  const e = new Emparejador(2, 100, 10);
  e.encolar({ id: "a", elo: 1500, desde: 0 });
  e.encolar({ id: "b", elo: 1700, desde: 0 });
  assert.deepEqual(e.emparejar(0), []);
  assert.equal(e.emparejar(20_000).length, 1, "a los 20 s la ventana es 300");
  assert.equal(e.esperando, 0);
  e.encolar({ id: "c", elo: 1500, desde: 0 });
  e.encolar({ id: "d", elo: 1520, desde: 0 });
  e.encolar({ id: "f", elo: 1490, desde: 0 });
  const [p] = e.emparejar(0);
  assert.deepEqual(p.map((x) => x.id).sort(), ["c", "f"]);
});

test("repartir equipos parejos", () => {
  const eq = repartirEquipos([{ elo: 1000 }, { elo: 900 }, { elo: 800 }, { elo: 700 }]);
  assert.deepEqual(eq.map((e) => e.reduce((s, j) => s + j.elo, 0)), [1700, 1700]);
});
