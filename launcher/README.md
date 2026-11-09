# Ezio TV — prueba para LJ5500

Versión 0.2.0: nueva identidad Ezio TV, icono propio, tarjetas con iconos SVG por función, fondo carbón y foco verde salvia, reloj y fecha. Resolución 1280x720, diseño adaptable al espacio disponible y desplazamiento automático al seleccionar tarjetas. Verificados catálogo, iconos, reloj, fecha y navegación con una prueba de DOM simulado; pendiente valoración visual del usuario en la TV.

Aplicación ES5 sin dependencias ni fondos animados para LG 43LJ5500-UA, firmware 06.10.60, SDK 3.9.0. Descubre aplicaciones mediante Homebrew Channel con root y ofrece accesos a las entradas HDMI del catálogo del sistema.

Instalada y abierta como `com.freetv.lighthome` en 10.73.40.80. El servicio de instalación confirmó `state: installed` y el gestor de aplicaciones confirmó el lanzamiento. Se verificó acceso al servicio root usando la identidad de la app. Sintaxis verificada con `node --check launcher/app.js`.

Pendiente comprobación visual por el usuario: catálogo, navegación y apertura de aplicaciones. No modifica Home, archivos del sistema ni inicio automático. Atrás cierra la aplicación. Puede desinstalarse desde la lista de apps de LG.

Los proyectos revisados no confirman reemplazo de Home para esta generación. La integración del botón Home requiere una investigación adicional específica para webOS 3; no se ha aplicado ningún parche.

Paquete: `../build/com.freetv.lighthome_0.1.0_all.ipk`.
