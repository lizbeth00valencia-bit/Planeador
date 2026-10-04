# Planeador de Mercadeo Vita

Calendario con actividades recurrentes, categorías editables, horas planificadas y ejecutadas, observaciones por hora/día/mes, informes y exportación a Excel. Esta versión añade inicio de sesión propio y guardado en Supabase para consultar la misma información desde varios computadores.

## 1. Preparar el guardado en la nube

1. Crea una cuenta en https://supabase.com y un proyecto. Conserva la contraseña de la base de datos de forma privada; no se utiliza en estos archivos.
2. Abre **SQL Editor**, crea una consulta nueva, pega todo el contenido de `supabase.sql` y ejecútala una vez. Crea la tabla, sus permisos por usuario y el guardado que detecta cambios simultáneos.
3. En la configuración del proyecto copia su **Project URL** y la **Publishable key**. En proyectos con claves anteriores, utiliza exclusivamente la clave pública `anon`.
4. Edita `config.js`:

```js
window.VITA_CONFIG = {
  supabaseUrl: 'https://TU-PROYECTO.supabase.co',
  supabasePublishableKey: 'TU-CLAVE-PUBLICA'
};
```

La URL y la clave pública identifican el proyecto; pueden aparecer en el código. La privacidad de los datos se controla mediante el inicio de sesión y las políticas de la base de datos. **Nunca uses una clave `service_role`, `sb_secret_...`, la contraseña de la base de datos ni tu contraseña personal en el repositorio.** El cliente rechaza claves secretas o JWT que no tengan el rol `anon`.

## 2. Subir la página a GitHub

1. Extrae el ZIP en tu computador. No subas el ZIP como si fuera la página.
2. Crea un repositorio, por ejemplo `planeador-vita`.
3. Sube en la raíz `index.html`, `config.js`, `supabase-adapter.js`, `.nojekyll`, `supabase.sql` y este README. No subas tu respaldo JSON ni datos personales del calendario.
4. Abre **Settings → Pages**. En **Source** selecciona **Deploy from a branch**, rama **main**, carpeta **/(root)**, y guarda.
5. Espera a que GitHub muestre la dirección publicada, normalmente `https://TU-USUARIO.github.io/planeador-vita/`.

Si tu cuenta no permite Pages para un repositorio privado, utiliza un repositorio público para el código. El código público no contiene tus actividades: se guardan en Supabase y requieren tu sesión.

## 3. Activar el inicio de sesión

1. En Supabase abre **Authentication → Providers** y comprueba que **Email** esté habilitado.
2. En **Authentication → URL Configuration** coloca la dirección exacta de GitHub Pages como **Site URL** y añádela también en **Redirect URLs**, incluyendo la barra final. Debe coincidir con el enlace que utilizarás en ambos computadores.
3. Abre el planeador publicado. Escribe el correo y la contraseña que quieres usar y pulsa **Crear cuenta**. Confirma el correo si Supabase lo requiere y después inicia sesión.
4. Puedes desactivar nuevos registros desde Supabase después de crear tu cuenta si únicamente tú utilizarás el planeador. No desactives el proveedor Email ni el inicio de sesión existente.

No necesitas abrir ChatGPT ni iniciar sesión en GitHub para utilizar el planeador. Utiliza el mismo correo y contraseña del planeador desde casa y el trabajo. Cada cuenta tiene sus propios datos; esta versión comparte tu planeador entre tus computadores, no entre cuentas distintas.

## 4. Traer la información del archivo anterior

1. Abre el planeador HTML anterior en el navegador donde registraste tus actividades.
2. Pulsa **Exportar respaldo** y guarda el JSON.
3. Abre la nueva página, inicia sesión y pulsa **Importar respaldo**.
4. Espera a que aparezca **Guardado en la nube** antes de cerrar la página o abrirla en el otro computador.

Haz esta importación inicial una vez, preferiblemente antes de empezar a editar datos en la web. La importación del prototipo combina registros; no es el mecanismo de sincronización entre computadores.

## Cómo funciona el guardado

- Pulsa **Guardar** al editar actividades u observaciones. Los cambios se envían automáticamente a Supabase.
- El indicador distingue cambios pendientes, errores y confirmación de guardado en la nube.
- Si pierdes conexión durante una sesión abierta, los cambios guardados se conservan en una copia local asociada a tu usuario. Se reintentan al recuperar internet. No borres los datos del navegador mientras haya cambios pendientes.
- Antes de salir o cambiar de computador, espera **Guardado en la nube**. Los cambios aún no enviados no estarán disponibles en el otro equipo.
- Los cambios de otro computador se consultan cada 15 segundos y al volver a la pestaña. No se reemplazan formularios que aún estés editando.
- Si los dos equipos cambian datos distintos, se combinan. Si cambian el mismo dato, se pide elegir qué versión conservar; puedes descargar tu copia antes de resolverlo.
- El botón **Cerrar sesión** requiere guardar los cambios pendientes. La sesión se conserva en esta pestaña mediante `sessionStorage`; no se configura un inicio de sesión permanente en el computador del trabajo.
- Mantén también respaldos JSON periódicos. Excel sirve para consulta y no sustituye el respaldo restaurable.

## Archivos y configuración

| Archivo | Uso |
| --- | --- |
| `index.html` | Calendario y todas las funciones del planeador. |
| `config.js` | URL del proyecto y clave pública de Supabase. |
| `supabase-adapter.js` | Inicio de sesión y conexión con la base de datos. |
| `supabase.sql` | Tabla, políticas de privacidad y guardado con revisión. |
| `.nojekyll` | Publicación directa de los archivos en GitHub Pages. |
| `.gitignore` | Excluye respaldos y archivos locales cuando se usa Git. |

Las actividades de ejemplo no están precargadas. La base de datos no se activa por subir los archivos: debes ejecutar el SQL y completar `config.js`.

La página utiliza el cliente oficial de Supabase servido por CDN. No requiere instalar Node, compilar ni ejecutar un servidor propio. El calendario muestra tu horario fijo y advierte las semanas de 44 horas; el cupo de actividades se limita a 42 horas semanales.

## Verificación realizada

Se verificó la sintaxis del calendario y del inicio de sesión y se probaron la lógica de guardado, las copias pendientes sin conexión, la recuperación al volver, las eliminaciones y los conflictos entre equipos con una base simulada. El calendario, las recurrencias y la exportación de Excel conservan su funcionamiento anterior.

La publicación real, el correo de confirmación, las políticas SQL en Supabase y el guardado desde dos navegadores deben verificarse después de configurar tus cuentas. Este proyecto todavía no está publicado ni conectado a una base de datos real.

## Documentación oficial

- GitHub Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
- Supabase Email y contraseña: https://supabase.com/docs/guides/auth/passwords
- Claves públicas y secretas: https://supabase.com/docs/guides/getting-started/api-keys
- Privacidad por usuario: https://supabase.com/docs/guides/database/postgres/row-level-security
