# Monedas y medios de pago

**Problema que resuelve:** varias monedas (oro, premium, fichas de evento) con las mismas reglas de cobro.

## Reglas
- Saldo nunca negativo; montos enteros y positivos.
- Monedas "de número" (billetera) y monedas "objeto" (fichas en el inventario) se cobran igual: `MedioDePago`.
- La moneda premium (comprada con dinero real) se separa de la que se gana jugando.

## En MiniFighter
Oro (Mifa) en `userinfovariable.Coin`; Cash en `userinfo.Cash`; Oro de Kamila (objeto 5202), Monedas Raon
(17111 + pestaña) y Medalla de honor (17806) como objetos.

## Variantes
- Fichas de evento que vencen al terminar el evento (economía paralela sin inflación).
- Moneda ligada a la cuenta (no comerciable) o libre.

## En la librería
`economia/billetera.ts`: `Billetera`, `pagoConBilletera`, `pagoConObjeto`.
