// Simulación: un jugador juega 200 partidas con las reglas de MiniFighter. Muestra de dónde entra el oro
// (fuentes) y por dónde sale (sumideros), y cuántas cartas le cuesta subir de estrellas.
// Uso: node ejemplos/economia.ts [semilla]

import {
  AzarSemilla,
  Billetera,
  COSTO_FUSION_MINIFIGHTER,
  CURVA_MINIFIGHTER,
  fusionar,
  PROB_FUSION_NORMAL_MINIFIGHTER,
  RAREZA_PARTIDA,
  recompensaPartida,
  tirar,
  tirarRareza,
  type CartaBase,
} from "../src/index.ts";

const azar = new AzarSemilla(Number(process.argv[2] ?? 1));
const billetera = new Billetera();
const flujo = { partidas: 0, pociones: 0, fusiones: 0 };
let exp = 0;
let cartas: CartaBase[] = [];

for (let i = 0; i < 200; i++) {
  const nivel = CURVA_MINIFIGHTER.nivelDe(exp).nivel;
  const gano = tirar(azar, 0.5);
  const r = recompensaPartida({
    nivel,
    gano,
    muertes: Math.floor(azar.siguiente() * 15),
    duracionMs: (120 + azar.siguiente() * 480) * 1000,
    presentes: 8,
    total: 8,
  });
  exp += r.exp;
  billetera.acreditar("oro", r.monedas);
  flujo.partidas += r.monedas;

  // Ganar da carta con probabilidad 0,5 + 0,02 por jugador (ExperienceCalculation.IsGetCardTeamBattle).
  if (tirar(azar, 0.5 + 8 * 0.02)) {
    cartas.push({ tipo: 0, nivel: tirarRareza(azar, RAREZA_PARTIDA, [4]), personaje: 0 });
  }
  // Sumidero 1: pociones (2000 cada una, 2 por partida).
  if (billetera.debitar("oro", 4000).ok) flujo.pociones += 4000;

  // Sumidero 2: fusionar todo lo que se pueda.
  for (let nivelCarta = 0; nivelCarta < 11; nivelCarta++) {
    const iguales = cartas.filter((c) => c.nivel === nivelCarta);
    if (iguales.length < 3 || !billetera.debitar("oro", COSTO_FUSION_MINIFIGHTER[nivelCarta]).ok) continue;
    flujo.fusiones += COSTO_FUSION_MINIFIGHTER[nivelCarta];
    const usadas = iguales.slice(0, 3);
    cartas = cartas.filter((c) => !usadas.includes(c));
    const f = fusionar(usadas as [CartaBase, CartaBase, CartaBase], {
      azar,
      probabilidad: (_t, n) => PROB_FUSION_NORMAL_MINIFIGHTER.get(n),
      nivelMaximo: 11,
      personajesPosibles: () => [0],
      crear: (tipo, n, personaje) => ({ tipo, nivel: n, personaje }),
    });
    if (f.ok) cartas.push(f.valor.carta);
  }
}

const estrellas = new Map<number, number>();
for (const c of cartas) estrellas.set(c.nivel + 1, (estrellas.get(c.nivel + 1) ?? 0) + 1);

console.log(`Nivel final: ${CURVA_MINIFIGHTER.nivelDe(exp).nivel} (${exp} EXP)`);
console.log(`Oro ganado en partidas: ${flujo.partidas}`);
console.log(`Gastado en pociones:    ${flujo.pociones}`);
console.log(`Gastado en fusiones:    ${flujo.fusiones}`);
console.log(`Oro final:              ${billetera.saldo("oro")}`);
console.log("Cartas por estrellas:", Object.fromEntries([...estrellas].sort((a, b) => a[0] - b[0])));
