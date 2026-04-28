// ══════════════════════════════════════════════════
//  CajaClara — Supabase Configuration
//  INSTRUCCIONES:
//  1. Ve a https://supabase.com y crea un proyecto
//  2. En tu proyecto: Settings → API
//  3. Copia "Project URL" y "anon public key"
//  4. Pégalos abajo reemplazando los valores de ejemplo
// ══════════════════════════════════════════════════

const SUPABASE_URL = 'https://lwnbjlcqxkoiirbsvcjr.supabase.co';       // ← reemplaza esto
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3bmJqbGNxeGtvaWlyYnN2Y2pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMjYyMjUsImV4cCI6MjA5MjkwMjIyNX0.1zDOKyWR8BxY-Gs1T3NlM6O94frskVzZJQxdaq8E0Mc';       // ← reemplaza esto

// ── Carga el cliente de Supabase desde CDN ──
(function() {
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
  script.onload = function() {
    window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase conectado');
  };
  script.onerror = function() {
    // Offline fallback — crea un cliente mock para que la app funcione sin internet
    console.warn('⚠️ Sin conexión — modo offline activado');
    window.supabase = createOfflineClient();
  };
  document.head.appendChild(script);
})();

// ── Cliente offline para cuando no hay internet ──
function createOfflineClient() {
  let session = null;
  try {
    const stored = localStorage.getItem('cc_session');
    if (stored) session = JSON.parse(stored);
  } catch(e) {}

  return {
    auth: {
      getSession: async () => ({ data: { session }, error: null }),
      signInWithPassword: async ({ email }) => {
        const mockUser = { id: 'offline_' + btoa(email), email };
        session = { user: mockUser };
        localStorage.setItem('cc_session', JSON.stringify(session));
        return { data: { user: mockUser, session }, error: null };
      },
      signUp: async ({ email, options }) => {
        const mockUser = {
          id: 'offline_' + btoa(email),
          email,
          user_metadata: options?.data || {}
        };
        session = { user: mockUser };
        localStorage.setItem('cc_session', JSON.stringify(session));
        return { data: { user: mockUser, session }, error: null };
      },
      signOut: async () => {
        session = null;
        localStorage.removeItem('cc_session');
        return { error: null };
      }
    },
    from: (table) => ({
      select: (cols) => ({
        eq: (col, val) => ({
          order: (col, opts) => ({
            then: async (resolve) => resolve({ data: [], error: null })
          }),
          // Promise-like
          then: async (resolve) => resolve({ data: [], error: null })
        })
      }),
      insert: async (rows) => {
        return { data: rows, error: null };
      }
    })
  };
}

// ══════════════════════════════════════════════════
//  SQL para crear la tabla en Supabase
//  Copia y pega esto en Supabase → SQL Editor → New query
// ══════════════════════════════════════════════════
/*

-- Crear tabla de transacciones
create table public.transactions (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  type        text not null check (type in ('in', 'out')),
  amount      numeric(12,2) not null check (amount > 0),
  description text not null default '',
  category    text not null default 'Otros',
  created_at  timestamptz default now() not null
);

-- Habilitar Row Level Security (RLS)
alter table public.transactions enable row level security;

-- Política: cada usuario solo ve sus propias transacciones
create policy "Users can manage their own transactions"
  on public.transactions
  for all
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

-- Índice para búsquedas rápidas por usuario y fecha
create index idx_transactions_user_date
  on public.transactions (user_id, created_at desc);

*/
