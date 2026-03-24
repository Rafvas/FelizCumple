/* ============================================================
   CARLA ELIZABETH - 24 AÑOS · app.js
   Supabase integration + confetti + petals + interactions
   ============================================================
   
   SETUP INSTRUCTIONS:
   1. En Supabase, crea las siguientes tablas:
   
   -- Tabla para fotos de usuarios
   CREATE TABLE user_photos (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     uploader_name TEXT NOT NULL,
     caption TEXT,
     image_url TEXT NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   
   -- Tabla para mensajes
   CREATE TABLE messages (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     author_name TEXT NOT NULL,
     message_text TEXT NOT NULL,
     emoji TEXT DEFAULT '❤️',
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   
   -- Storage bucket llamado "birthday-photos" (público)
   
   2. Reemplaza SUPABASE_URL y SUPABASE_ANON_KEY con tus valores reales.
   ============================================================ */

// ── CONFIGURACIÓN SUPABASE ──────────────────────────────────
const SUPABASE_URL = 'TU_SUPABASE_URL_AQUI';
const SUPABASE_ANON_KEY = 'TU_SUPABASE_ANON_KEY_AQUI';
const STORAGE_BUCKET = 'birthday-photos';

// Detectar si está configurado
const IS_CONFIGURED = SUPABASE_URL !== 'TU_SUPABASE_URL_AQUI';

let supabase = null;
if (IS_CONFIGURED) {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// ── COUNTDOWN ──────────────────────────────────────────────
function updateCountdown() {
  const birthday = new Date('2025-03-28T00:00:00');
  const now = new Date();
  const diff = birthday - now;

  const wrapper = document.getElementById('countdown-wrapper');
  const msg = document.getElementById('birthday-msg');

  if (diff <= 0) {
    wrapper.style.display = 'none';
    msg.style.display = 'block';
    launchAutoConfetti();
    return;
  }

  const days  = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins  = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs  = Math.floor((diff % (1000 * 60)) / 1000);

  document.getElementById('c-days').textContent  = String(days).padStart(2, '0');
  document.getElementById('c-hours').textContent = String(hours).padStart(2, '0');
  document.getElementById('c-mins').textContent  = String(mins).padStart(2, '0');
  document.getElementById('c-secs').textContent  = String(secs).padStart(2, '0');
}
updateCountdown();
setInterval(updateCountdown, 1000);

// ── SECTION NAV ────────────────────────────────────────────
const navBtns = document.querySelectorAll('.nav-btn');
const sections = { gallery: document.getElementById('gallery'), upload: document.getElementById('upload'), messages: document.getElementById('messages'), write: document.getElementById('write') };

navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.section;
    navBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    Object.values(sections).forEach(s => s.classList.add('hidden'));
    sections[target].classList.remove('hidden');
    sections[target].scrollIntoView({ behavior: 'smooth', block: 'start' });

    if (target === 'gallery' && IS_CONFIGURED) loadUserPhotos();
    if (target === 'messages' && IS_CONFIGURED) loadMessages();
  });
});

// Handle anchor link from hero
document.querySelector('.scroll-cta')?.addEventListener('click', (e) => {
  e.preventDefault();
  document.querySelector('[data-section="gallery"]').click();
});

// ── CONFIG WARNING ──────────────────────────────────────────
function showConfigWarning(sectionId) {
  const section = document.getElementById(sectionId);
  const existing = section.querySelector('.config-warning');
  if (existing) return;
  const warn = document.createElement('div');
  warn.className = 'config-warning';
  warn.innerHTML = `⚙️ <strong>Configura Supabase en app.js</strong> para activar esta función.<br>
    Reemplaza <code>TU_SUPABASE_URL_AQUI</code> y <code>TU_SUPABASE_ANON_KEY_AQUI</code> con tus credenciales.`;
  section.querySelector('.section-header').after(warn);
}

// ── LOAD USER PHOTOS ────────────────────────────────────────
async function loadUserPhotos() {
  const container = document.getElementById('user-gallery');
  if (!IS_CONFIGURED) {
    container.innerHTML = `<div class="empty-state"><div class="empty-emoji">📸</div><p>Configura Supabase para ver las fotos de los invitados</p></div>`;
    showConfigWarning('gallery');
    return;
  }

  container.innerHTML = `<div class="loading-photos"><div class="spinner"></div><p>Cargando fotos...</p></div>`;

  try {
    const { data, error } = await supabase
      .from('user_photos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-emoji">📷</div><p>¡Sé el primero en subir una foto con Carla!</p></div>`;
      return;
    }

    container.innerHTML = '';
    data.forEach((photo, i) => {
      const card = document.createElement('div');
      card.className = 'user-photo-card';
      card.style.animationDelay = `${i * 0.1}s`;
      card.innerHTML = `
        <img src="${photo.image_url}" alt="Foto de ${photo.uploader_name}" loading="lazy" />
        ${photo.caption ? `<div class="user-photo-caption">${escapeHtml(photo.caption)}</div>` : ''}
        <div class="user-photo-author">${escapeHtml(photo.uploader_name)}</div>
      `;
      card.querySelector('img').addEventListener('click', () => openLightbox(photo.image_url, photo.caption || photo.uploader_name));
      container.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    container.innerHTML = `<div class="empty-state"><p>Error cargando fotos. Verifica la configuración de Supabase.</p></div>`;
  }
}

// ── LOAD MESSAGES ───────────────────────────────────────────
async function loadMessages() {
  const wall = document.getElementById('messages-wall');
  if (!IS_CONFIGURED) {
    wall.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-emoji">💌</div><p>Configura Supabase para ver los mensajes</p></div>`;
    showConfigWarning('messages');
    return;
  }

  wall.innerHTML = `<div class="loading-photos" style="grid-column:1/-1"><div class="spinner"></div><p>Cargando mensajes...</p></div>`;

  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      wall.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-emoji">✍️</div><p>¡Sé el primero en dejar un mensaje para Carla!</p></div>`;
      return;
    }

    wall.innerHTML = '';
    data.forEach((msg, i) => {
      const card = document.createElement('div');
      card.className = 'message-card';
      card.style.animationDelay = `${i * 0.08}s`;
      const date = new Date(msg.created_at).toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' });
      card.innerHTML = `
        <span class="msg-emoji">${msg.emoji || '❤️'}</span>
        <p class="msg-text">${escapeHtml(msg.message_text)}</p>
        <p class="msg-author">${escapeHtml(msg.author_name)}</p>
        <p class="msg-date">${date}</p>
      `;
      wall.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    wall.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><p>Error cargando mensajes. Verifica la configuración.</p></div>`;
  }
}

// ── REAL-TIME SUBSCRIPTIONS ─────────────────────────────────
if (IS_CONFIGURED && supabase) {
  supabase.channel('realtime-photos')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_photos' }, () => {
      if (!document.getElementById('gallery').classList.contains('hidden')) loadUserPhotos();
    }).subscribe();

  supabase.channel('realtime-messages')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
      if (!document.getElementById('messages').classList.contains('hidden')) loadMessages();
    }).subscribe();
}

// ── UPLOAD PHOTO ────────────────────────────────────────────
const fileInput = document.getElementById('file-input');
const uploadZone = document.getElementById('upload-zone');
const previewWrap = document.getElementById('preview-wrap');
const previewImg = document.getElementById('preview-img');
const removePreview = document.getElementById('remove-preview');
let selectedFile = null;

uploadZone.addEventListener('click', (e) => {
  if (!e.target.closest('.remove-preview')) fileInput.click();
});

uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.style.background = '#ffd8e4'; });
uploadZone.addEventListener('dragleave', () => { uploadZone.style.background = ''; });
uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.style.background = '';
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) handleFileSelect(file);
});

fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) handleFileSelect(fileInput.files[0]);
});

function handleFileSelect(file) {
  selectedFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImg.src = e.target.result;
    previewWrap.style.display = 'block';
    uploadZone.querySelector('.upload-icon').style.display = 'none';
    uploadZone.querySelector('.upload-main').style.display = 'none';
    uploadZone.querySelector('.upload-sub').style.display = 'none';
  };
  reader.readAsDataURL(file);
}

removePreview.addEventListener('click', (e) => {
  e.stopPropagation();
  selectedFile = null;
  previewWrap.style.display = 'none';
  previewImg.src = '';
  fileInput.value = '';
  uploadZone.querySelector('.upload-icon').style.display = '';
  uploadZone.querySelector('.upload-main').style.display = '';
  uploadZone.querySelector('.upload-sub').style.display = '';
});

document.getElementById('upload-btn').addEventListener('click', async () => {
  const name = document.getElementById('uploader-name').value.trim();
  const caption = document.getElementById('photo-caption').value.trim();
  const feedback = document.getElementById('upload-feedback');
  const btn = document.getElementById('upload-btn');

  if (!name) { showFeedback(feedback, 'Por favor ingresa tu nombre', 'error'); return; }
  if (!selectedFile) { showFeedback(feedback, 'Por favor selecciona una foto', 'error'); return; }

  if (!IS_CONFIGURED) {
    showFeedback(feedback, '⚙️ Configura Supabase en app.js para activar la subida de fotos', 'error');
    return;
  }

  btn.querySelector('.btn-text').style.display = 'none';
  btn.querySelector('.btn-loader').style.display = '';
  btn.disabled = true;

  try {
    const ext = selectedFile.name.split('.').pop();
    const filename = `photo_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(filename, selectedFile, { cacheControl: '3600', upsert: false });
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filename);
    const imageUrl = urlData.publicUrl;

    const { error: dbError } = await supabase.from('user_photos').insert([{ uploader_name: name, caption: caption || null, image_url: imageUrl }]);
    if (dbError) throw dbError;

    showFeedback(feedback, '🌸 ¡Foto subida con éxito! Ya puede verse en el muro.', 'success');
    document.getElementById('uploader-name').value = '';
    document.getElementById('photo-caption').value = '';
    removePreview.click();
    launchMiniConfetti();
  } catch (err) {
    console.error(err);
    showFeedback(feedback, `Error: ${err.message || 'No se pudo subir la foto'}`, 'error');
  } finally {
    btn.querySelector('.btn-text').style.display = '';
    btn.querySelector('.btn-loader').style.display = 'none';
    btn.disabled = false;
  }
});

// ── SEND MESSAGE ────────────────────────────────────────────
let selectedEmoji = '❤️';
document.querySelectorAll('.emoji-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedEmoji = btn.dataset.emoji;
    btn.style.transform = 'scale(1.3) rotate(-10deg)';
    setTimeout(() => { btn.style.transform = ''; }, 300);
  });
});
document.querySelector('.emoji-btn')?.classList.add('selected');

const msgText = document.getElementById('msg-text');
const charCount = document.getElementById('char-count');
msgText.addEventListener('input', () => { charCount.textContent = msgText.value.length; });

document.getElementById('send-msg-btn').addEventListener('click', async () => {
  const name = document.getElementById('msg-name').value.trim();
  const text = document.getElementById('msg-text').value.trim();
  const feedback = document.getElementById('msg-feedback');
  const btn = document.getElementById('send-msg-btn');

  if (!name) { showFeedback(feedback, 'Por favor ingresa tu nombre', 'error'); return; }
  if (!text) { showFeedback(feedback, 'Por favor escribe un mensaje', 'error'); return; }

  if (!IS_CONFIGURED) {
    showFeedback(feedback, '⚙️ Configura Supabase en app.js para enviar mensajes', 'error');
    return;
  }

  btn.querySelector('.btn-text').style.display = 'none';
  btn.querySelector('.btn-loader').style.display = '';
  btn.disabled = true;

  try {
    const { error } = await supabase.from('messages').insert([{ author_name: name, message_text: text, emoji: selectedEmoji }]);
    if (error) throw error;

    showFeedback(feedback, '💌 ¡Mensaje enviado! Carla lo leerá con mucho amor.', 'success');
    document.getElementById('msg-name').value = '';
    document.getElementById('msg-text').value = '';
    charCount.textContent = '0';
    launchMiniConfetti();
  } catch (err) {
    console.error(err);
    showFeedback(feedback, `Error: ${err.message || 'No se pudo enviar el mensaje'}`, 'error');
  } finally {
    btn.querySelector('.btn-text').style.display = '';
    btn.querySelector('.btn-loader').style.display = 'none';
    btn.disabled = false;
  }
});

// ── LIGHTBOX ────────────────────────────────────────────────
const lightbox = document.getElementById('lightbox');
function openLightbox(src, caption) {
  document.getElementById('lb-img').src = src;
  document.getElementById('lb-caption').textContent = caption || '';
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}
document.getElementById('lb-close').addEventListener('click', closeLightbox);
document.getElementById('lightbox-backdrop').addEventListener('click', closeLightbox);
function closeLightbox() {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
  document.getElementById('lb-img').src = '';
}

// Static photos lightbox
document.querySelectorAll('.photo-inner').forEach(card => {
  card.addEventListener('click', () => {
    const img = card.querySelector('img');
    openLightbox(img.src, img.alt);
  });
});

// ── HELPERS ─────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function showFeedback(el, msg, type) {
  el.textContent = msg;
  el.className = 'upload-feedback ' + type;
  setTimeout(() => { el.textContent = ''; el.className = 'upload-feedback'; }, 5000);
}

// ── FLOATING PETALS CANVAS ───────────────────────────────────
const canvas = document.getElementById('petals-canvas');
const ctx = canvas.getContext('2d');
let petals = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function createPetal() {
  return {
    x: Math.random() * canvas.width,
    y: -20,
    size: Math.random() * 10 + 5,
    speedY: Math.random() * 1.5 + 0.5,
    speedX: (Math.random() - 0.5) * 1,
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.05,
    opacity: Math.random() * 0.5 + 0.2,
    color: ['#f2c4ce','#e8a0b4','#c9748a','#f0dab0','#ffb3c1'][Math.floor(Math.random() * 5)],
    wobble: Math.random() * Math.PI * 2,
    wobbleSpeed: Math.random() * 0.02 + 0.01
  };
}

function drawPetal(p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);
  ctx.globalAlpha = p.opacity;
  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.ellipse(0, 0, p.size, p.size * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function animatePetals() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (petals.length < 25 && Math.random() < 0.05) petals.push(createPetal());

  petals = petals.filter(p => {
    p.y += p.speedY;
    p.x += p.speedX + Math.sin(p.wobble) * 0.8;
    p.wobble += p.wobbleSpeed;
    p.rotation += p.rotSpeed;
    drawPetal(p);
    return p.y < canvas.height + 30;
  });

  requestAnimationFrame(animatePetals);
}
animatePetals();

// ── CONFETTI ────────────────────────────────────────────────
document.getElementById('confetti-btn').addEventListener('click', launchAutoConfetti);

function launchAutoConfetti() {
  const count = 120;
  const colors = ['#c9748a','#f2c4ce','#c9a96e','#f0dab0','#fff','#ffb3c1','#ffd700'];
  for (let i = 0; i < count; i++) {
    setTimeout(() => spawnConfettiPiece(colors[Math.floor(Math.random() * colors.length)]), i * 20);
  }
}

function launchMiniConfetti() {
  const colors = ['#c9748a','#f2c4ce','#c9a96e','#ffd700'];
  for (let i = 0; i < 40; i++) {
    setTimeout(() => spawnConfettiPiece(colors[Math.floor(Math.random() * colors.length)]), i * 25);
  }
}

function spawnConfettiPiece(color) {
  const el = document.createElement('div');
  const size = Math.random() * 10 + 6;
  const x = Math.random() * 100;
  const delay = 0;
  const duration = Math.random() * 2 + 2;
  const isCircle = Math.random() > 0.5;

  Object.assign(el.style, {
    position: 'fixed',
    left: `${x}vw`,
    top: '-20px',
    width: `${size}px`,
    height: isCircle ? `${size}px` : `${size * 0.5}px`,
    background: color,
    borderRadius: isCircle ? '50%' : '2px',
    zIndex: '9999',
    pointerEvents: 'none',
    animation: `confettiFall ${duration}s ease-in ${delay}s forwards`,
    transform: `rotate(${Math.random() * 360}deg)`
  });

  document.body.appendChild(el);

  const keyframes = [
    { transform: `translateY(0) rotate(0deg) translateX(0)`, opacity: 1 },
    { transform: `translateY(${window.innerHeight + 50}px) rotate(${Math.random() * 720 - 360}deg) translateX(${(Math.random() - 0.5) * 200}px)`, opacity: 0 }
  ];
  el.animate(keyframes, { duration: duration * 1000, easing: 'ease-in', fill: 'forwards' })
    .onfinish = () => el.remove();
}

// Keyboard: close lightbox with Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeLightbox();
});

// Load initial data
if (IS_CONFIGURED) {
  loadUserPhotos();
}
