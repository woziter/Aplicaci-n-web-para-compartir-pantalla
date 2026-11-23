# Compartir pantalla

Aplicación web para transmitir la pantalla del equipo emisor a uno o más espectadores usando WebRTC.

## Requisitos

- Windows.
- Node.js `22.23.2` y npm `10.9.0` o superior.
- Un navegador compatible con la captura de pantalla, como Chrome o Edge.

## Instalación

1. Instala Node.js si todavía no está instalado.
2. Abre la carpeta del proyecto.
3. Ejecuta `instalar_dependencias.bat` y espera a que termine. El script instala las dependencias indicadas en `package-lock.json`.

También puedes instalar las dependencias desde una terminal abierta en esta carpeta con:

```bat
npm ci
```

## Iniciar el servidor

Ejecuta `iniciar_servidor.bat`, o desde una terminal en la carpeta del proyecto ejecuta:

```bat
node server.js
```

El servidor escucha en el puerto `5000` de forma predeterminada. Para cambiarlo, establece la variable de entorno `PORT` antes de iniciar Node.js.

## Uso

1. En el equipo que transmite, abre `http://localhost:5000`.
2. Pulsa **Compartir pantalla** y selecciona la ventana o pantalla que quieras transmitir.
3. Comparte con los espectadores el enlace que aparece en la página, por ejemplo `http://<IP-del-equipo>:5000/receiver`.
4. Para finalizar, pulsa **Detener** o termina la captura desde el navegador.

Para compartir con otros equipos de la red local, permite el puerto TCP `5000` en el firewall de Windows y asegúrate de que los equipos puedan comunicarse entre sí. La captura de pantalla requiere un contexto seguro: en el equipo emisor, `localhost` funciona para pruebas locales; si abres la página del emisor desde otro dispositivo, sirve el sitio mediante HTTPS. El acceso desde fuera de la red local también requiere configurar HTTPS y la conectividad de red correspondiente.

## Detener

En la ventana donde se está ejecutando el servidor, pulsa `Ctrl+C`.
