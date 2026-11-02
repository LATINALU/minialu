# Misiones

**Problema que resuelve:** guiar al jugador con objetivos concretos y premiarlo por cumplirlos.

## Reglas
- Una misión tiene uno o más objetivos `{tipo, objetivo, cantidad}` ("matar 5 del monstruo 1", "hablar con el NPC 7").
- Requisitos para aceptar: nivel mínimo, misión anterior entregada (cadenas), límite de misiones activas.
- El juego **avisa** de lo que pasa (`registrar("matar", 1)`) y cada misión activa cuenta lo que le importa.
  `objetivo = -1` acepta cualquiera.
- Objetivos de "tener N objetos" se fijan al valor actual (pueden bajar si el jugador los vende).
- Entregar devuelve la recompensa (EXP, monedas, objetos); quien llama la da o la manda por correo.
- Repetibles: se pueden volver a aceptar (diarias, pergaminos).

## En MiniFighter
- Emulador: una sola misión activa "matar N" elegida por un pergamino (objeto 380), `QuestDefine(KR).txt`.
- Cliente original: 129 misiones en `Quest.dat` encadenadas por `NEXT_QUEST_NUMBER`, niveles 1-35, hasta 3
  condiciones, premios de oro, EXP y 3 objetos. Protocolo C→S 124 / S→C 119 (ver `MiniFighter\docs\MISIONES.md`).
  El servidor de la comunidad nunca lo implementó.

## Variantes
- Diarias / semanales: repetibles + reinicio por reloj.
- Logros: misiones sin aceptar (todas activas siempre) y sin límite.
- Pase de batalla: misiones que dan puntos a una barra con premios.

## En la librería
`progresion/misiones.ts`: `RegistroMisiones` (`puedeAceptar`, `aceptar`, `abandonar`, `registrar`, `fijar`,
`completa`, `entregar`, `exportar` / `importar`).
