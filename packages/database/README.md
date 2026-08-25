# @treinta/database

Esquema de base de datos PostgreSQL, políticas RLS, funciones y triggers para el Clon de Treinta en **Supabase**.

## 🚀 Cómo aplicar las migraciones en Supabase

### Opción A: Desde el SQL Editor del Dashboard de Supabase (Recomendada y Rápida)
1. Inicia sesión en [Supabase](https://supabase.com) y entra a tu proyecto.
2. Abre la pestaña **SQL Editor** en el menú lateral.
3. Copia y pega el contenido completo de [`migrations/001_initial_schema.sql`](./migrations/001_initial_schema.sql) y haz clic en **Run**.
4. *(Opcional)* Copia y pega el contenido de [`seed/seed_data.sql`](./seed/seed_data.sql) y haz clic en **Run** para cargar productos y datos de prueba en pesos colombianos (COP).

### Opción B: Usando Supabase CLI
```bash
# Iniciar Supabase localmente
supabase start

# Aplicar migraciones
supabase db reset
```

## 🛡️ Seguridad y Multi-Tenant (RLS)
- Todas las tablas tienen Row Level Security habilitado.
- El aislamiento de datos se garantiza con la función `public.auth_negocio_id()`.
- Los empleados solo pueden operar ventas y ver inventario.
- Los administradores y propietarios tienen acceso total a balances, reportes, gastos y configuración.
