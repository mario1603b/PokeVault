import React, { useState, useEffect, useMemo } from 'react';
import { Search, Gamepad2, Calendar, Info, Filter, X, Loader2, Play, BookOpen, Clock } from 'lucide-react';
import { collection, getDocs } from "firebase/firestore";
import { db } from '../lib/firebase';

export default function App() {
  const [pokemonGames, setPokemonGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState(null); // Juego para la ficha técnica
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConsole, setSelectedConsole] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');

  useEffect(() => {
    async function fetchGames() {
      try {
        const querySnapshot = await getDocs(collection(db, "games"));
        const gamesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        gamesData.sort((a, b) => b.releaseYear - a.releaseYear);
        setPokemonGames(gamesData);
      } catch (error) { console.error(error); } finally { setLoading(false); }
    }
    fetchGames();
  }, []);

  const allConsoles = [...new Set(pokemonGames.map(g => g.console))].sort();
  const allBranches = [...new Set(pokemonGames.map(g => g.branch))].sort();

  const filteredGames = useMemo(() => {
    return pokemonGames.filter(game => {
      const matchesSearch = game.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesConsole = !selectedConsole || game.console === selectedConsole;
      const matchesBranch = !selectedBranch || game.branch === selectedBranch;
      return matchesSearch && matchesConsole && matchesBranch;
    });
  }, [pokemonGames, searchTerm, selectedConsole, selectedBranch]);

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-100 italic">
      <Loader2 className="w-12 h-12 text-red-500 animate-spin mb-4" />
      <p>Accediendo al PC de Bill...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-20">
      {/* Header reducido para dar foco a los juegos */}
      <header className="py-12 px-6 max-w-7xl mx-auto border-b border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent uppercase tracking-tighter">
              PokeVault DB
            </h1>
            <p className="text-slate-500 text-sm">Archivo histórico de la comunidad</p>
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <input 
              type="text" placeholder="Buscar título..." 
              className="bg-slate-800 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none w-full md:w-64"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select onChange={(e) => setSelectedBranch(e.target.value)} className="bg-slate-800 rounded-xl px-4 py-2 text-sm outline-none">
              <option value="">Ramas</option>
              {allBranches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <select onChange={(e) => setSelectedConsole(e.target.value)} className="bg-slate-800 rounded-xl px-4 py-2 text-sm outline-none">
              <option value="">Consolas</option>
              {allConsoles.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </header>

      {/* Grid de Carátulas Limpias */}
      <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
        {filteredGames.map((game) => (
          <div 
            key={game.id} 
            onClick={() => setSelectedGame(game)}
            className="group cursor-pointer"
          >
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 group-hover:scale-105 group-hover:ring-4 group-hover:ring-red-500/50">
              <img src={game.coverUrl} className="w-full h-full object-cover" alt={game.title} />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-[10px] font-bold uppercase text-red-400 mb-1">{game.console}</p>
                <h3 className="font-bold text-sm leading-tight line-clamp-2">{game.title}</h3>
              </div>
              <div className="absolute top-3 right-3 bg-black/60 backdrop-blur px-2 py-1 rounded-md text-[10px] font-bold">
                {game.releaseYear}
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* MODAL: FICHA TÉCNICA (Se abre al clicar) */}
      {selectedGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => setSelectedGame(null)} />
          
          <div className="relative bg-slate-900 border border-slate-700 w-full max-w-5xl max-h-full overflow-y-auto rounded-3xl shadow-2xl flex flex-col md:flex-row">
            {/* Cerrar */}
            <button 
              onClick={() => setSelectedGame(null)}
              className="absolute top-6 right-6 z-10 p-2 bg-slate-800 rounded-full hover:bg-red-500 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Lado Izquierdo: Visual */}
            <div className="md:w-1/3 bg-slate-800 p-8 flex flex-col items-center border-r border-slate-700">
              <img src={selectedGame.coverUrl} className="w-full rounded-2xl shadow-2xl mb-6" alt="" />
              <div className="w-full space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-5 h-5 text-red-500" />
                  <span>Lanzamiento: <strong>{selectedGame.releaseYear}</strong></span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Gamepad2 className="w-5 h-5 text-red-500" />
                  <span>Plataforma: <strong>{selectedGame.console}</strong></span>
                </div>
              </div>
            </div>

            {/* Lado Derecho: Info y Contenido */}
            <div className="md:w-2/3 p-8 md:p-12">
              <span className="text-red-500 font-bold tracking-widest text-xs uppercase">{selectedGame.branch}</span>
              <h2 className="text-4xl font-black mb-6 tracking-tighter">{selectedGame.title}</h2>
              
              <div className="space-y-8">
                {/* Sinopsis */}
                <section>
                  <div className="flex items-center gap-2 mb-3 text-slate-400 uppercase text-xs font-bold tracking-widest">
                    <BookOpen className="w-4 h-4" /> Sinopsis
                  </div>
                  <p className="text-slate-300 leading-relaxed text-lg">
                    {selectedGame.synopsis}
                  </p>
                </section>

                {/* Dato Curioso */}
                <section className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl relative overflow-hidden">
                  <Info className="absolute -right-4 -top-4 w-24 h-24 text-red-500/10" />
                  <h4 className="text-red-400 font-bold text-sm mb-2 flex items-center gap-2 uppercase">
                    <Clock className="w-4 h-4" /> ¿Sabías que?
                  </h4>
                  <p className="italic text-slate-200 relative z-10">
                    "{selectedGame.funFact}"
                  </p>
                </section>
                
                {/* Nota: Aquí podrías añadir el iframe del tráiler si tienes el ID en la DB */}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}