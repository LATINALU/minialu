import { test } from "node:test";
import assert from "node:assert/strict";
import { AzarSemilla, elegirPonderado, elegirPorPeso } from "../src/core/azar.ts";
import { bloquesDe, leerDocumento, numero, sueltasDe, texto, todos } from "../src/datos/bloques.ts";
import { Tabla } from "../src/datos/tabla.ts";
import { azarFijo } from "./util.ts";

test("AzarSemilla es repetible", () => {
  const a = new AzarSemilla(42);
  const b = new AzarSemilla(42);
  for (let i = 0; i < 100; i++) {
    const x = a.siguiente();
    assert.equal(x, b.siguiente());
    assert.ok(x >= 0 && x < 1);
  }
});

test("elegirPonderado recorre la tabla acumulada y usa sobrantes", () => {
  const tabla = [["a", 0.5], ["b", 0.3]] as const;
  assert.equal(elegirPonderado(azarFijo(0.1), tabla), "a");
  assert.equal(elegirPonderado(azarFijo(0.6), tabla), "b");
  assert.equal(elegirPonderado(azarFijo(0.95), tabla), "a");
  assert.equal(elegirPonderado(azarFijo(0.95, 0.0), tabla, ["z"]), "z");
});

test("elegirPonderado respeta las proporciones", () => {
  const azar = new AzarSemilla(1);
  const cuenta = { a: 0, b: 0 };
  for (let i = 0; i < 20000; i++) cuenta[elegirPonderado(azar, [["a", 0.25], ["b", 0.75]] as const)]++;
  assert.ok(Math.abs(cuenta.a / 20000 - 0.25) < 0.02);
});

test("elegirPorPeso no necesita que los pesos sumen 1", () => {
  assert.equal(elegirPorPeso(azarFijo(0.0), [["x", 2], ["y", 6]]), "x");
  assert.equal(elegirPorPeso(azarFijo(0.5), [["x", 2], ["y", 6]]), "y");
});

const EJEMPLO = `
// cabecera
*MIX_CARD	5	5	0.30
*ITEM_INFO
{
	*INDEX			0
	*NAME			"[Menor]Pocion HP"   // con espacios y comentario
	*PRICE			2000
	*DROP_ITEM  282  0.1
	*DROP_ITEM  265  0.001
}
*ITEM_INFO
{
	*INDEX			1
	*NAME			"URL // no es comentario"
}
`;

test("leerDocumento: bloques, comillas, comentarios y claves repetidas", () => {
  const doc = leerDocumento(EJEMPLO);
  const items = bloquesDe(doc, "ITEM_INFO");
  assert.equal(items.length, 2);
  assert.equal(texto(items[0], "NAME"), "[Menor]Pocion HP");
  assert.equal(numero(items[0], "PRICE"), 2000);
  assert.deepEqual(todos(items[0], "DROP_ITEM"), [["282", "0.1"], ["265", "0.001"]]);
  assert.equal(texto(items[1], "NAME"), "URL // no es comentario");
  assert.deepEqual(sueltasDe(doc, "MIX_CARD")[0].valores, ["5", "5", "0.30"]);
});

test("Tabla: buscar, requerir e ids repetidos", () => {
  const t = new Tabla("Objetos", [{ id: 1, n: "a" }, { id: 2, n: "b" }], (f) => f.id);
  assert.equal(t.buscar(2)?.n, "b");
  assert.equal(t.buscar(9), undefined);
  assert.throws(() => t.requerir(9), /no existe el id 9/);
  assert.throws(() => new Tabla("X", [{ id: 1 }, { id: 1 }], (f) => f.id), /repetido/);
});
