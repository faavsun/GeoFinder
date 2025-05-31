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
