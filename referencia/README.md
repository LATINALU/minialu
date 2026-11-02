# Referencia

Material original de MiniFighter S3 para consultar mientras se lee `docs/`.

| Archivo | Qué es |
|---|---|
| `mf_game.sql` | Esquema de la base `mf_game` (MariaDB 10.5), **solo estructura**: se quitaron las filas (tenían cuentas y contraseñas de prueba). Las tablas `auction`, `bankitem`, `bankcard` y `userbuff` las crea el servidor al arrancar. |
| `datos/*.muestra.txt` | Los primeros bloques de cada tabla de definición, pasados de cp949 a UTF-8. |
| `datos/MixInfo.original.txt` | Probabilidades de fusión originales completas. |
| `datos/ShopCatalog.muestra.txt` | Formato del catálogo único de tiendas. |

Las tablas completas y el código fuente están en `Desktop\MiniFighter` (`server\Server MF\define\`, `server_src\`,
`rea\`). No se copiaron acá a propósito: este repositorio contiene código propio y documentación, no el juego.
