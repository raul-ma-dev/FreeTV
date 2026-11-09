# FreeTV para LG webOS

## Versión 0.2.0: múltiples listas

Selecciona una lista en la barra superior. En **Administrar listas**, introduce un nombre y una URL HTTP/HTTPS de una lista M3U y pulsa **Agregar y abrir**. Las listas y la última selección se guardan localmente; puedes eliminar listas propias y se conserva IPTV.org como opción inicial. Los favoritos existentes se conservan por URL de canal. Atrás cierra el panel antes de salir de la aplicación. Las listas personalizadas no recurren al catálogo incluido si fallan.

Paquete actualizado: `build/com.freetv.player_0.2.0_all.ipk`. Verificados sintaxis y casos de agregar, duplicados, persistencia, cambio de lista, respuestas tardías, errores y eliminación. Instalación pendiente: la conexión a la TV 10.73.40.52:9922 agotó el tiempo de espera el 8 de noviembre de 2026.

Reproductor de la lista pública https://iptv-org.github.io/iptv/index.m3u, con búsqueda, categorías, favoritos locales y navegación por control remoto. Incluye una copia del catálogo descargada el 23 de octubre de 2026 y trata de actualizarla al abrir.

## Preparar la TV

1. Instala Developer Mode desde la tienda LG e inicia sesión con una cuenta de desarrollador LG.
2. Activa Dev Mode Status y reinicia cuando lo solicite.
3. Abre Developer Mode y activa Key Server. Anota la passphrase que muestra la TV.
4. Mantén computadora y TV en la misma red. IP indicada: 10.73.40.52.

La sesión de Developer Mode se debe renovar antes de que expire. Si se desactiva, LG elimina las apps instaladas por esta vía.

## Herramientas e instalación

Instala Node.js con npm y después la CLI oficial:

```powershell
npm install -g @webos-tools/cli
ares-setup-device
```

En el asistente agrega un dispositivo llamado `freetv`, host `10.73.40.52`, puerto `9922`, usuario `prisoner`. Después:

```powershell
ares-novacom --device freetv --getkey
```

Introduce la passphrase de Developer Mode cuando se solicite. Desde la carpeta del proyecto ejecuta:

```powershell
.\install.ps1
```

El script prepara únicamente los archivos de la app, crea el IPK e instala y abre FreeTV usando la CLI oficial.

## Estado y límites

Código JavaScript comprobado con `node --check app.js`. CLI oficial instalada localmente en `.tools/webos`. Paquete generado en `build/com.freetv.player_0.1.0_all.ipk`. TV emparejada en 10.73.40.52:9922 como `freetv`. Instalación e inicio completados; `ares-launch --running` confirmó `com.freetv.player` en ejecución el 23 de octubre de 2026. Modelo: 65UA8050PSA.BWMYLKR; SDK: 10.3.2; firmware: 33.31.80. Pendiente verificar visualmente navegación y reproducción con el usuario.

La lista no garantiza disponibilidad, permisos territoriales ni compatibilidad. Algunos canales requieren encabezados específicos o códecs que este reproductor no implementa; las directivas EXTVLCOPT se omiten. El reproductor usa el elemento video de webOS, sin proxy ni transcodificación. Los favoritos se guardan en el almacenamiento local de la app.

Documentación: https://webostv.developer.lge.com/develop/getting-started/developer-mode-app

## Versión 0.3.0: canales manuales

Instalada y abierta en la TV 10.73.40.120. Usa **Agregar canal** para introducir nombre y URL HTTP/HTTPS del stream HLS (.m3u8, incluidos enlaces con parámetros). Se guarda en **Mis canales**, disponible en el selector de listas. Al reproducir un canal manual aparece **Eliminar canal manual**. Se conservan las listas existentes y los favoritos. Validación, persistencia, duplicados, reproducción y eliminación comprobados con DOM simulado; reproducción real pendiente de la disponibilidad y compatibilidad del enlace elegido.

## Versión 0.4.0: edición de listas e IPTV México

Instalada y abierta en la TV. Se incorpora una sola vez IPTV México (CharlieII/IPTV_mexico); la migración conserva listas existentes y canales manuales y no vuelve a añadirla si se elimina. Selecciona una lista y pulsa **Editar lista** para cambiar nombre y URL; se valida que no duplique otra URL. Mis canales es una colección local y se administra mediante Agregar canal y Eliminar canal manual. También se puede editar la lista original; la copia incluida solo se usa cuando su URL sigue siendo la de IPTV.org. Verificados migración, edición persistente, duplicados, conservación de datos y eliminación sin reaparición mediante prueba con almacenamiento simulado.

## Versión 0.5.0

Instalada y abierta. Pantalla completa desde el icono superior del reproductor, la superficie del preview (sin cubrir los controles inferiores) o el botón existente. OK sobre el video enfocado también amplía. Atrás reduce el video; desde el catálogo abre confirmación de salida, con Cancelar como selección inicial. Atrás en el diálogo cancela. Verificada lógica de entrada/salida de pantalla completa y confirmación con DOM simulado; pendiente comprobación visual en TV.
