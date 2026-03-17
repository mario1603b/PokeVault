import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

// --- 1. CONFIGURACIÓN FIREBASE (Pon tus datos) ---
const firebaseConfig = {
  apiKey: "AIzaSyACEM1AzlJBLBb9W4F4FqtpSyUZu51UMLg",
  authDomain: "pokedex-juegos.firebaseapp.com",
  projectId: "pokedex-juegos",
  storageBucket: "pokedex-juegos.firebasestorage.app",
  messagingSenderId: "456022624146",
  appId: "1:456022624146:web:02684c7ff2bb10fed7634b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- 2. CREDENCIALES IGDB / TWITCH (Pon tus datos) ---
const TWITCH_CLIENT_ID = 'xi8b7l7speozy24o68nzqj7bkmu41o';
const TWITCH_CLIENT_SECRET = '8x0lvaarxukrrkx07iiqsu65esynle';

// --- 3. LÓGICA DE CATEGORIZACIÓN ---
function determineBranch(title) {
  const t = title.toLowerCase();
  if (t.includes("mystery dungeon") || t.includes("mundo misterioso")) return "Mundo Misterioso";
  if (t.includes("ranger")) return "Ranger";
  if (t.includes("stadium") || t.includes("colosseum") || t.includes("xd")) return "Stadium / Colosseum";
  if (t.includes("rumble")) return "Rumble";
  if (t.includes("pinball")) return "Pinball";
  if (t.includes("snap")) return "Fotografía";
  if (t.includes("go") || t.includes("sleep") || t.includes("masters") || t.includes("cafe") || t.includes("smile") || t.includes("magikarp")) return "Móvil";
  if (t.includes("legends") || t.includes("leyendas")) return "Leyendas";
  if (t.includes("let's go")) return "Remakes Mainline";
  if (t.includes("dash") || t.includes("trozei") || t.includes("picross") || t.includes("puzzle") || t.includes("tcg") || t.includes("trading") || t.includes("art academy") || t.includes("pokkén") || t.includes("unite") || t.includes("quest")) return "Spin-off / Otros";
  return "Rama Principal";
}

function assignColor(branch) {
  const colors = {
    "Rama Principal": "bg-red-500",
    "Mundo Misterioso": "bg-orange-500",
    "Ranger": "bg-yellow-500",
    "Stadium / Colosseum": "bg-purple-500",
    "Móvil": "bg-teal-500",
    "Leyendas": "bg-indigo-500"
  };
  return colors[branch] || "bg-blue-500";
}

// --- 4. OBTENER TOKEN DE TWITCH ---
async function getTwitchToken() {
  const response = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_CLIENT_SECRET}&grant_type=client_credentials`, { method: 'POST' });
  const data = await response.json();
  return data.access_token;
}

// --- 5. DESCARGAR Y FILTRAR JUEGOS ---

async function fetchAndUploadGames() {
  try {
    console.log("🔑 Obteniendo token de IGDB...");
    const token = await getTwitchToken();

    console.log("📡 Descargando catálogo de Pokémon (modo bruto)...");
    
    // Le pedimos hasta 500 resultados de "Pokemon" sin ponerle filtros raros a la API
    const query = `
      search "Pokemon";
      fields name, first_release_date, summary, cover.image_id, platforms.name, category;
      limit 500;
    `;

    const igdbResponse = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      body: query
    });

    const gamesData = await igdbResponse.json();

    if (gamesData.length > 0 && gamesData[0].status) {
      console.error("❌ Error de la API de IGDB:", gamesData);
      return;
    }

    console.log(`📦 IGDB nos ha devuelto ${gamesData.length} resultados. Aplicando filtro de pureza...`);
    
    const forbiddenWords = [
      "reborn", "outlaw", "uranium", "insurgence", "purered", "steam", "waves", 
      "radical", "fusion", "mmo", "glazed", "light platinum", "prism", "snakewood", 
      "ash gray", "dark rising", "sage", "clockwork", "rejuvenation", "desolation", 
      "zeta", "omicron", "mythic", "infinity", "xenoverse", "unbound", "creepy",
      "pokerole", "showdown", "generator", "builder", "randomizer"
    ];

    // 0=Juego Base, 8=Remake, 9=Remaster, 11=Port. Descartamos Mods(5), DLCs(1), etc.
    const allowedCategories = [0, 8, 9, 11];

    const gamesCollection = collection(db, "games");
    let count = 0;
    let descartados = 0;

    for (const game of gamesData) {
      // Filtro 1: Debe tener fecha
      if (!game.first_release_date) {
        descartados++;
        continue; 
      }

      // Filtro 2: Debe ser un juego oficial, no un Mod ni un DLC
      if (game.category !== undefined && !allowedCategories.includes(game.category)) {
        descartados++;
        continue;
      }

      const lowerTitle = game.name.toLowerCase();
      
      // Filtro 3: No debe estar en nuestra lista negra de Hack Roms
      const isHackRom = forbiddenWords.some(word => lowerTitle.includes(word));
      if (isHackRom) {
        descartados++;
        continue;
      }

      const releaseYear = new Date(game.first_release_date * 1000).getFullYear();
      const coverUrl = game.cover?.image_id 
        ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg` 
        : "https://placehold.co/400x600/1e293b/ffffff?text=Sin+Carátula";
      
      const branch = determineBranch(game.name);
      const consoleName = game.platforms && game.platforms.length > 0 ? game.platforms[0].name : "Desconocida";

      const newGame = {
        title: game.name,
        branch: branch,
        releaseYear: releaseYear,
        console: consoleName,
        synopsis: game.summary || "Sin sinopsis disponible para este título.",
        coverUrl: coverUrl,
        funFact: "Añade un dato curioso para este juego desde Firebase.",
        color: assignColor(branch)
      };

      await addDoc(gamesCollection, newGame);
      count++;
      console.log(`✅ Aprobado y subido: ${newGame.title}`);
    }
    
    console.log(`🧹 Hemos descartado ${descartados} juegos basura (DLCs, Mods y Hack Roms).`);
    console.log(`🎉 ¡Éxito! ${count} juegos OFICIALES guardados en Firestore.`);
    
  } catch (error) {
    console.error("❌ Ocurrió un error general:", error);
  }
}

fetchAndUploadGames();