# Audara Socialchat Whatsapp

<!-- [START getstarted] -->
## Manual Técnico

<img src="https://v.fastcdn.co/u/074e20eb/21885821-0-audara-red-a-letter.png" height="100" align="right" style="margin-top:20px;">

###### Audara Socialchat Whatsapp

> Audara Socialchat Whatsapp es una integración realizada para lograr convertir un cliente whatsapp en un cliente con total interacción al sistema de comunicaciones unificadas de Audara, de esta forma es posible establecer comunicación de chat entre whatsapp y un agente Audara; siguiendo el proceso normal de un chat iniciado desde Livechat.


### Componentes implementados
* Node.js v10.1.0 +
* Puppeteer v1.13.0 +
* Crypto v1.0.1 +
* Qrcode-terminal v0.12.0 + 
* Ora v3.0.0 +

### Dependencias de Desarrollo Node.js
* 4.4.0

### Funcionalidades
* Establecer conexión de chat desde whatsapp con total usabilidad de texto, emoticones, vinculos; trabajando con la misma estructura de datos de Livechat Audara.
* Transferencia de imagenes en ambos sentidos.
**Nota:** 
La imagen enviada desde whatsapp con destino agente llega en formato miniatura (100PX).
* Calificación del chat por parte del usuario al finalizar la conversación.
* Cierre de la sesión por inactividad desde cualquier de las dos partes.
* Selección de campaña solicitada, con posibilidad de logueo con usuario y contraseña en caso de ser con registro.

### Instalación

Para instalar el Bot de Whatsapp audara es necesario seguir los siguientes pasos:

```bash
git clone https://github.com/geckosas/audara-socialchat-whatsapp.git
# Se clona desde el repositorio de Git la última versión del respositorio en su rama Master
```

Accedemos al directorio raiz del proyecto para instalar las dependencias node

```bash
npm install
# Se deben tener en cuenta los permisos del usuario y del directorio, no deben haber advertencias ni errores de permisos
```

Una vez instaladas las dependencias de node se ejecutará el proyecto dentro de la carpeta **/src/**

```bash
node index.js
# En esta instrucción, se cargará el proyecto y se ejecutará, el procedimiento es mostrado en consola.
```
**Para determinar si se ejecutó satisfactoriamente el proyecto debe salir como resultado final el código QR para enlazar la sesión de Whatsapp web**

### Estructura de Archivos del proyecto dentro de la carpeta **/src/**
* **WAPI.js:**
Dentro de este archivo se encuentran las funciones nativas de whatsapp, como lo són los listeners, senders, etc.
* **aes.js:**
Esta es la clase de encriptación que se usa para recibir y enviar mensajes por socket.
* **index.js:**
Por medio de este archivo se crea la estructura de emulación de la sesión de whatsapp y la inyección de componentes externos.
* **api.js:**
Dentro de este archivo se crea la estructura de conexión por Socket al DIS y donde interactuan los mensajes recibidos por parte de Whatsapp y Backend.
*Importante*
Se debe tener en cuenta el grupo enviado al DIS.
* **inject.js:**
Esta es la ventana entre whatsapp y el socket configurado anteriormente, es el primer filtro que entrega whatsapp en cada mensaje independientemente de su tipo.