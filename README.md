## 📁 Estrutura do projeto

```
API_GOOGLE_MAPS/
├─ index.html
├─ css/
│  └─ style.css
└─ js/
   └─ map.js
```

---

## ✅ index.html

> Troque `SUA_API_KEY_AQUI` pela sua chave.

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Google Maps API - RickDev</title>

    <link rel="stylesheet" href="./css/style.css" />
  </head>

  <body>
    <header class="header">
      <h1>Google Maps API</h1>
      <p>Integração simples do Google Maps no seu site — by RickDev</p>
    </header>

    <main class="container">
      <section class="card">
        <h2>Mapa</h2>
        <div id="map" class="map"></div>
      </section>
    </main>

    <!-- Seu script do mapa -->
    <script src="./js/map.js"></script>

    <!-- Google Maps (JS API) -->
    <script
      src="https://maps.googleapis.com/maps/api/js?key=SUA_API_KEY_AQUI&callback=initMap"
      defer
    ></script>
  </body>
</html>
```

---

## ✅ css/style.css

```css
:root {
  --bg: #0b0f14;
  --card: #101826;
  --text: #e6edf3;
  --muted: #98a2b3;
  --border: rgba(255, 255, 255, 0.08);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
}

body {
  background: radial-gradient(1200px 600px at 20% 10%, #132033, transparent),
    radial-gradient(1200px 600px at 80% 20%, #1a2a44, transparent),
    var(--bg);
  color: var(--text);
  min-height: 100vh;
}

.header {
  padding: 28px 16px 10px;
  text-align: center;
}

.header h1 {
  font-size: 26px;
  letter-spacing: 0.5px;
}

.header p {
  margin-top: 6px;
  color: var(--muted);
}

.container {
  width: min(980px, 92%);
  margin: 18px auto 40px;
}

.card {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.06), transparent),
    var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
}

.card h2 {
  font-size: 16px;
  margin-bottom: 10px;
  color: var(--muted);
  font-weight: 600;
}

.map {
  width: 100%;
  height: 520px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--border);
}
```

---

## ✅ js/map.js

* `initMap()` fica global (porque o Google chama via `callback`)
* Múltiplos markers
* InfoWindow ao clicar
* Pan/Zoom após 4s (igual seu efeito)

```javascript
// GOOGLE MAPS API - ADD AO SEU SITE
// BY: RICKDEV

let map;

/**
 * O Google chama automaticamente esta função por causa do:
 * &callback=initMap
 * no script do Google Maps no index.html
 */
function initMap() {
  // Configurações do mapa
  const mapOptions = {
    center: { lat: -22.932924, lng: -47.073845 },
    zoom: 16,
    scrollwheel: false,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    // Você pode habilitar/desabilitar controles se quiser:
    // disableDefaultUI: false,
    // zoomControl: true,
  };

  map = new google.maps.Map(document.getElementById("map"), mapOptions);

  // Conteúdo do InfoWindow (pode ser HTML)
  const contentHTML =
    '<p style="color:#ff3b3b;font-size:12px;font-weight:bold;margin:0;">RicardoDev - FullStack</p>';

  // Ícone custom (opcional) - pode ser URL de um PNG/SVG
  const iconUrl = ""; // exemplo: "./assets/pin.png" ou "https://.../pin.png"

  // Lista de marcadores (você pode adicionar quantos quiser)
  const markers = [
    {
      lat: -22.9353802,
      lng: -47.092462,
      icon: iconUrl,
      content: contentHTML,
    },
    // Exemplo de outro ponto:
    // {
    //   lat: -22.9335,
    //   lng: -47.0801,
    //   icon: iconUrl,
    //   content: "<b>Outro local</b>",
    // },
  ];

  // Adiciona todos os markers
  const createdMarkers = markers.map(addMarker);

  // Efeito: mover para o primeiro marker e dar zoom após 4s
  if (createdMarkers.length) {
    const target = markers[0];
    setTimeout(() => {
      map.panTo({ lat: target.lat, lng: target.lng });
      map.setZoom(20);
    }, 4000);
  }
}

/**
 * Adiciona marcador no mapa
 */
function addMarker({ lat, lng, icon = "", content = "" }) {
  const marker = new google.maps.Marker({
    position: { lat, lng },
    map,
    icon,
  });

  // Se tiver conteúdo, cria InfoWindow e abre ao clicar
  if (content) {
    const infoWindow = new google.maps.InfoWindow({
      content,
      maxWidth: 220,
      pixelOffset: new google.maps.Size(0, 20),
    });

    marker.addListener("click", () => {
      infoWindow.open(map, marker);
    });
  }

  return marker;
}
```



## 📸 Preview

![api_google_maps](https://user-images.githubusercontent.com/107133668/174952712-0995ddc4-f2f0-4bba-8e23-b6db8d439b14.png)

---

## ✅ Requisitos

Antes de rodar você precisa:

1. Conta no **Google Cloud**
2. Ativar a **Maps JavaScript API**
3. Criar uma **API Key**
4. (Recomendado) Restringir a chave por domínio (HTTP referrers)

---

## 🔑 Onde colocar a API KEY

No arquivo `index.html`, troque:

```html
key=SUA_API_KEY_AQUI
```

Exemplo:

```html
<script
  src="https://maps.googleapis.com/maps/api/js?key=SUA_API_KEY_AQUI&callback=initMap"
  defer
></script>
```

---

## 🚀 Como usar

1. Clone o repositório:

```bash
git clone https://github.com/seu-usuario/seu-repo.git
```

2. Abra a pasta no VS Code

3. Rode com Live Server (recomendado) ou abra o `index.html`

---

## 📍 Adicionar / editar marcadores

No arquivo `js/map.js` você encontra o array:

```js
const markers = [
  {
    lat: -22.9353802,
    lng: -47.092462,
    icon: "",
    content: "<b>Meu local</b>",
  },
];
```

Você pode adicionar vários pontos, um em cada objeto.

---

## 🔒 Segurança da API Key (IMPORTANTE)

✅ Sempre restrinja sua chave por domínio:

* Google Cloud Console → APIs & Services → Credentials → API Key → Application restrictions

Evite usar chave sem restrição em produção.

---

## 👨‍💻 Autor

**RickDev**

```

