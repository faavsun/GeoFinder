// Coordenadas de ejemplo (Concepción, Chile)
const inicialLat = -36.82;
const inicialLon = -73.05;

// Inicializa el mapa
const map = L.map('map').setView([inicialLat, inicialLon], 13);

// Carga capa base de OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Íconos personalizados
const icons = {
  tecnico: L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1037/1037762.png',
    iconSize: [32, 32],
  }),
  casa: L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/69/69524.png',
    iconSize: [28, 28],
  }),
  local: L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/535/535239.png',
    iconSize: [28, 28],
  }),
};

// Función para cargar y mostrar marcadores
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

// Cargar los tres tipos de datos
cargarMarcadores("tecnico", "tecnicos.json");
cargarMarcadores("casa", "casas.json");
cargarMarcadores("local", "locales.json");

let tecnicosGlobal = []; // Para filtrado posterior

async function cargarTecnicosPanel() {
  const res = await fetch("data/tecnicos.json");
  const data = await res.json();
  tecnicosGlobal = data;

  const lista = document.getElementById("lista-tecnicos");
  const total = document.getElementById("total-tecnicos");
  lista.innerHTML = "";

  data.forEach((t) => {
    const li = document.createElement("li");
    li.classList.add("tecnico-item");
    li.dataset.nombre = t.nombre;

    li.innerHTML = `
      <strong>${t.nombre}</strong><br/>
      <div class="info">${t.especialidad} – ETA: ?</div>
      <div class="estado">${t.estado === "disponible" ? "✅ Disponible" : "⛔ Ocupado"}</div>
    `;

    lista.appendChild(li);
  });

  total.textContent = `(${data.length})`;
}

cargarTecnicosPanel();


function mostrarUbicacionUsuario() {
  if (!navigator.geolocation) {
    alert("La geolocalización no es compatible con este navegador.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      // Marcador personalizado (puedes reemplazar el ícono si quieres)
      const marker = L.marker([lat, lon], {
        title: "Tu ubicación",
        icon: L.icon({
          iconUrl: "https://cdn-icons-png.flaticon.com/512/64/64113.png",
          iconSize: [30, 30],
        }),
      }).addTo(map);

      marker.bindPopup("📍 Tú estás aquí").openPopup();

      // Opcional: centrar mapa
      map.setView([lat, lon], 14);

      // Guardar coordenadas globales para cálculos
      usuarioPosicion = { lat, lon };
    },
    (err) => {
      alert("No se pudo obtener tu ubicación.");
      console.error(err);
    }
  );
}

let usuarioPosicion = null;

mostrarUbicacionUsuario();


function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

document.getElementById("asignar-cercano").addEventListener("click", () => {
  if (!usuarioPosicion) {
    alert("Primero se debe obtener tu ubicación.");
    return;
  }

  let tecnicoMasCercano = null;
  let distanciaMinima = Infinity;

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
    const tiempoEstimado = Math.ceil(distanciaMinima / 0.5); // Suponemos 30 km/h
    alert(
      `Técnico más cercano: ${tecnicoMasCercano.nombre}\nDistancia: ${distanciaMinima.toFixed(
        2
      )} km\nETA: ${tiempoEstimado} min`
    );
    // Quitar cualquier asignación previa
    document.querySelectorAll(".tecnico-item").forEach(el => {
      el.classList.remove("asignado");
    });

    // Marcar el técnico más cercano
    const lista = document.querySelectorAll("#lista-tecnicos .tecnico-item");
    lista.forEach(el => {
      if (el.dataset.nombre === tecnicoMasCercano.nombre) {
        el.classList.add("asignado");
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });


    // Reenfocar mapa
    map.setView([tecnicoMasCercano.lat, tecnicoMasCercano.lon], 15);

    // Mostrar popup en mapa
    L.popup()
      .setLatLng([tecnicoMasCercano.lat, tecnicoMasCercano.lon])
      .setContent(`🧑‍🔧 ${tecnicoMasCercano.nombre}<br>ETA: ${tiempoEstimado} min`)
      .openOn(map);
  } else {
    alert("No hay técnicos disponibles actualmente.");
  }
});
