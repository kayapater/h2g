import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, Plus, 
  ArrowRight
} from 'lucide-react';

const Home = () => {
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();

  const createRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 9);
    navigate(`/room/${newRoomId}`);
  };

  const joinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim()) {
      navigate(`/room/${roomId.trim()}`);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-[#020617] px-6 py-12 text-white font-sans">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-6xl w-full flex flex-col items-center gap-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            GERÇEK ZAMANLI SENKRONİZASYON AKTİF
          </div>
          
          <h1 className="text-7xl md:text-8xl font-black tracking-tighter text-white leading-tight uppercase italic">
            H2G
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 leading-relaxed text-center font-medium">
            Dünyanın her yerinden arkadaşlarınızla aynı anda video izleyin. 
            Sıfır gecikme, yüksek kalite ve anlık sohbet deneyimini yaşayın.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          <motion.div
            whileHover={{ y: -5 }}
            className="col-span-1 lg:col-span-2 group relative p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] overflow-hidden"
          >
            <div className="relative z-10 flex flex-col h-full justify-between gap-12 text-left text-white">
              <div className="flex justify-between items-start">
                <div className="p-4 bg-blue-600/20 text-blue-400 rounded-2xl">
                  <Plus size={32} />
                </div>
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-bold tracking-tight">Sinema Başlat</h2>
                <p className="text-slate-400 max-w-sm">Yeni bir özel oda oluşturun ve arkadaşlarınızı saniyeler içinde birlikte izlemeye davet edin.</p>
                <button
                  onClick={createRoom}
                  className="mt-4 flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-lg transition-all active:scale-95 text-white"
                >
                  Oda Oluştur <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="col-span-1 group relative p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] overflow-hidden"
          >
            <div className="relative z-10 flex flex-col h-full justify-between gap-12 text-left text-white">
              <div className="p-4 bg-purple-600/20 text-purple-400 rounded-2xl self-start">
                <Users size={32} />
              </div>
              <div className="space-y-4 text-left">
                <h2 className="text-3xl font-bold tracking-tight">Partiye Katıl</h2>
                <form onSubmit={joinRoom} className="space-y-3">
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    placeholder="Oda kodunu girin..."
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-white"
                  />
                  <button
                    type="submit"
                    className="w-full px-8 py-4 bg-purple-600 hover:bg-purple-500 rounded-2xl font-black text-white active:scale-95"
                  >
                    Odaya Gir
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Home;
