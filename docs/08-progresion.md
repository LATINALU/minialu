# 8. Progresión

Fuentes: `UserLevel.cs`, `ExperienceCalculation.cs`, `EventLevel.cs`, `GameClient.Buffs.cs` (bonus).
Código: [`lib/src/progresion/`](../lib/src/progresion/).

## Curva de niveles

100 niveles, 11.575.000 de EXP total. La tabla es **acumulada** (EXP mínima para cada nivel) y crece por tramos de
10: dentro de un tramo cada nivel cuesta un poco más que el anterior (+500 por nivel en el tramo 10-19, +1.000 en
20-29...) y al empezar un tramo nuevo hay un salto. Es una curva **escalonada** pensada para que cada década tenga
su "muro" (cambio de zona, de equipo, de liga de PvP).

| Nivel | EXP acumulada | Costo de ese nivel |
|---:|---:|---:|
| 2 | 300 | 300 |
| 10 | 6.900 | 1.400 |
| 11 | 10.000 | 3.100 |
| 20 | 61.750 | 7.750 |
| 21 | 75.000 | 13.250 |
| 50 | 1.261.750 | 73.750 |
| 100 | 11.211.750 | 333.750 |

`CurvaNiveles` en la librería acepta cualquier tabla; `curvaPolinomica(niveles, base, exponente)` genera una
para un juego nuevo y `CURVA_MINIFIGHTER` es la original.

## Recompensa por partida

```
EXP     = base(nivel) [×2/3 si perdió] + segundosPremiados/5 + 20 × muertes      (mazmorra: 4 × muertes)
Oro     = (120 + 400 × participación + segundosPremiados/3) [×2/3 si perdió] + 20 × muertes, todo ×20
          segundosPremiados = entre 0 y 600 (cuenta desde el segundo 60)
          muertes > 20  →  se cuentan muertes − muertes/3
          tope 30.000 de cada cosa
base(nivel) = 1 hasta nivel 29; 300 (30-39), 400 (40-49) ... 1000 (100)
```

Ideas de diseño que hay dentro de la fórmula:
- **Perder también paga** (2/3): nadie abandona una partida perdida para no perder tiempo.
- **Tiempo con mínimo y máximo**: partidas de 10 segundos no rinden; quedarse AFK 1 hora tampoco.
- **Rendimiento decreciente en muertes**: dos amigos no pueden farmearse matándose 500 veces.
- **Tope por partida**: cualquier error en la fórmula tiene un daño máximo.
- **Debajo del nivel 30 la base es 1**: los nuevos suben por tiempo y muertes, no por el bono de nivel.

Bug del original: `400 * (presentes / total)` era división entera → solo daba 400 si nadie se iba. En la librería
la participación es una fracción.

Además, al ganar hay probabilidad de **carta** = 0,5 + 0,02 × jugadores en la sala (ver [cartas](09-cartas-y-gacha.md)).

## Bonificaciones porcentuales

`resultado = valor × (100 + suma de porcentajes) / 100`. Se suman:
- Pociones de EXP/oro (buffs 12-15, 30, 31: efecto "+% EXP en batalla", "+% oro en mazmorra"...).
- Evento global del servidor (`/evento 50 0` = +50% EXP para todos; se guarda en `define/Evento.txt`).
- (VIP podría sumar acá; en el original VIP da una pestaña de inventario.)

Sumar porcentajes (en vez de multiplicarlos) evita que dos bonos de +100% den ×4.

## Premios por nivel (`EventLevel`)

Tabla `nivel → objeto, cantidad, oro`. Al subir se entregan los premios de **todos** los niveles alcanzados
(si se suben 3 de golpe, 3 premios) por correo. Errores que tenía: premios con objetos que no existen
(correo imposible de cobrar) y subir de nivel sin fila en la tabla cortaba la subida. Regla: **validar las tablas
al arrancar** (`tools\revisar_datos.py` en el proyecto).

## Puntos de habilidad

Cada nivel da puntos (`RemainingSP` / `TotalSP`) que se reparten en habilidades (`SkillData`), y algunos libros
dan puntos extra. Suman a los stats como otra capa ([combate](10-combate-y-pve.md)).
