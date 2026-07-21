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

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full"
        >
          <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] overflow-hidden p-8 md:p-10 lg:p-12">
            <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-blue-600/8 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[30%] h-full bg-gradient-to-r from-purple-600/8 to-transparent pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10 lg:gap-14">
              {/* Sol: Metin */}
              <div className="flex-1 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-500/15 to-purple-500/15 border border-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-widest">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  ÇOK YAKINDA
                </div>

                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                  <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-purple-400 bg-clip-text text-transparent">Tarayıcı Eklentisi</span><br/>
                  <span className="text-white">Geliyor</span>
                </h2>

                <p className="text-slate-400 text-base md:text-lg leading-relaxed max-w-xl">
                  H2G artık doğrudan tarayıcınızda. Sevdiğiniz platformlarda{' '}
                  <span className="text-white font-semibold">sayfa üstünde</span>{' '}
                  arkadaşlarınızla eşzamanlı izleyin, sohbet edin, sıra oluşturun.
                </p>

                <div className="flex flex-wrap items-center gap-3 justify-center lg:justify-start">
                  <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white transition-all">
                    <img src="/youtube.webp" alt="YouTube" className="h-4 w-auto" />
                    YouTube
                  </span>
                  <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white transition-all">
                    <img src="/netflix.webp" alt="Netflix" className="h-4 w-auto" />
                    Netflix
                  </span>
                  <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white transition-all">
                    <img src="/prime-video.webp" alt="Prime Video" className="h-4 w-auto" />
                    Prime Video
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-2">
                  <button className="flex items-center justify-center gap-2.5 px-7 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-2xl font-black text-base transition-all active:scale-95 shadow-lg shadow-blue-600/20">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 4L12 13 2 4"/></svg>
                    Beni Bilgilendir
                  </button>
                </div>
              </div>

              {/* Sağ: Preview Mockup */}
              <div className="flex-shrink-0 w-full lg:w-[360px]">
                <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60">
                  <div className="bg-[#1a1a2e] px-4 py-2.5 flex items-center gap-2 border-b border-white/5">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/60" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                      <div className="w-3 h-3 rounded-full bg-green-500/60" />
                    </div>
                    <div className="flex-1 mx-3 bg-white/5 rounded-lg px-3 py-1 text-[10px] text-slate-500 truncate">youtube.com/watch?v=...</div>
                    <div className="w-5 h-5 rounded-md bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-[9px] font-black text-white">H</div>
                  </div>
                  <div className="bg-[#0f0f0f] h-[220px] flex">
                    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-[#1a1a2e] to-[#0f0f0f]">
                      <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
                        <div className="w-0 h-0 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent border-l-[20px] border-l-white/70 ml-0.5" />
                      </div>
                    </div>
                    <div className="w-[140px] bg-[#020617] border-l border-white/5 p-2.5 flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-500 to-purple-500" />
                        <span className="text-[9px] font-black uppercase italic">H2G</span>
                      </div>
                      <div className="flex gap-1">
                        <div className="flex-1 h-4 rounded bg-blue-600/30 flex items-center justify-center text-[7px] font-bold text-blue-300">SOHBET</div>
                        <div className="flex-1 h-4 rounded bg-white/5 flex items-center justify-center text-[7px] font-bold text-slate-500">SIRA</div>
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <div className="flex gap-1"><div className="w-3 h-3 rounded bg-blue-500/30 flex-shrink-0" /><div><div className="h-1 w-8 bg-white/10 rounded" /><div className="h-3 w-14 bg-blue-600/20 rounded mt-0.5" /></div></div>
                        <div className="flex gap-1 flex-row-reverse"><div className="w-3 h-3 rounded bg-purple-500/30 flex-shrink-0" /><div><div className="h-1 w-8 bg-white/10 rounded ml-auto" /><div className="h-3 w-16 bg-white/5 rounded mt-0.5 border border-white/5" /></div></div>
                      </div>
                      <div className="h-5 rounded bg-white/5 border border-white/5 flex items-center px-1.5 gap-1">
                        <div className="h-1 w-10 bg-white/10 rounded" /><div className="ml-auto h-3 w-6 rounded bg-blue-600/60" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
