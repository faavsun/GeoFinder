// Coordenadas iniciales (ejemplo: Concepción, Chile)
const inicialLat = -36.82;
const inicialLon = -73.05;

// Inicializa el mapa centrado en la ubicación inicial
const map = L.map('map').setView([inicialLat, inicialLon], 13);

// Agrega capa base de OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Íconos personalizados según tipo de marcador
const icons = {
  tecnico: L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/4712/4712102.png',
    iconSize: [32, 32],
  }),
  casa: L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/69/69524.png',
    iconSize: [28, 28],
  }),
  local: L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/149/149060.png',
    iconSize: [28, 28],
  }),
};

// Carga y dibuja marcadores de tipo indicado desde archivo JSON
async function cargarMarcadores(tipo, archivo) {
  const response = await fetch(`data/${archivo}`);
  const datos = await response.json();

  datos.forEach(item => {
    const icono = icons[tipo] || null;
    L.marker([item.lat, item.lon], { icon: icono })
      .addTo(map)
      .bindPopup(`<strong>${item.nombre}</strong><br>Tipo: ${tipo}`);
  });
}

// Cargar marcadores de técnicos, casas y locales
cargarMarcadores("tecnico", "tecnicos.json");
cargarMarcadores("casa", "casas.json");
cargarMarcadores("local", "locales.json");

// Array global para almacenar técnicos y filtrar después
let tecnicosGlobal = [];

// Escucha el cambio en el selector de tipo de servicio y aplica filtro
document.getElementById("filtro-servicio").addEventListener("change", (e) => {
  const filtro = e.target.value;
  renderizarTecnicosFiltrados(filtro);
});

// Renderiza lista de técnicos según filtro por especialidad
function renderizarTecnicosFiltrados(filtro) {
  const lista = document.getElementById("lista-tecnicos");
  const total = document.getElementById("total-tecnicos");
  lista.innerHTML = "";

  const tecnicosFiltrados = tecnicosGlobal.filter((t) => {
    if (filtro === "todos") return true;
    return t.especialidad.toLowerCase() === filtro.toLowerCase();
  });

  tecnicosFiltrados.forEach((t) => {
    const li = document.createElement("li");
    li.classList.add("tecnico-item");
    li.dataset.nombre = t.nombre;

    li.innerHTML = `
      <strong>${t.nombre}</strong><br/>
      <div class="info">
        ${obtenerIconoEspecialidad(t.especialidad)} ${t.especialidad} – ETA: ?
      </div>
      <div class="estado ${t.estado === "disponible" ? "disponible" : "ocupado"}">
        ${t.estado === "disponible" ? "Disponible" : "Ocupado"}
      </div>
    `;

    lista.appendChild(li);
  });

  total.textContent = `(${tecnicosFiltrados.length})`;
}

// Carga los técnicos al iniciar y muestra todos
async function cargarTecnicosPanel() {
  const res = await fetch("data/tecnicos.json");
  const data = await res.json();
  tecnicosGlobal = data;

  // Renderiza todos los técnicos por defecto
  renderizarTecnicosFiltrados("todos");
}

cargarTecnicosPanel();

// Detecta ubicación del usuario con geolocalización del navegador
function mostrarUbicacionUsuario() {
  if (!navigator.geolocation) {
    alert("La geolocalización no es compatible con este navegador.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      // Agrega marcador de usuario en el mapa
      const marker = L.marker([lat, lon], {
        title: "Tu ubicación",
        icon: L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/4879/4879375.png",
        iconSize: [28, 28],
      }),
      }).addTo(map);

      marker.bindPopup("📍 Tú estás aquí").openPopup();

      // Centra el mapa en la ubicación del usuario
      map.setView([lat, lon], 14);

      // Guarda posición global para cálculos posteriores
      usuarioPosicion = { lat, lon };
    },
    (err) => {
      alert("No se pudo obtener tu ubicación.");
      console.error(err);
    }
  );
}

// Variable global para guardar coordenadas del usuario
let usuarioPosicion = null;

// Llama la función al cargar
mostrarUbicacionUsuario();

// Calcula distancia entre dos coordenadas (km) con fórmula de Haversine
function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Al hacer clic en "Asignar técnico cercano", encuentra el más próximo
document.getElementById("asignar-cercano").addEventListener("click", () => {
  if (!usuarioPosicion) {
    alert("Primero se debe obtener tu ubicación.");
    return;
  }

  let tecnicoMasCercano = null;
  let distanciaMinima = Infinity;

  // Buscar técnico disponible más cercano
  tecnicosGlobal.forEach((t) => {
    if (t.estado !== "disponible") return;

    const distancia = calcularDistanciaKm(
      usuarioPosicion.lat,
      usuarioPosicion.lon,
      t.lat,
      t.lon
    );

    t.distancia = distancia;
    if (distancia < distanciaMinima) {
      distanciaMinima = distancia;
      tecnicoMasCercano = t;
    }
  });

  if (tecnicoMasCercano) {
    const tiempoEstimado = Math.ceil(distanciaMinima / 0.5); // Suponiendo 30 km/h

    alert(
      `Técnico más cercano: ${tecnicoMasCercano.nombre}\nDistancia: ${distanciaMinima.toFixed(
        2
      )} km\nETA: ${tiempoEstimado} min`
    );

    // Quitar selección previa
    document.querySelectorAll(".tecnico-item").forEach(el => {
      el.classList.remove("asignado");
    });

    // Resaltar al técnico asignado
    const lista = document.querySelectorAll("#lista-tecnicos .tecnico-item");
    lista.forEach(el => {
      if (el.dataset.nombre === tecnicoMasCercano.nombre) {
        el.classList.add("asignado");
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });

    // Centrar mapa en técnico
    map.setView([tecnicoMasCercano.lat, tecnicoMasCercano.lon], 15);

    // Mostrar popup con nombre y ETA
    L.popup()
      .setLatLng([tecnicoMasCercano.lat, tecnicoMasCercano.lon])
      .setContent(`🧑‍🔧 ${tecnicoMasCercano.nombre}<br>ETA: ${tiempoEstimado} min`)
      .openOn(map);
  } else {
    alert("No hay técnicos disponibles actualmente.");
  }
});

function obtenerIconoEspecialidad(especialidad) {
  const tipo = especialidad.toLowerCase();
  if (tipo.includes("instalacion")) return "🔌";
  if (tipo.includes("soporte")) return "🛠️";
  if (tipo.includes("levantamiento")) return "📡";
  return "👤";
}