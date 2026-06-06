import React, { useEffect, useRef, useState } from 'react';
import ReactPlayerBase from 'react-player';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Plus, Play,
  Share2,
  Trash2, Crown,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { 
  ref, onValue, push, serverTimestamp, 
  update, onDisconnect, set, remove, get
} from 'firebase/database';
import { 
  signInAnonymously, onAuthStateChanged, 
  GoogleAuthProvider, signInWithPopup, updateProfile, type User 
} from 'firebase/auth';
import { db, auth } from '../firebase';
import { cn } from '../lib/utils';

// ESM fix for ReactPlayer
const ReactPlayer = (ReactPlayerBase as any).default || ReactPlayerBase;

const ANON_NICK_STORAGE_KEY = 'h2g-anon-nick';
const AUTH_NICK_STORAGE_KEY_PREFIX = 'h2g-auth-nick-';
const MIN_NICK_LENGTH = 3;

const generateRandomNick = () => {
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `Misafir-${suffix}`;
};

const getUserPhotoUrl = (user: User | null) => {
  if (!user) return '';
  if (user.photoURL) return user.photoURL;
  const providerPhoto = user.providerData.find((provider) => provider.photoURL)?.photoURL;
  return providerPhoto || '';
};

const getAuthNickStorageKey = (uid: string) => `${AUTH_NICK_STORAGE_KEY_PREFIX}${uid}`;

const normalizePhotoUrl = (url: string) => {
  if (url.startsWith('http://')) {
    return `https://${url.slice(7)}`;
  }
  return url;
};

const getPreferredPhotoUrl = (url: string) => {
  const normalized = normalizePhotoUrl(url);
  if (!normalized.includes('googleusercontent.com')) return normalized;
  if (/=s\d+-c/.test(normalized)) {
    return normalized.replace(/=s\d+-c/, '=s128-c');
  }
  if (normalized.includes('sz=')) {
    return normalized.replace(/sz=\d+/, 'sz=128');
  }
  const joiner = normalized.includes('?') ? '&' : '?';
  return `${normalized}${joiner}sz=128`;
};

const getRetriedPhotoUrl = (url: string) => {
  if (!url.includes('googleusercontent.com')) return '';
  if (/=s\d+-c/.test(url)) {
    return url.replace(/=s\d+-c/, '=s256-c');
  }
  if (url.includes('sz=')) {
    return url.replace(/sz=\d+/, 'sz=256');
  }
  const joiner = url.includes('?') ? '&' : '?';
  return `${url}${joiner}sz=256`;
};

const getYouTubeId = (url: string) => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace('www.', '');
    if (host === 'youtu.be') {
      return parsed.pathname.slice(1);
    }
    if (host.endsWith('youtube.com')) {
      const v = parsed.searchParams.get('v');
      if (v) return v;
      const match = parsed.pathname.match(/\/(shorts|embed)\/([^/?#]+)/);
      if (match) return match[2];
    }
  } catch {
    return null;
  }
  return null;
};

const getQueuePreviewUrl = (url: string) => {
  const id = getYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
};

interface RoomState {
  url: string;
  playing: boolean;
  playedSeconds: number;
  lastUpdated: number;
}

interface ChatMessage {
  id: string;
  text: string;
  userId: string;
  userName: string;
  photoURL?: string;
  timestamp: number;
}

interface QueueItem {
  id: string;
  url: string;
  addedBy: string;
  addedByName?: string;
  timestamp: number;
}

interface UserPresence {
  uid: string;
  name: string;
  photoURL: string | null;
  joinedAt: number;
  active: boolean;
}

const Room: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const playerRef = useRef<any>(null);
  const isFirstLoad = useRef(true);
  
  const [url, setUrl] = useState<string>('');
  const [playing, setPlaying] = useState<boolean>(false);
  const [isLocalAction, setIsLocalAction] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [activeUsers, setActiveUsers] = useState<UserPresence[]>([]);
  const [hostId, setHostId] = useState<string | null>(null);
  const [inputText, setInputText] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'chat' | 'queue' | 'users'>('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [nickInput, setNickInput] = useState<string>('');
  const [isNickModalOpen, setIsNickModalOpen] = useState<boolean>(false);
  const [isSavingNick, setIsSavingNick] = useState<boolean>(false);
  const [confirmedNick, setConfirmedNick] = useState<string>('');
  const [queueInputUrl, setQueueInputUrl] = useState<string>('');
  const [avatarError, setAvatarError] = useState<boolean>(false);
  const [avatarSrc, setAvatarSrc] = useState<string>('');
  const [avatarTriedAlt, setAvatarTriedAlt] = useState<boolean>(false);

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 3000);
  };

  const isHost = currentUser?.uid === hostId;
  const isAnonymous = currentUser?.isAnonymous ?? false;
  const trimmedNick = nickInput.trim();
  const userDisplayName = currentUser?.displayName?.trim() || '';
  const hasDisplayName = userDisplayName.length >= MIN_NICK_LENGTH;
  const confirmedDisplayName = hasDisplayName ? userDisplayName : confirmedNick.trim();
  const isNickRequired = isAnonymous && confirmedDisplayName.length < MIN_NICK_LENGTH;
  const isNickGateOpen = isNickModalOpen || isNickRequired;
  const isNickValid = trimmedNick.length >= MIN_NICK_LENGTH;
  const canChat = !!currentUser && (!isAnonymous || confirmedDisplayName.length >= MIN_NICK_LENGTH);

  const getEffectiveName = (user: User | null) => {
    if (!user) return 'Misafir';
    const customNick = confirmedNick.trim();
    if (customNick.length >= MIN_NICK_LENGTH) return customNick;
    const name = user.displayName?.trim();
    if (name && name.length >= MIN_NICK_LENGTH) return name;
    if (user.isAnonymous) {
      const anonName = trimmedNick;
      if (anonName.length >= MIN_NICK_LENGTH) return anonName;
    }
    return `Kullanıcı#${user.uid.substring(0, 4)}`;
  };

  // 1. Auth & Presence Logic
  useEffect(() => {
    if (!roomId) return;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        if (import.meta.env.DEV) {
          (window as any).__h2gUser = user;
        }
        const isAnon = user.isAnonymous;
        let resolvedName = user.displayName?.trim() || '';
        let storedNick = '';
        if (isAnon) {
          if (resolvedName.length < MIN_NICK_LENGTH) {
            const storedNick = localStorage.getItem(ANON_NICK_STORAGE_KEY)?.trim() || '';
            const hasStoredNick = storedNick.length >= MIN_NICK_LENGTH;
            const initialNick = hasStoredNick ? storedNick : generateRandomNick();
            setNickInput(initialNick);
            setIsNickModalOpen(true);
            resolvedName = initialNick;
            setConfirmedNick(hasStoredNick ? storedNick : '');
          } else {
            setNickInput(resolvedName);
            localStorage.setItem(ANON_NICK_STORAGE_KEY, resolvedName);
            setIsNickModalOpen(false);
            setConfirmedNick(resolvedName);
          }
        } else {
          storedNick = localStorage.getItem(getAuthNickStorageKey(user.uid))?.trim() || '';
          if (storedNick.length >= MIN_NICK_LENGTH) {
            setNickInput(storedNick);
            setConfirmedNick(storedNick);
          } else {
            setNickInput('');
            setConfirmedNick('');
          }
          setIsNickModalOpen(false);
        }
        const userPresenceRef = ref(db, `rooms/${roomId}/users/${user.uid}`);
        get(userPresenceRef).then(snapshot => {
          const existingData = snapshot.val();
          const presenceName = isAnon
            ? (resolvedName.length >= MIN_NICK_LENGTH ? resolvedName : `Kullanıcı#${user.uid.substring(0, 4)}`)
            : (storedNick.length >= MIN_NICK_LENGTH
              ? storedNick
              : (resolvedName.length >= MIN_NICK_LENGTH ? resolvedName : `Kullanıcı#${user.uid.substring(0, 4)}`));
          set(userPresenceRef, {
            uid: user.uid,
            active: true,
            lastSeen: serverTimestamp(),
            joinedAt: existingData?.joinedAt || Date.now(),
            name: presenceName,
            photoURL: user.photoURL || null
          });
        });
        onDisconnect(userPresenceRef).remove();
      } else {
        signInAnonymously(auth);
      }
    });

    const usersRef = ref(db, `rooms/${roomId}/users`);
    const unsubUsers = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userList = Object.values(data) as UserPresence[];
        const sortedUsers = userList.sort((a, b) => a.joinedAt - b.joinedAt);
        setActiveUsers(sortedUsers);
        const currentHostId = sortedUsers[0]?.uid;
        const hostRef = ref(db, `rooms/${roomId}/hostId`);
        get(hostRef).then(hostSnapshot => {
          if (!hostSnapshot.val() || !data[hostSnapshot.val()]) {
            set(hostRef, currentHostId);
          }
        });
      } else {
        setActiveUsers([]);
      }
    });

    const hostIdRef = onValue(ref(db, `rooms/${roomId}/hostId`), (snapshot) => {
      setHostId(snapshot.val());
    });

    return () => {
      unsubscribeAuth();
      unsubUsers();
      hostIdRef();
    };
  }, [roomId]);

  // 2. Video Sync & Queue
  useEffect(() => {
    if (!roomId) return;

    const existenceRef = ref(db, `rooms/${roomId}`);
    const unsubExistence = onValue(existenceRef, (snapshot) => {
      if (!snapshot.exists() && !isFirstLoad.current) {
        navigate('/');
      }
      isFirstLoad.current = false;
    });

    const roomRef = ref(db, `rooms/${roomId}/videoState`);
    const unsubRoom = onValue(roomRef, (snapshot) => {
      const data = snapshot.val() as RoomState;
      if (data) {
        setUrl(data.url);
        if (!isLocalAction) {
          setPlaying(data.playing);
          const currentTime = playerRef.current?.getCurrentTime() || 0;
          if (Math.abs(currentTime - data.playedSeconds) > 2) {
            playerRef.current?.seekTo(data.playedSeconds, 'seconds');
          }
        }
        setIsLocalAction(false);
      }
    });

    const queueRef = ref(db, `rooms/${roomId}/queue`);
    const unsubQueue = onValue(queueRef, (snapshot) => {
      const data = snapshot.val();
      const qList = data ? Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val })).sort((a, b) => a.timestamp - b.timestamp) : [];
      setQueue(qList);
    });

    const chatRef = ref(db, `rooms/${roomId}/chat`);
    const unsubChat = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      const msgList = data ? Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val })).sort((a, b) => a.timestamp - b.timestamp) : [];
      setMessages(msgList);
    });

    return () => {
      unsubRoom();
      unsubQueue();
      unsubChat();
      unsubExistence();
    };
  }, [roomId, isLocalAction, navigate]);

  useEffect(() => {
    const rawPhotoUrl = getUserPhotoUrl(currentUser);
    const src = rawPhotoUrl ? getPreferredPhotoUrl(rawPhotoUrl) : '';
    setAvatarSrc(src);
    setAvatarError(false);
    setAvatarTriedAlt(false);
  }, [currentUser?.uid, currentUser?.photoURL]);

  const updateRoomState = (updates: Partial<RoomState>) => {
    if (!roomId) return;
    setIsLocalAction(true);
    update(ref(db, `rooms/${roomId}/videoState`), {
      ...updates,
      lastUpdated: serverTimestamp()
    });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser || !roomId) return;
    if (!canChat) {
      setIsNickModalOpen(true);
      triggerToast("Sohbet için nick belirleyin.");
      return;
    }
    const messagePayload: Record<string, any> = {
      text: inputText.trim(),
      userId: currentUser.uid,
      userName: getEffectiveName(currentUser),
      timestamp: serverTimestamp()
    };
    if (currentUser.photoURL) {
      messagePayload.photoURL = currentUser.photoURL;
    }
    push(ref(db, `rooms/${roomId}/chat`), messagePayload);
    setInputText('');
  };

  const addVideoToQueue = (rawUrl: string) => {
    const videoUrl = rawUrl.trim();
    if (!videoUrl || !roomId) return;
    setIsLocalAction(true);
    if (!url) {
      set(ref(db, `rooms/${roomId}/videoState`), {
        url: videoUrl,
        playing: true,
        playedSeconds: 0,
        lastUpdated: serverTimestamp()
      });
    }
    push(ref(db, `rooms/${roomId}/queue`), {
      url: videoUrl,
      addedBy: currentUser?.uid || 'anonymous',
      addedByName: getEffectiveName(currentUser),
      timestamp: serverTimestamp()
    });
    triggerToast("Video eklendi!");
  };

  const handleAddToQueueFromSidebar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queueInputUrl.trim() || !roomId) return;
    addVideoToQueue(queueInputUrl);
    setQueueInputUrl('');
  };

  const playFromQueue = (item: QueueItem) => {
    setIsLocalAction(true);
    updateRoomState({ url: item.url, playing: true, playedSeconds: 0 });
  };

  const removeFromQueue = (id: string) => {
    set(ref(db, `rooms/${roomId}/queue/${id}`), null);
  };

  const handleVideoEnded = () => {
    if (queue.length > 0) {
      const currentIndex = queue.findIndex(item => item.url === url);
      if (currentIndex !== -1 && currentIndex < queue.length - 1) {
        playFromQueue(queue[currentIndex + 1]);
      }
    }
  };

  const togglePlayback = (play: boolean) => {
    setPlaying(play);
    updateRoomState({ playing: play, playedSeconds: playerRef.current?.getCurrentTime() || 0 });
  };

  const deleteRoom = async () => {
    if (window.confirm("Odayı kapatmak istediğinize emin misiniz? Tüm veriler silinecektir.")) {
      await remove(ref(db, `rooms/${roomId}`));
      navigate('/');
    }
  };

  const transferHost = (newHostId: string) => {
    if (isHost) {
      set(ref(db, `rooms/${roomId}/hostId`), newHostId);
      triggerToast("Yöneticilik devredildi.");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error: any) {
      console.error("Login failed:", error);
    }
  };

  const handleSaveNickname = async () => {
    if (!currentUser || !isNickValid || !roomId) return;
    setIsSavingNick(true);
    const newNick = trimmedNick;
    try {
      if (currentUser.isAnonymous) {
        const authUser = auth.currentUser || currentUser;
        await updateProfile(authUser, { displayName: newNick });
        localStorage.setItem(ANON_NICK_STORAGE_KEY, newNick);
        setConfirmedNick(newNick);
        setCurrentUser(authUser);
        await update(ref(db, `rooms/${roomId}/users/${authUser.uid}`), { name: newNick });
      } else {
        localStorage.setItem(getAuthNickStorageKey(currentUser.uid), newNick);
        setConfirmedNick(newNick);
        await update(ref(db, `rooms/${roomId}/users/${currentUser.uid}`), { name: newNick });
      }
      setIsNickModalOpen(false);
      triggerToast("Nick güncellendi!");
    } catch (error: any) {
      console.error("Nickname update failed:", error);
      triggerToast("Nick kaydedilemedi.");
    } finally {
      setIsSavingNick(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#020617] text-slate-100 overflow-hidden font-sans">
      <AnimatePresence>
        {showToast && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl text-sm font-bold shadow-2xl text-blue-400">
            {showToast}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isNickGateOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-6"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0b1220] p-6 shadow-2xl"
            >
              <div className="mb-4">
                <h3 className="text-lg font-bold text-white">Takma adini sec</h3>
                <p className="text-xs text-slate-400">En az {MIN_NICK_LENGTH} karakter. Diledigin zaman degistirebilirsin.</p>
              </div>
              <input
                type="text"
                value={nickInput}
                onChange={(e) => setNickInput(e.target.value)}
                placeholder="Nick yaz..."
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
              <div className="mt-6 flex items-center gap-3">
                {!isNickRequired && (
                  <button
                    onClick={() => setIsNickModalOpen(false)}
                    className="flex-1 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-white/5"
                  >
                    Vazgec
                  </button>
                )}
                <button
                  onClick={handleSaveNickname}
                  disabled={!isNickValid || isSavingNick}
                  className={cn(
                    "flex-1 rounded-2xl px-4 py-3 text-sm font-semibold text-white",
                    isNickValid && !isSavingNick ? "bg-blue-600 hover:bg-blue-500" : "bg-blue-600/40 cursor-not-allowed"
                  )}
                >
                  {isSavingNick ? "Kaydediliyor..." : "Devam Et"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating sidebar toggle — video sağ ortasında, YouTube kontrollerine değmiyor */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex items-center justify-center w-6 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/10 rounded-l-xl transition-all text-slate-400 hover:text-white"
        >
          <ChevronLeft size={14} />
        </button>
      )}

      <div className={cn("flex-1 flex flex-col min-w-0 h-full relative transition-all duration-500", isSidebarOpen ? "lg:mr-[400px]" : "mr-0")}>
        <main className="flex-1 bg-black flex items-center justify-center relative overflow-hidden">
          {url ? (
            <div className="w-full h-full" key={url}>
              <ReactPlayer
                ref={playerRef}
                url={url}
                playing={playing}
                controls={true}
                width="100%"
                height="100%"
                onPlay={() => !isLocalAction && togglePlayback(true)}
                onPause={() => !isLocalAction && togglePlayback(false)}
                onSeek={(seconds: number) => !isLocalAction && updateRoomState({ playedSeconds: seconds })}
                onEnded={handleVideoEnded}
              />
            </div>
          ) : (
            <div className="text-center p-12 text-white">
              <div className="w-20 h-20 bg-blue-600/20 text-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-6"><Plus size={40} /></div>
              <h2 className="text-2xl font-bold mb-2">Sahne Boş</h2>
              <p className="text-slate-400">Video eklemek için sağ paneli kullanın.</p>
            </div>
          )}
        </main>
      </div>

      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }} className="fixed top-0 right-0 w-full lg:w-[400px] h-full flex flex-col bg-[#020617] border-l border-white/5 z-[60]">
            {/* Sidebar header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0"><Play fill="white" size={16} /></div>
                <div className="flex flex-col text-left text-white">
                  <h1 className="text-sm font-black uppercase leading-none italic">H2G</h1>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5">{roomId}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => { navigator.clipboard.writeText(window.location.href); triggerToast("Link kopyalandı!"); }} className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white"><Share2 size={16} /></button>
                {isHost && <button onClick={deleteRoom} className="p-2 hover:bg-red-500/20 rounded-xl text-red-500"><Trash2 size={16} /></button>}
                {currentUser ? (
                  <>
                    <button onClick={() => setIsNickModalOpen(true)} className="bg-white/10 text-white px-2.5 py-1.5 rounded-xl font-bold text-xs border border-white/10">Nick</button>
                    {currentUser.isAnonymous ? (
                      <button onClick={handleGoogleLogin} className="bg-white text-black px-3 py-1.5 rounded-xl font-bold text-xs">Giriş Yap</button>
                    ) : (
                      <div className="w-8 h-8 rounded-xl overflow-hidden border border-white/10 cursor-pointer flex-shrink-0" onClick={() => auth.signOut()}>
                        {avatarSrc && !avatarError ? (
                          <img
                            src={avatarSrc}
                            alt="Me"
                            className="w-full h-full"
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                            onError={() => {
                              if (!avatarTriedAlt && avatarSrc) {
                                const retried = getRetriedPhotoUrl(avatarSrc);
                                if (retried && retried !== avatarSrc) {
                                  setAvatarSrc(retried);
                                  setAvatarTriedAlt(true);
                                  return;
                                }
                              }
                              setAvatarError(true);
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-800 text-xs font-bold text-white">
                            {(currentUser.displayName || '?')[0]}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <button onClick={handleGoogleLogin} className="bg-white text-black px-3 py-1.5 rounded-xl font-bold text-xs">Giriş Yap</button>
                )}
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white"><ChevronRight size={16} /></button>
              </div>
            </div>

            {/* Tab butonları */}
            <div className="flex px-4 pb-2 gap-2 text-center items-center justify-center">
              <button onClick={() => setActiveTab('chat')} className={cn("flex-1 py-2.5 rounded-xl text-xs font-bold uppercase", activeTab === 'chat' ? "bg-blue-600 text-white" : "text-slate-500")}>Sohbet</button>
              <button onClick={() => setActiveTab('queue')} className={cn("flex-1 py-2.5 rounded-xl text-xs font-bold uppercase", activeTab === 'queue' ? "bg-blue-600 text-white" : "text-slate-500")}>Sıra</button>
              <button onClick={() => setActiveTab('users')} className={cn("flex-1 py-2.5 rounded-xl text-xs font-bold uppercase", activeTab === 'users' ? "bg-blue-600 text-white" : "text-slate-500")}>İzleyiciler</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {activeTab === 'chat' && messages.map((msg) => (
                <div key={msg.id} className={cn("flex gap-2", msg.userId === currentUser?.uid ? "flex-row-reverse" : "flex-row")}>
                  <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-slate-800">{msg.photoURL ? <img src={msg.photoURL} alt="p" className="w-full h-full" /> : <div className="w-full h-full flex items-center justify-center text-[10px] text-white font-bold uppercase">{msg.userName[0]}</div>}</div>
                  <div className={cn("max-w-[80%] flex flex-col", msg.userId === currentUser?.uid ? "items-end" : "items-start")}>
                    <span className="text-[10px] text-slate-500 mb-1">{msg.userName}</span>
                    <div className={cn("px-3 py-2 rounded-2xl text-sm", msg.userId === currentUser?.uid ? "bg-blue-600 text-white" : "bg-white/5 text-slate-200")}>{msg.text}</div>
                  </div>
                </div>
              ))}
              {activeTab === 'queue' && (
                <div className="flex flex-col gap-3">
                  <form onSubmit={handleAddToQueueFromSidebar} className="flex gap-2 bg-white/5 border border-white/10 rounded-2xl p-2">
                    <input
                      type="text"
                      value={queueInputUrl}
                      onChange={(e) => setQueueInputUrl(e.target.value)}
                      placeholder="Listeye video ekle..."
                      className="flex-1 bg-transparent border-none px-3 py-2 text-xs text-white focus:outline-none"
                    />
                    <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold transition-all"><Plus size={16} /></button>
                  </form>
                  {queue.length === 0 ? (
                    <div className="text-xs text-slate-500 text-center py-6">Sirada video yok.</div>
                  ) : (
                    queue.map((item, index) => {
                      const previewUrl = getQueuePreviewUrl(item.url);
                      return (
                        <div key={item.id} className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                          <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-slate-800">
                            {previewUrl ? (
                              <img src={previewUrl} alt="preview" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-400">
                                <Play size={18} />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-1 left-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">#{index + 1}</div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[10px] text-slate-400">Ekleyen: {item.addedByName || 'Misafir'}</div>
                            <div className="truncate text-sm text-white">{item.url}</div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <button onClick={() => playFromQueue(item)} className="rounded-lg bg-blue-600/20 p-2 text-blue-400"><Play size={14} /></button>
                            <button onClick={() => removeFromQueue(item.id)} className="rounded-lg bg-red-600/20 p-2 text-red-400"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
              {activeTab === 'users' && activeUsers.map((u) => (
                <div key={u.uid} className="flex items-center justify-between p-2 rounded-xl bg-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg overflow-hidden">{u.photoURL ? <img src={u.photoURL} alt="u" className="w-full h-full" /> : <div className="bg-slate-800 w-full h-full flex items-center justify-center text-xs text-white uppercase font-bold">{u.name[0]}</div>}</div>
                    <span className="text-sm font-bold text-white">{u.name} {u.uid === hostId && <Crown size={12} className="text-yellow-500 inline" />}</span>
                  </div>
                  {isHost && u.uid !== hostId && <button onClick={() => transferHost(u.uid)} className="text-slate-500 hover:text-yellow-500"><Crown size={14} /></button>}
                </div>
              ))}
            </div>
            {activeTab === 'chat' && (
              <div className="p-4 border-t border-white/5">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={canChat ? "Mesaj gönder..." : "Sohbet için nick belirleyin..."}
                    readOnly={!canChat}
                    onFocus={() => {
                      if (!canChat) {
                        setIsNickModalOpen(true);
                      }
                    }}
                    className={cn(
                      "flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none",
                      !canChat && "opacity-60 cursor-not-allowed"
                    )}
                  />
                  <button
                    type="submit"
                    disabled={!canChat}
                    className={cn(
                      "p-2 bg-blue-600 rounded-xl",
                      !canChat && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Send size={18} className="text-white" />
                  </button>
                </form>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Room;
