/* ============================================================
   FRONTEND/APP.JS — SISTEMA ULTRA-BLINDADO CON DELEGACIÓN
   ============================================================ */

const API = '/api';
let listaCompra = [];
let authMode = 'login';
window._productosBuscados = [];

// Cargar la lista desde localStorage de forma segura
if (localStorage.getItem('lista_compra')) {
  try {
    listaCompra = JSON.parse(localStorage.getItem('lista_compra'));
  } catch (e) {
    listaCompra = [];
  }
}

// ── TOAST NOTIFICACIONES FLOTANTES ───────────────────────────
function toast(mensaje) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.innerHTML = mensaje;
  t.className = 'toast visible'; // Forzamos clase limpia
  setTimeout(() => {
    t.className = 'toast';
  }, 2500);
}

// ── NAVEGACIÓN INTERNA (SPA) ────────────────────────────────
function irA(paginaId, elementoMenu) {
  document.querySelectorAll('.pagina').forEach(p => p.classList.remove('activa'));
  const pag = document.getElementById(`pagina-${paginaId}`);
  if (pag) pag.classList.add('activa');

  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('activo'));
  if (elementoMenu) {
    elementoMenu.classList.add('activo');
  } else {
    const btnPerfil = document.getElementById('nav-perfil-btn');
    if (paginaId === 'perfil' && btnPerfil) btnPerfil.classList.add('activo');
  }

  if (paginaId === 'ofertas') {
    cargarOfertas();
  } else if (paginaId === 'lista') {
    actualizarVistaLista();
  } else if (paginaId === 'perfil') {
    verificarEstadoUsuario();
  }
}

// ============================================================
// 🔍 SECCIÓN 1: COMPARADOR DE PRECIOS
// ============================================================
async function buscar() {
  const query = document.getElementById('busqueda').value.trim();
  const superFiltro = document.getElementById('filtro-supermercado').value;
  const container = document.getElementById('resultados-container');

  container.innerHTML = `<div class="loading-state"><div class="spinner"></div> Buscando...</div>`;

  try {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (superFiltro) params.set('supermercado', superFiltro);
    const url = params.toString() ? `${API}/products?${params.toString()}` : `${API}/products`;
    const res = await fetch(url);
    const datos = await res.json();

    if (!datos.productos || datos.productos.length === 0) {
      container.innerHTML = `<div class="empty-state"><span class="empty-icon">🔍</span>No hay resultados.</div>`;
      return;
    }

    window._productosBuscados = datos.productos;
    renderizarTablaProductos(datos.productos);
  } catch (error) {
    console.error(error);
    container.innerHTML = `<div class="empty-state">⚠️ Error de conexión.</div>`;
  }
}

function renderizarTablaProductos(productos) {
  const container = document.getElementById('resultados-container');
  const minPrecio = Math.min(...productos.map(p => p.precio));

  let html = `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Supermercado</th>
            <th>Precio</th>
            <th style="text-align:right;">Acción</th>
          </tr>
        </thead>
        <tbody>
  `;

  productos.forEach((p, index) => {
    const esElMasBarato = p.precio === minPrecio;
    html += `
      <tr class="${esElMasBarato ? 'row-best' : ''}">
        <td>
          <div class="item-nombre">${p.nombre}</div>
          <div style="font-size:0.8rem; color:var(--muted);">${p.detalles || '1L • Hacendado'}</div>
        </td>
        <td><span class="super-badge super-${p.supermercado.toLowerCase()}">${p.supermercado}</span></td>
        <td><span style="font-weight:600;">${p.precio.toFixed(2)} €</span></td>
        <td style="text-align:right;">
          <button class="btn-primary btn-accion-añadir" data-index="${index}">Añadir</button>
        </td>
      </tr>
    `;
  });

  html += `</tbody></table></div>`;
  container.innerHTML = html;
}

// ============================================================
// 🛍️ FILTROS Y OFERTAS
// ============================================================

function filtrarCategoria(categoria, button) {
  document.querySelectorAll('#pagina-comparador .chip').forEach(chip => chip.classList.remove('activo'));
  if (button) button.classList.add('activo');

  if (categoria === 'todas') {
    renderizarTablaProductos(window._productosBuscados);
    return;
  }

  const filtrados = window._productosBuscados.filter(p => p.categoria?.toLowerCase() === categoria.toLowerCase());
  renderizarTablaProductos(filtrados);
}

async function cargarOfertas() {
  const container = document.getElementById('ofertas-grid');
  if (!container) return;

  container.innerHTML = `<div class="loading-state"><div class="spinner"></div> Cargando ofertas...</div>`;

  try {
    const res = await fetch(`${API}/offers`);
    const datos = await res.json();
    if (!datos.ofertas || datos.ofertas.length === 0) {
      container.innerHTML = `<div class="empty-state">No hay ofertas disponibles.</div>`;
      return;
    }

    window._ofertasCargadas = datos.ofertas;

    container.innerHTML = datos.ofertas.map(o => {
      return `
        <div class="oferta-card">
          <div class="oferta-header">
            <span class="oferta-emoji">${o.emoji || '🏷️'}</span>
            <span class="super-badge super-${o.supermercado.toLowerCase()}">${o.supermercado}</span>
          </div>
          <h3>${o.nombre}</h3>
          <p class="oferta-desc">${o.descripcion}</p>
          <div class="oferta-meta">
            <span class="precio-antes">${o.precioAntes.toFixed(2)} €</span>
            <span class="precio-ahora">${o.precioAhora.toFixed(2)} €</span>
            <span class="oferta-ahorro">-${o.descuentoPct}%</span>
          </div>
          <div class="oferta-actions">
            <button class="btn-primary btn-add-offer" data-id="${o.id}">Añadir oferta</button>
          </div>
          <div class="oferta-footer">Hasta ${o.hasta}</div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error al cargar ofertas:', error);
    container.innerHTML = `<div class="empty-state">Error al cargar las ofertas.</div>`;
  }
}

async function filtrarOfertas(supermercado, button) {
  document.querySelectorAll('#pagina-ofertas .chip').forEach(chip => chip.classList.remove('activo'));
  if (button) button.classList.add('activo');

  const params = new URLSearchParams();
  if (supermercado && supermercado !== 'todas') params.set('supermercado', supermercado);

  const container = document.getElementById('ofertas-grid');
  if (!container) return;
  container.innerHTML = `<div class="loading-state"><div class="spinner"></div> Cargando ofertas...</div>`;

  try {
    const res = await fetch(`${API}/offers?${params.toString()}`);
    const datos = await res.json();
    if (!datos.ofertas || datos.ofertas.length === 0) {
      container.innerHTML = `<div class="empty-state">No hay ofertas para ese supermercado.</div>`;
      return;
    }

    window._ofertasCargadas = datos.ofertas;

    container.innerHTML = datos.ofertas.map(o => {
      return `
        <div class="oferta-card">
          <div class="oferta-header">
            <span class="oferta-emoji">${o.emoji || '🏷️'}</span>
            <span class="super-badge super-${o.supermercado.toLowerCase()}">${o.supermercado}</span>
          </div>
          <h3>${o.nombre}</h3>
          <p class="oferta-desc">${o.descripcion}</p>
          <div class="oferta-meta">
            <span class="precio-antes">${o.precioAntes.toFixed(2)} €</span>
            <span class="precio-ahora">${o.precioAhora.toFixed(2)} €</span>
            <span class="oferta-ahorro">-${o.descuentoPct}%</span>
          </div>
          <div class="oferta-actions">
            <button class="btn-primary btn-add-offer" data-id="${o.id}">Añadir oferta</button>
          </div>
          <div class="oferta-footer">Hasta ${o.hasta}</div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error al filtrar ofertas:', error);
    container.innerHTML = `<div class="empty-state">Error al filtrar ofertas.</div>`;
  }
}

function añadirManual() {
  const nombre = document.getElementById('input-manual')?.value.trim();
  const precio = parseFloat(document.getElementById('input-precio')?.value);
  if (!nombre) return toast('Introduce un nombre válido.');
  if (Number.isNaN(precio) || precio <= 0) return toast('Introduce un precio válido.');

  listaCompra.push({ nombre, precio, supermercado: 'Manual', cantidad: 1, comprado: false });
  localStorage.setItem('lista_compra', JSON.stringify(listaCompra));
  actualizarVistaLista();
  document.getElementById('input-manual').value = '';
  document.getElementById('input-precio').value = '';
  toast('Producto añadido manualmente.');
}

function vaciarLista() {
  if (!confirm('¿Deseas vaciar toda la lista de la compra?')) return;
  listaCompra = [];
  localStorage.setItem('lista_compra', JSON.stringify(listaCompra));
  actualizarVistaLista();
}

function agregarOfertaALista(id, btn) {
  const oferta = window._ofertasCargadas.find(o => String(o.id) === String(id));
  if (!oferta) return toast('No se encontró la oferta.');

  const existente = listaCompra.find(item => item.nombre === oferta.nombre && item.supermercado === oferta.supermercado);
  if (existente) {
    existente.cantidad += 1;
  } else {
    listaCompra.push({
      nombre: oferta.nombre,
      precio: oferta.precioAhora,
      supermercado: oferta.supermercado,
      cantidad: 1,
      comprado: false
    });
  }

  localStorage.setItem('lista_compra', JSON.stringify(listaCompra));
  actualizarVistaLista();
  toast(`Oferta añadida: ${oferta.nombre}`);
  animarBotonAñadir(btn);
}

async function procesarAuth(event) {
  event.preventDefault();
  const email = document.getElementById('auth-email')?.value.trim();
  const password = document.getElementById('auth-password')?.value;

  if (!email) {
    return toast('Introduce un correo válido.');
  }

  try {
    let url = `${API}/auth/login`;
    let body = { email, password };
    if (authMode === 'registro') {
      url = `${API}/auth/register`;
      if (!password) return toast('Introduce una contraseña para registrarte.');
    } else if (authMode === 'restablecer') {
      url = `${API}/auth/forgot-password`;
      if (!password) return toast('Introduce la nueva contraseña para restablecer.');
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const datos = await res.json();

    if (!res.ok) {
      return toast(datos.error || 'Error al procesar la autenticación.');
    }

    if (authMode === 'login') {
      localStorage.setItem('user_token', datos.token);
      localStorage.setItem('user_email', datos.usuario?.email || email);
      toast('Inicio de sesión correcto.');
      cambiarModoAuth('login');
      verificarEstadoUsuario();
      irA('perfil');
    } else if (authMode === 'registro') {
      toast('Registro exitoso. Ahora inicia sesión.');
      cambiarModoAuth('login');
    } else if (authMode === 'restablecer') {
      toast('Contraseña actualizada. Inicia sesión de nuevo.');
      cambiarModoAuth('login');
    }
  } catch (error) {
    console.error('Error auth:', error);
    toast('Error de conexión con el servidor.');
  }
}

function cambiarModoAuth(modo) {
  authMode = modo;
  const titulo = document.getElementById('auth-form-title');
  const desc = document.getElementById('auth-form-desc');
  const btn = document.getElementById('auth-submit-btn');
  const toggleLink = document.getElementById('toggle-auth-mode-link');
  const forgotLink = document.getElementById('forgot-password-link');
  const passwordInput = document.getElementById('auth-password');

  if (modo === 'login') {
    titulo.textContent = 'Iniciar sesión';
    desc.textContent = 'Accede a tu cuenta para guardar tus listas e historial de ahorro';
    btn.textContent = 'Entrar';
    toggleLink.textContent = '¿No tienes cuenta? Regístrate aquí';
    forgotLink.style.display = 'block';
    passwordInput.placeholder = '••••••••';
    passwordInput.required = true;
  } else if (modo === 'registro') {
    titulo.textContent = 'Crear cuenta';
    desc.textContent = 'Regístrate para guardar tus listas y acceder desde cualquier dispositivo';
    btn.textContent = 'Registrarme';
    toggleLink.textContent = '¿Ya tienes cuenta? Inicia sesión';
    forgotLink.style.display = 'block';
    passwordInput.placeholder = 'Elige una contraseña segura';
    passwordInput.required = true;
  } else if (modo === 'restablecer') {
    titulo.textContent = 'Restablecer contraseña';
    desc.textContent = 'Introduce tu correo y la nueva contraseña para actualizar tus credenciales';
    btn.textContent = 'Restablecer';
    toggleLink.textContent = 'Volver al inicio de sesión';
    forgotLink.style.display = 'none';
    passwordInput.placeholder = 'Nueva contraseña';
    passwordInput.required = true;
  }

  toggleLink.onclick = (e) => {
    e.preventDefault();
    cambiarModoAuth(modo === 'login' ? 'registro' : 'login');
  };
}

function cerrarSesionUser() {
  localStorage.removeItem('user_token');
  localStorage.removeItem('user_email');
  toast('Sesión cerrada.');
  verificarEstadoUsuario();
}

// LÓGICA DE AÑADIR CON GRIS BLINDADO
function ejecutarAñadir(index, btn) {
  const prod = window._productosBuscados[index];
  if (!prod) return;

  const existente = listaCompra.find(item => item.nombre === prod.nombre && item.supermercado === prod.supermercado);
  if (existente) {
    existente.cantidad++;
  } else {
    listaCompra.push({
      nombre: prod.nombre,
      precio: prod.precio,
      supermercado: prod.supermercado,
      cantidad: 1,
      comprado: false
    });
  }

  localStorage.setItem('lista_compra', JSON.stringify(listaCompra));
  actualizarVistaLista();
  toast(`Añadido: ${prod.nombre}`);

  // Forzar el cambio de color gris rompiendo cualquier CSS previo
  if (btn) {
    btn.innerHTML = "✓ Añadir";
    btn.disabled = true;
    btn.style.setProperty('background', '#7a8a83', 'important');
    btn.style.setProperty('background-image', 'none', 'important');
    btn.style.setProperty('border-color', '#7a8a83', 'important');
    btn.style.setProperty('opacity', '0.7', 'important');
    btn.style.setProperty('color', '#ffffff', 'important');

    setTimeout(() => {
      btn.innerHTML = "Añadir";
      btn.disabled = false;
      btn.style.removeProperty('background');
      btn.style.removeProperty('background-image');
      btn.style.removeProperty('border-color');
      btn.style.removeProperty('opacity');
      btn.style.removeProperty('color');
    }, 1000);
  }
}

function animarBotonAñadir(btn) {
  if (!btn) return;
  btn.innerHTML = "✓ Añadir";
  btn.disabled = true;
  btn.style.setProperty('background', '#7a8a83', 'important');
  btn.style.setProperty('background-image', 'none', 'important');
  btn.style.setProperty('border-color', '#7a8a83', 'important');
  btn.style.setProperty('opacity', '0.7', 'important');
  btn.style.setProperty('color', '#ffffff', 'important');

  setTimeout(() => {
    btn.innerHTML = "Añadir";
    btn.disabled = false;
    btn.style.removeProperty('background');
    btn.style.removeProperty('background-image');
    btn.style.removeProperty('border-color');
    btn.style.removeProperty('opacity');
    btn.style.removeProperty('color');
  }, 1000);
}

// ============================================================
// 📝 SECCIÓN 2: LISTA DE LA COMPRA E HISTORIAL (GUARDAR Y ELIMINAR)
// ============================================================
function actualizarVistaLista() {
  const container = document.getElementById('lista-items');
  const totalLabel = document.getElementById('lista-total');
  if (!container) return;

  if (listaCompra.length === 0) {
    container.innerHTML = `<li class="empty-state">Tu lista está vacía.</li>`;
    if (totalLabel) totalLabel.innerHTML = `Total: 0.00 €`;
    return;
  }

  container.innerHTML = '';
  let subtotal = 0;

  listaCompra.forEach((item, index) => {
    const costeItem = item.precio * item.cantidad;
    if (!item.comprado) subtotal += costeItem;

    const li = document.createElement('li');
    li.className = `lista-item ${item.comprado ? 'comprado' : ''}`;
    li.innerHTML = `
      <div style="display:flex; align-items:center; gap:12px;">
        <input type="checkbox" class="check-comprado" data-index="${index}" ${item.comprado ? 'checked' : ''}>
        <div>
          <span class="item-nombre">${item.nombre}</span><br>
          <span class="super-badge super-${item.supermercado.toLowerCase()}">${item.supermercado}</span>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:20px;">
        <div class="qty-controls">
          <button class="btn-qty-menos" data-index="${index}">-</button>
          <span>${item.cantidad}</span>
          <button class="btn-qty-mas" data-index="${index}">+</button>
        </div>
        <span class="item-precio">${costeItem.toFixed(2)} €</span>
        <button class="btn-delete item-eliminar-manual" data-index="${index}">🗑️</button>
      </div>
    `;
    container.appendChild(li);
  });

  if (totalLabel) totalLabel.innerHTML = `Total: ${subtotal.toFixed(2)} €`;
}

// GUARDAR LISTA EN EL SERVIDOR (CORREGIDO)
async function guardarListaEnServidor() {
  const token = localStorage.getItem('user_token');
  if (!token) {
    alert('Inicia sesión en "Mi Perfil" para guardar la lista.');
    irA('perfil');
    return;
  }

  if (listaCompra.length === 0) {
    alert('La lista está vacía.');
    return;
  }

  const btnGuardar = document.getElementById('btn-guardar-lista');
  if (btnGuardar) {
    btnGuardar.disabled = true;
    btnGuardar.innerHTML = 'Guardando...';
  }

  const total = listaCompra.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

  try {
    const res = await fetch(`${API}/lists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        nombre: `Lista del ${new Date().toLocaleDateString()}`,
        items: listaCompra,
        total: total
      })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(errorData?.error || 'Error de respuesta del servidor');
    }
    toast('💾 ¡Lista guardada en tu cuenta!');
    
    // Si estamos en la vista de perfil, refrescar historial automáticamente
    if (document.getElementById('pagina-perfil').classList.contains('activa')) {
      cargarHistorialListas();
    }
  } catch (error) {
    console.error(error);
    alert(error.message || 'No se pudo guardar la lista en el servidor.');
  } finally {
    if (btnGuardar) {
      btnGuardar.disabled = false;
      btnGuardar.innerHTML = '💾 Guardar Lista';
    }
  }
}

// ELIMINAR LISTA DEL SERVIDOR (CORREGIDO)
async function eliminarListaServidor(id, filaElemento) {
  const token = localStorage.getItem('user_token');
  try {
    const res = await fetch(`${API}/lists/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('No se pudo eliminar');

    toast('🗑️ Lista eliminada');
    if (filaElemento) {
      filaElemento.style.opacity = '0';
      setTimeout(() => filaElemento.remove(), 300);
    } else {
      cargarHistorialListas();
    }
  } catch (err) {
    console.error(err);
    alert('Error al intentar eliminar la lista del servidor.');
  }
}

// ============================================================
// ⚙️ SECCIÓN 3: AUTENTICACIÓN E HISTORIAL DE PERFIL
// ============================================================
async function cargarHistorialListas() {
  const container = document.getElementById('historial-listas-container');
  const token = localStorage.getItem('user_token');
  if (!container || !token) return;

  try {
    const res = await fetch(`${API}/lists`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const datos = await res.json();

    if (!res.ok || !datos.listas || datos.listas.length === 0) {
      container.innerHTML = `<div class="empty-state">No tienes listas en el historial.</div>`;
      return;
    }

    container.innerHTML = '';
    datos.listas.forEach(l => {
      const fecha = new Date(l.createdAt).toLocaleDateString();
      const card = document.createElement('div');
      card.className = 'lista-item historial-card-row';
      card.style.margin = '0 0 14px 0';
      card.innerHTML = `
        <div>
          <h4 style="margin:0; font-weight:600;">${l.nombre}</h4>
          <span style="font-size:0.8rem; color:var(--muted);">📅 ${fecha}</span>
        </div>
        <div style="display:flex; align-items:center; gap:16px;">
          <span style="font-weight:600; color:var(--accent);">${l.total.toFixed(2)} €</span>
          <button class="btn-primary btn-historial-cargar" data-items='${JSON.stringify(l.items)}' style="padding:6px 12px; font-size:0.8rem;">Cargar</button>
          <button class="btn-ghost-red btn-historial-eliminar" data-id="${l.id}">🗑️</button>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    container.innerHTML = `<div class="empty-state">Error al cargar historial.</div>`;
  }
}

function verificarEstadoUsuario() {
  const token = localStorage.getItem('user_token');
  const email = localStorage.getItem('user_email');
  const anonSection = document.getElementById('perfil-anonimo');
  const loggedSection = document.getElementById('perfil-conectado');

  if (token && email) {
    if (anonSection) anonSection.style.display = 'none';
    if (loggedSection) loggedSection.style.display = 'block';
    const emailLabel = document.getElementById('perfil-user-email');
    if (emailLabel) emailLabel.innerHTML = `Conectado como: <strong>${email}</strong>`;
    cargarHistorialListas();
  } else {
    if (anonSection) anonSection.style.display = 'block';
    if (loggedSection) loggedSection.style.display = 'none';
  }
}

// ============================================================
// ⚡ SECCIÓN 4: ASIGNADOR GLOBAL DE EVENTOS (DELEGACIÓN DE CLICKS)
// ============================================================
document.addEventListener('click', function(e) {
  // 1. Detectar botón Añadir en la tabla del Comparador
  if (e.target && e.target.classList.contains('btn-accion-añadir')) {
    const idx = parseInt(e.target.getAttribute('data-index'));
    ejecutarAñadir(idx, e.target);
  }

  // 2. Detectar botón Añadir oferta
  if (e.target && e.target.classList.contains('btn-add-offer')) {
    const id = e.target.getAttribute('data-id');
    agregarOfertaALista(id, e.target);
  }

  // 3. Detectar Guardar Lista en Servidor
  if (e.target && e.target.id === 'btn-guardar-lista') {
    guardarListaEnServidor();
  }

  // 4. Detectar botón Eliminar Lista del Historial (Servidor)
  if (e.target && e.target.classList.contains('btn-historial-eliminar')) {
    const id = e.target.getAttribute('data-id');
    const fila = e.target.closest('.historial-card-row');
    if (confirm('¿Eliminar esta lista permanentemente del servidor?')) {
      eliminarListaServidor(id, fila);
    }
  }

  // 4. Detectar Cargar lista del historial en el Carrito local
  if (e.target && e.target.classList.contains('btn-historial-cargar')) {
    const itemsRaw = e.target.getAttribute('data-items');
    if (confirm('¿Cargar estos elementos en el carrito sustituyendo los actuales?')) {
      listaCompra = JSON.parse(itemsRaw);
      actualizarVistaLista();
      localStorage.setItem('lista_compra', JSON.stringify(listaCompra));
      irA('lista');
    }
  }

  // 5. Controles rápidos del carrito (Aumentar, reducir, borrar manual)
  if (e.target && e.target.classList.contains('btn-qty-mas')) {
    const idx = parseInt(e.target.getAttribute('data-index'));
    listaCompra[idx].cantidad++;
    actualizarVistaLista();
    localStorage.setItem('lista_compra', JSON.stringify(listaCompra));
  }
  if (e.target && e.target.classList.contains('btn-qty-menos')) {
    const idx = parseInt(e.target.getAttribute('data-index'));
    listaCompra[idx].cantidad--;
    if (listaCompra[idx].cantidad <= 0) listaCompra.splice(idx, 1);
    actualizarVistaLista();
    localStorage.setItem('lista_compra', JSON.stringify(listaCompra));
  }
  if (e.target && e.target.classList.contains('btn-delete') && e.target.hasAttribute('data-index')) {
    const idx = parseInt(e.target.getAttribute('data-index'));
    listaCompra.splice(idx, 1);
    actualizarVistaLista();
    localStorage.setItem('lista_compra', JSON.stringify(listaCompra));
  }
});

// Cambios de checkboxes en el carrito
document.addEventListener('change', function(e) {
  if (e.target && e.target.classList.contains('check-comprado')) {
    const idx = parseInt(e.target.getAttribute('data-index'));
    listaCompra[idx].comprado = e.target.checked;
    actualizarVistaLista();
    localStorage.setItem('lista_compra', JSON.stringify(listaCompra));
  }
});

// Carga Inicial de la APP al abrir la pestaña
document.addEventListener('DOMContentLoaded', () => {
  actualizarVistaLista();
  verificarEstadoUsuario();
  buscar();
});

// Vinculación segura de navegación global
window.irA = irA;
window.buscar = buscar;