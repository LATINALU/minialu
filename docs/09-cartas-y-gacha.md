# 9. Cartas y gacha

Fuentes: `CharCard.cs`, `CharCardDefine.cs`, `CardGenerator.cs`, `MixInfo(KR).txt`, `CardDefine(KR).txt`.
Código: [`lib/src/cartas/cartas.ts`](../lib/src/cartas/cartas.ts).

## La carta ES el personaje

En MiniFighter no se "elige un personaje": se equipa una **carta**. La carta define el personaje (uno de 18
luchadores) y todos sus stats. Mejores cartas = personaje más fuerte. Toda la progresión de poder pasa por cartas.

| Atributo | Valores | Notas |
|---|---|---|
| Tipo | 0 normal, 5 especial, 6 despertar (especial avanzado), 7 furia | Tipos 2/3/4: cartas de la suerte/éxito |
| Nivel | 0~11 (= 1★~12★) | |
| Personaje | 0~65 | 18 luchadores × 4 grados (`CharacterMap`): normal, avanzado, súper avanzado, furia |
| Letra | A~Z al azar | combinaciones especiales (M-I-F, G-O-D, L-U-K...) tenían probabilidad propia |
| Stats | golpe, patada, defensa, HP, MP, habilidad, habilidad nueva, especial, especial final, agarre | al azar entre el mínimo y el máximo de su tipo×nivel |
| Habilidades nuevas | 5 interruptores | las de despertar/furia vienen con las 5 |
| Mejora | contador | cada mejora suma stats |
| Límite | 0 libre, 1/2/4 no comerciable | |

## Cómo se consiguen (fuentes de cartas)

| Fuente | Nivel | Tabla |
|---|---|---|
| Ganar una partida | 1★ 63%, 2★ 32%, 3★ 4%, 4★ 1%, resto 5★ | `RAREZA_PARTIDA` |
| Caja aleatoria de la tienda cash (original) | 5★ 60%, 6★ 20%, 7★ 12%, 8★ 6,5%, 9★ 0,5%, 10★ 0,03%, 11★ 0,002%, 12★ 0,0001% | `RAREZA_CAJA_ORIGINAL` |
| Objetos "carta de X" | fijo | `GameClient.CardItems.cs` |

La probabilidad de 12★ en caja (1 en un millón) muestra el modelo: las cartas altas **no se compran, se fabrican**
fusionando. La caja vende la materia prima.

## Fusión (el sumidero de cartas)

Tres cartas del **mismo tipo y nivel** → una carta:
- Si las tres son del mismo personaje, sale ese personaje; si no, uno al azar del mismo grado.
- Con probabilidad `MIX_CARD[nivel]` sube un nivel; si falla, sale una carta del **mismo** nivel (se pierden 2).
- Con carta de la suerte/éxito, sube seguro.
- Cuesta oro según el nivel: 300 (1★), 600, 1.000, 3.000, 10.000, 50.000, 100.000, 1.000.000 (8★), 1,5 M, 2 M, 3 M, 10 M.

Probabilidades originales (`MixInfo`, 10.0 = siempre):

| Fusión | Normal | Especial / Despertar / Furia (empiezan en 5★) |
|---|---|---|
| 1★ → 2★ ... 5★ → 6★ | siempre | 5★ → 6★: siempre |
| 6★ → 7★ | **30%** | siempre |
| 7★ → 8★ en adelante | **0%** | **0%** |

O sea: de 7★ para arriba **solo** se sube con carta de éxito (que se compraba con cash). Ese es el diseño
monetizado: el oro te lleva hasta 6-7★; el resto, cajas y cartas de éxito.

Matemática útil: para una carta de nivel N fusionando desde 1★ con éxito seguro hacen falta 3^(N-1) cartas de 1★.
Una 6★ = 243 cartas de 1★. Con fallos al 30%, una 7★ cuesta en promedio 3/0,3 = 10 cartas de 6★.

## Mejora (encantamiento)

Un objeto de mejora (uno distinto según el nivel de la carta) suma **+1 (20%), +2 (30%), +3 (30%), +4 (10%) o
+5 (10%) a todos los stats**, sin pasar el máximo de su tipo×nivel. Si ya está todo al máximo, falla y no consume.
Costo en oro: 1.000 (1★) ... 1.000.000 (12★).

## Otras operaciones (escenas del cliente)

`CSceneCardDivide` (dividir), `CardExtract` (extraer), `CardChange` (cambio de trabajo: 3 cartas → grado superior,
50.000 ~ 3.000.000), `CardMixAwake` (despertar), `CardMixFury` (furia), `CardMixLucky7`, `CardMixSealCard` /
`ReleaseSeal` (sellar), `CardAddNewSkill` (habilidad nueva). Todas siguen el mismo esquema: **entradas + oro →
tirada con tabla → salida**, y cada una es una escena + un paquete + una tabla. Es la receta para agregar mecánicas.

## Reutilizar en otro juego

`fusionar` no conoce MiniFighter: recibe la probabilidad por tipo y nivel, la lista de resultados posibles y cómo
crear la carta. Sirve para: fusionar armas, mejorar runas, evolucionar mascotas, combinar gemas (3 → 1 superior).
Y `probabilidadesVisibles(tabla)` da los porcentajes para mostrar al jugador (obligatorio en varios países para
cajas pagas).
