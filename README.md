# 🚀 Clon de Treinta - Sistema de Gestión de Negocio

Aplicación de gestión inspirada en **Treinta** enfocada en:
1. **Ventas (Punto de Venta / POS)** con catálogo visual, canasta reactiva, venta libre y múltiples medios de pago (Efectivo, Nequi, Daviplata, Tarjeta, Transferencia y Fiado a crédito).
2. **Gastos y Egresos** con impacto automático en caja y cuentas por pagar a proveedores.
3. **Inventario en Tiempo Real** con alertas de stock mínimo, valorización a costo/venta y trazabilidad (Kardex).
4. **Balance General y Flujo de Caja** con métricas en tiempo real, arqueo de caja (apertura/cierre de turnos) y control de cuentas por cobrar/pagar.
5. **Directorio de Clientes y Proveedores** con estados de deuda y abonos parciales.
6. **Control de Roles** (Administrador/Propietario con acceso total y Empleado/Cajero enfocado en POS e inventario).

---

## 📁 Estructura del Monorepo

```
aplicacion_treinta/
├── apps/
│   ├── desktop/              # App de Escritorio (Vite + React 18 + TailwindCSS + Zustand)
│   └── mobile/               # App Móvil (Expo / React Native - Preparada para Fase 6)
├── packages/
│   ├── shared/               # Tipos TypeScript, validaciones Zod, constantes y utilidades
│   └── database/             # Migraciones PostgreSQL, RLS, triggers y seed de Supabase
├── package.json
└── tsconfig.base.json
```

---

## ⚡ Cómo Iniciar en Desarrollo

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Iniciar la aplicación de escritorio**:
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

3. **Construir para producción**:
   ```bash
   npm run build
   ```

---

## 🗄️ Conectar con Supabase (Nube)

1. Abre tu proyecto en [Supabase](https://supabase.com).
2. Ve al **SQL Editor** y ejecuta [`packages/database/migrations/001_initial_schema.sql`](./packages/database/migrations/001_initial_schema.sql).
3. *(Opcional)* Para cargar productos y datos de prueba de ejemplo colombiano, ejecuta [`packages/database/seed/seed_data.sql`](./packages/database/seed/seed_data.sql).
4. En `apps/desktop/`, crea un archivo `.env` a partir de `.env.example` con tus credenciales:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key
   ```
