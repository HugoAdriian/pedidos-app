# Pedidos App

Aplicación móvil para **pedidos en cafeterías y negocios locales**. Los clientes exploran el menú de cada negocio, arman su pedido y siguen su estado en tiempo real. Los negocios se registran, administran su propio menú y reciben los pedidos al instante.

> Estado: en desarrollo activo. Proyecto de portafolio construido de principio a fin (base de datos, seguridad, backend y app móvil).

## Capturas

| Inicio de sesión | Negocios | Menú |
|---|---|---|
| ![Login](docs/screenshots/01-login.png) | ![Negocios](docs/screenshots/02-negocios.png) | ![Menú](docs/screenshots/03-menu.png) |

| Producto con opciones | Carrito | Mis pedidos |
|---|---|---|
| ![Producto](docs/screenshots/04-producto.png) | ![Carrito](docs/screenshots/05-carrito.png) | ![Mis pedidos](docs/screenshots/06-mis-pedidos.png) |

| Panel del negocio | Bandeja de pedidos |
|---|---|
| ![Panel](docs/screenshots/07-panel-menu.png) | ![Bandeja](docs/screenshots/08-bandeja-pedidos.png) |

## Funcionalidades

**Para clientes**
- Registro e inicio de sesión, con sesión persistente.
- Lista de negocios con estado abierto o cerrado.
- Menú por categorías, con productos y precios.
- Opciones por producto (por ejemplo, tamaño con precio adicional) y cantidad.
- Carrito de un solo negocio a la vez, con confirmación antes de vaciarlo.
- Pedido con notas para el negocio.
- Historial de pedidos con el estado actualizado en tiempo real.
- Botón **Cómo llegar** que abre la ruta al local en Google Maps.

**Para negocios**
- Registro de la cafetería, con la ubicación tomada del GPS del teléfono.
- Panel para administrar categorías y productos: crear, editar, eliminar y marcar como disponible o no.
- Interruptor para abrir o cerrar el negocio.
- Bandeja de pedidos en tiempo real: el teléfono vibra al llegar uno nuevo.
- Flujo de estados: pendiente, aceptado, preparando, listo y entregado, con opción de cancelar.

## Tecnologías

| Área | Herramientas |
|---|---|
| App móvil | React Native, Expo (SDK 58), TypeScript |
| Navegación | Expo Router (rutas basadas en archivos y rutas protegidas) |
| Datos del servidor | TanStack Query |
| Estado local | Zustand (carrito) |
| Backend | Supabase: PostgreSQL, Auth, Realtime |
| Ubicación | expo-location y enlaces de Google Maps (sin API key) |

## Decisiones técnicas

- **Seguridad a nivel de base de datos (RLS).** Todas las tablas tienen Row Level Security. El catálogo es público para lectura, pero solo el dueño de un negocio puede modificarlo. Cada cliente solo ve sus pedidos y cada dueño solo los de su negocio.
- **Pedidos creados por una función del servidor.** `create_order()` recalcula los precios desde la base de datos, valida disponibilidad y guarda el pedido de forma atómica. Los usuarios no tienen permiso de insertar pedidos directamente, así que no se puede falsificar un total desde la app.
- **Permisos por columna.** El dueño solo puede modificar el estado de un pedido, no su total ni otros datos.
- **Historial inmutable.** Cada línea del pedido guarda una copia del nombre y precio al momento de la compra, así que cambiar el menú después no altera pedidos pasados.
- **Tiempo real filtrado.** Las suscripciones de Supabase Realtime filtran por cliente o por negocio y respetan las políticas RLS.
- **Caché sin fugas entre cuentas.** Las consultas incluyen el id del usuario en su clave, para no mostrar datos de otra sesión.
- **Rutas protegidas.** Los layouts de Expo Router redirigen al login si no hay sesión, y a la app si ya la hay.
- **Google Maps sin costo.** El botón "Cómo llegar" usa Maps URLs, que no requieren API key ni facturación.

## Estructura del proyecto

```
src/
├── app/                      # Pantallas (Expo Router)
│   ├── (auth)/               # Login y registro
│   └── (app)/                # Zona con sesión
│       ├── (tabs)/           # Inicio, Pedidos, Perfil
│       ├── business/[id]     # Menú de un negocio
│       ├── product/[id]      # Detalle y opciones de un producto
│       ├── cart              # Carrito y confirmación
│       └── my-business/      # Registro, panel de menú y bandeja de pedidos
├── features/                 # Lógica por dominio
│   ├── auth/                 # Contexto de sesión
│   ├── businesses/           # Catálogo (lectura)
│   ├── cart/                 # Estado del carrito (Zustand)
│   ├── orders/               # Pedidos del cliente y tiempo real
│   └── my-business/          # Gestión del negocio
└── lib/supabase.ts           # Cliente de Supabase
supabase/
├── migrations/               # Esquema, permisos, funciones y seguridad
└── seed.sql                  # Datos de ejemplo
```

## Cómo ejecutarlo

### Requisitos
- Node.js 22.13 o superior
- Una cuenta gratuita en [Supabase](https://supabase.com)
- La app **Expo Go** en un teléfono Android (o un emulador de Android Studio)

### 1. Clonar e instalar
```bash
git clone https://github.com/HugoAdriian/pedidos-app.git
cd pedidos-app
npm install
```

### 2. Preparar Supabase
1. Crea un proyecto nuevo en Supabase.
2. Abre **SQL Editor** y ejecuta, en orden, los archivos de `supabase/migrations/` (de `001` a `005`).
3. En **Authentication → Sign In / Providers → Email**, desactiva **Confirm email** mientras desarrollas. Vuelve a activarlo antes de publicar.

### 3. Variables de entorno
Copia el archivo de ejemplo y completa tus datos (URL y clave *publishable* del proyecto, que encuentras en el botón **Connect** de Supabase):
```bash
cp .env.example .env
```

### 4. Arrancar
```bash
npx expo start
```
Escanea el código QR desde Expo Go.

### 5. Datos de ejemplo (opcional)
Registra un usuario desde la app y luego ejecuta `supabase/seed.sql` en el SQL Editor para crear una cafetería de prueba con menú.

## Próximos pasos

- Edición de opciones de producto (tamaños y extras) desde el panel del negocio.
- Notificaciones push cuando cambia el estado de un pedido.
- Pruebas automáticas e integración continua.
- Pagos en línea.
- Entrega a domicilio.

## Autor

Hugo Adrián · [GitHub](https://github.com/HugoAdriian)
