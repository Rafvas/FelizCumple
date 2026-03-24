# 🌸 Cumpleaños Carla Elizabeth - 24 años

## ✅ Pasos para publicar en Netlify + Supabase

---

### 1. Configura Supabase

**Crea las tablas** en el SQL Editor de Supabase:

```sql
-- Fotos de invitados
CREATE TABLE user_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  uploader_name TEXT NOT NULL,
  caption TEXT,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mensajes
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_name TEXT NOT NULL,
  message_text TEXT NOT NULL,
  emoji TEXT DEFAULT '❤️',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilita tiempo real para ambas tablas
ALTER TABLE user_photos REPLICA IDENTITY FULL;
ALTER TABLE messages REPLICA IDENTITY FULL;
```

**Crea el Storage Bucket:**
- Ve a Storage → New Bucket
- Nombre: `birthday-photos`
- Marca como **Public**
- Policies: Allow all operations for anon (o configura según necesites)

**Row Level Security (RLS) — política básica para permitir inserciones:**
```sql
-- Para user_photos
ALTER TABLE user_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON user_photos FOR ALL USING (true) WITH CHECK (true);

-- Para messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON messages FOR ALL USING (true) WITH CHECK (true);
```

---

### 2. Actualiza app.js

Abre `app.js` y reemplaza estas líneas al principio:

```js
const SUPABASE_URL = 'TU_SUPABASE_URL_AQUI';        // ← tu Project URL
const SUPABASE_ANON_KEY = 'TU_SUPABASE_ANON_KEY_AQUI'; // ← tu anon/public key
```

Los encuentras en: Supabase → Settings → API

---

### 3. Sube a Netlify

**Opción A — Drag & Drop (más fácil):**
1. Ve a [netlify.com](https://netlify.com) y crea cuenta
2. Dashboard → "Add new site" → "Deploy manually"
3. Arrastra TODA la carpeta al área de deploy

**Opción B — GitHub:**
1. Sube la carpeta a un repositorio de GitHub
2. En Netlify: "Import from Git" → selecciona el repo
3. Build command: (vacío) | Publish directory: `.`

---

### 📂 Archivos del proyecto
```
├── index.html        ← página principal
├── style.css         ← todos los estilos
├── app.js            ← lógica + Supabase
├── netlify.toml      ← configuración Netlify
├── README.md         ← esta guía
└── photo_*.jpg       ← fotos de Carla (16 fotos)
```

---

¡Listo! 🎉 La página tendrá:
- 🖼️ Muro de fotos originales + fotos de invitados en tiempo real
- 📤 Subida de fotos con nombre y mensaje
- 💌 Muro de mensajes en tiempo real
- ✍️ Formulario para dejar mensaje con emoji
- 🌸 Pétalos animados flotando
- ⏳ Cuenta regresiva hasta el 28 de marzo
- 🎉 Botón confetti para celebrar
