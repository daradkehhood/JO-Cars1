'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, Send, ChevronLeft, Eye, Search, Smile, CheckCheck, Check,
  ArrowDown, Image as ImageIcon, X, Loader2, Car, Sparkles, Filter, Phone,
  Calculator, ShieldCheck, MapPin, ExternalLink, Zap, Paperclip, MoreVertical, RefreshCw
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { getSocket } from '@/lib/socket';
import type { Conversation, Message } from '@/types';
import toast from 'react-hot-toast';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import Link from 'next/link';

// Jordan Fast Reply Chips
const QUICK_REPLIES = [
  '💵 ما هو السعر النهائي من الآخر؟',
  '📋 هل السيارة فحص كامل (7 جيد)؟',
  '📍 أين موقع المعاينة والمعرض؟',
  '🔁 هل تقبل البدل بسيارة أخرى؟',
  '📸 هل يمكنك إرسال صور إضافية للداخلية والفرش؟',
  '⚡ هل السعر شامل الجمارك والترخيص؟',
];

const EMOJI_DATA: Record<string, string[]> = {
  'المركبات 🚗': ['🚗','🏎️','🛻','🚙','🚌','🏍️','🛵','⚡','🔥','💎','👍','🤝'],
  'الوجوه 😀': ['😀','😃','😄','😁','😆','😂','🤣','🙂','😉','😊','😇','🥰','😍','🤩','😘','🤔','😎','🥳','🤝','👍','👏','❤️','🔥'],
  'الرموز 💎': ['❤️','💚','💙','🖤','🤍','💯','✅','⭐','🌟','💵','💰','🏷️','🔑','📍','📞','⚡'],
};

export default function MessagesContent() {
  const { user, isAuthenticated, _hydrated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [showList, setShowList] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'UNREAD' | 'CARS'>('ALL');
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const convIdParam = searchParams.get('conversationId');
  const initialDone = useRef(false);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/conversations');
      const data = await res.json();
      if (data.success) return data.data || [];
      return [];
    } catch { return []; }
  }, []);

  const fetchMessages = useCallback(async (convId: string) => {
    try {
      const res = await fetch(`/api/conversations/${convId}/messages`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.data || []);
        return true;
      }
      return false;
    } catch { return false; }
  }, []);

  useEffect(() => {
    if (_hydrated && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (isAuthenticated) {
      fetchConversations().then((convs: Conversation[]) => {
        setConversations(convs);
        setLoading(false);
        if (!initialDone.current && convIdParam) {
          const found = convs.find((c: Conversation) => c.id === convIdParam);
          if (found) {
            initialDone.current = true;
            setActiveConv(found);
            setShowList(false);
            fetchMessages(convIdParam);
          }
        }
      });
    }
  }, [isAuthenticated, _hydrated, router, fetchConversations, fetchMessages, convIdParam]);

  useEffect(() => {
    if (!user?.id) return;
    const socket = getSocket(user.id);
    const onOnline = (data: { userId: string }) => setOnlineUsers((prev) => new Set(prev).add(data.userId));
    const onOffline = (data: { userId: string }) => setOnlineUsers((prev) => { const n = new Set(prev); n.delete(data.userId); return n; });
    socket.on('user-online', onOnline);
    socket.on('user-offline', onOffline);

    conversations.forEach((conv) => {
      const otherId = conv.buyerId === user?.id ? conv.sellerId : conv.buyerId;
      if (otherId) socket.emit('check-online', otherId);
    });

    socket.on('user-status', (data: { userId: string; online: boolean }) => {
      setOnlineUsers((prev) => {
        const n = new Set(prev);
        if (data.online) n.add(data.userId);
        else n.delete(data.userId);
        return n;
      });
    });

    return () => {
      socket.off('user-online', onOnline);
      socket.off('user-offline', onOffline);
      socket.off('user-status');
    };
  }, [user?.id, conversations]);

  const scrollToBottom = (smooth = true) => {
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: smooth ? 'smooth' : 'instant',
        });
      }
    }, 50);
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [messages]);

  const handleScroll = () => {
    const container = chatContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 200);
  };

  useEffect(() => {
    if (!user?.id) return;
    const socket = getSocket(user.id);
    const onMsg = (data: Message) => {
      if (activeConv && data.conversationId === activeConv.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev;
          return [...prev, data];
        });
        scrollToBottom();
      }
      fetchConversations();
    };
    const onTyping = (data: { userId: string }) => setTypingUsers((prev) => new Set(prev).add(data.userId));
    const onStopTyping = () => setTypingUsers(new Set());
    socket.on('message-received', onMsg);
    socket.on('user-typing', onTyping);
    socket.on('user-stop-typing', onStopTyping);
    return () => {
      socket.off('message-received', onMsg);
      socket.off('user-typing', onTyping);
      socket.off('user-stop-typing', onStopTyping);
    };
  }, [activeConv, fetchConversations, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const socket = getSocket(user.id);
    if (activeConv) socket.emit('join-conversation', activeConv.id);
    return () => {
      if (activeConv) socket.emit('leave-conversation', activeConv.id);
    };
  }, [activeConv?.id, user?.id]);

  const openConversation = async (conv: Conversation) => {
    setActiveConv(conv);
    setShowList(false);
    await fetchMessages(conv.id);
    scrollToBottom(false);
    setTimeout(() => inputRef.current?.focus(), 200);
  };

  const emitTyping = (isTyping: boolean) => {
    if (!activeConv || !user?.id) return;
    const socket = getSocket(user.id);
    if (isTyping) socket.emit('typing', { conversationId: activeConv.id, userId: user.id });
    else socket.emit('stop-typing', { conversationId: activeConv.id });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (!typingTimeoutRef.current) emitTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => { emitTyping(false); typingTimeoutRef.current = null; }, 1500);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const cancelImagePreview = () => {
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadAndSendImage = async () => {
    if (!selectedImageFile || !activeConv) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedImageFile);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadData.success) {
        toast.error('فشل رفع الصورة');
        return;
      }
      const imageUrl = uploadData.data?.url;
      if (imageUrl) {
        const caption = newMessage.trim();
        const content = caption ? `IMG:${imageUrl}\n${caption}` : `IMG:${imageUrl}`;
        setNewMessage('');
        cancelImagePreview();
        await sendMessage(content);
      }
    } catch {
      toast.error('حدث خطأ أثناء الرفع');
    } finally {
      setUploadingImage(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || !activeConv || sending) return;
    setSending(true);
    const finalContent = content.trim();
    setNewMessage('');
    const receiverId = activeConv.buyerId === user?.id ? activeConv.sellerId : activeConv.buyerId;
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: finalContent,
          receiverId,
          carId: activeConv.carId,
          conversationId: activeConv.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const socket = getSocket(user?.id);
        socket.emit('new-message', { ...data.data, conversationId: activeConv.id });
        setMessages((prev) => [...prev, data.data]);
        fetchConversations();
        scrollToBottom();
      } else {
        toast.error('فشل إرسال الرسالة');
        setNewMessage(finalContent);
      }
    } catch {
      toast.error('فشل الإرسال');
      setNewMessage(finalContent);
    } finally {
      setSending(false);
    }
  };

  const handleSend = () => {
    if (selectedImageFile) {
      uploadAndSendImage();
      return;
    }
    if (!newMessage.trim()) return;
    sendMessage(newMessage);
  };

  const handleQuickReply = (text: string) => {
    setNewMessage(text);
    inputRef.current?.focus();
  };

  if (!_hydrated || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-between">
        <Header />
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-500">جاري فتح مركز الرسائل...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const otherParticipant = (conv: Conversation) => conv.buyerId === user?.id ? conv.seller : conv.buyer;
  const isUserOnline = (userId?: string) => userId ? onlineUsers.has(userId) : false;

  const filteredConversations = conversations.filter(conv => {
    const other = otherParticipant(conv);
    const q = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || other?.name?.toLowerCase().includes(q) || conv.car?.brand?.nameAr?.includes(q) || conv.car?.model?.nameAr?.includes(q);
    if (!matchesSearch) return false;

    if (filterTab === 'UNREAD') return (conv.unreadCount || 0) > 0;
    if (filterTab === 'CARS') return !!conv.car;
    return true;
  });

  const getTimeLabel = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return d.toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'أمس';
    if (diffDays < 7) return d.toLocaleDateString('ar-JO', { weekday: 'short' });
    return d.toLocaleDateString('ar-JO', { month: 'short', day: 'numeric' });
  };

  const unreadTotal = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  const parseMessageContent = (content: string) => {
    const lines = content.split('\n');
    let imageUrl: string | null = null;
    let text = '';
    for (const line of lines) {
      if (line.startsWith('IMG:')) {
        imageUrl = line.replace('IMG:', '').trim();
      } else {
        text += (text ? '\n' : '') + line;
      }
    }
    return { imageUrl, text: text.trim() };
  };

  const getLastMsgPreview = (msg?: Message | null) => {
    if (!msg) return 'اضغط لبدء المحادثة';
    const { imageUrl, text } = parseMessageContent(msg.content);
    if (imageUrl && text) return `📷 ${text}`;
    if (imageUrl) return '📷 صورة مرفقة';
    return msg.content;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-between text-gray-900 dark:text-gray-100">
      <Header />

      <main className="container-custom max-w-[1400px] mx-auto px-2 sm:px-4 pt-20 sm:pt-24 pb-6 flex-1 w-full flex flex-col justify-center">
        {/* Main Messenger Box */}
        <div className="card overflow-hidden shadow-2xl border border-gray-200 dark:border-emerald-500/20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl h-[calc(100vh-160px)] min-h-[620px] max-h-[850px] rounded-2xl sm:rounded-3xl flex">

          {/* Conversations Sidebar */}
          <div className={`w-full md:w-[380px] shrink-0 border-l border-gray-200 dark:border-gray-800/80 flex flex-col ${showList ? 'flex' : 'hidden md:flex'} bg-gray-50/50 dark:bg-gray-900/50`}>
            
            {/* Sidebar Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900 dark:text-white">المحادثات المباشرة</h2>
                    <p className="text-[11px] text-gray-500">سوق Cars JO المعتمد 🇯🇴</p>
                  </div>
                </div>
                {unreadTotal > 0 && (
                  <span className="px-2.5 py-0.5 bg-emerald-500 text-white text-xs font-black rounded-full shadow-lg shadow-emerald-500/20 animate-pulse">
                    {unreadTotal} جديد
                  </span>
                )}
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث بالاسم أو اسم السيارة..."
                  className="w-full pr-10 pl-4 py-2 rounded-2xl text-xs bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700/60 focus:border-emerald-500 outline-none transition-all shadow-sm"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  onClick={() => setFilterTab('ALL')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    filterTab === 'ALL'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'bg-gray-200/70 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  الكل ({conversations.length})
                </button>
                <button
                  onClick={() => setFilterTab('UNREAD')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    filterTab === 'UNREAD'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'bg-gray-200/70 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  غير مقروء ({unreadTotal})
                </button>
                <button
                  onClick={() => setFilterTab('CARS')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    filterTab === 'CARS'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'bg-gray-200/70 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  السيارات 🚗
                </button>
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800/50">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center my-auto">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-400 flex items-center justify-center mx-auto mb-3">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-gray-500">لا توجد محادثات مطابقة حالياً</p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const other = otherParticipant(conv);
                  const isActive = activeConv?.id === conv.id;
                  const hasUnread = (conv.unreadCount || 0) > 0;
                  const otherOnline = isUserOnline(other?.id);

                  return (
                    <button
                      key={conv.id}
                      onClick={() => openConversation(conv)}
                      className={`w-full text-right p-3.5 flex items-center gap-3.5 transition-all relative ${
                        isActive
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-r-4 border-emerald-500'
                          : 'hover:bg-gray-100/60 dark:hover:bg-gray-800/40'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-base font-black shadow-md overflow-hidden">
                          {other?.image ? (
                            <img src={other.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span>{other?.name?.charAt(0) || 'U'}</span>
                          )}
                        </div>
                        {otherOnline && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900 shadow-sm" title="متصل الآن" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className={`text-xs truncate ${hasUnread ? 'font-black text-gray-900 dark:text-white' : 'font-bold text-gray-700 dark:text-gray-200'}`}>
                            {other?.name || 'مستخدم Cars JO'}
                          </h4>
                          {conv.lastMessage && (
                            <span className={`text-[10px] shrink-0 ${hasUnread ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                              {getTimeLabel(String(conv.lastMessage.createdAt))}
                            </span>
                          )}
                        </div>

                        <p className={`text-xs truncate ${hasUnread ? 'font-bold text-emerald-700 dark:text-emerald-300' : 'text-gray-500 dark:text-gray-400'}`}>
                          {getLastMsgPreview(conv.lastMessage)}
                        </p>

                        {conv.car && (
                          <div className="mt-1.5 flex items-center gap-1">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100/80 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold truncate max-w-[200px]">
                              🚗 {conv.car.brand?.nameAr} {conv.car.model?.nameAr} ({conv.car.price.toLocaleString('ar-JO')} د.أ)
                            </span>
                          </div>
                        )}
                      </div>

                      {hasUnread && !isActive && (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 shadow-sm shadow-emerald-500/50" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Active Chat Main Panel */}
          <div className={`flex-1 flex flex-col ${!showList ? 'flex' : 'hidden md:flex'} bg-white dark:bg-gray-900 relative`}>
            {activeConv ? (
              <>
                {/* Chat Top Header */}
                <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-md flex items-center justify-between gap-3 z-10">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      className="md:hidden p-2 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                      onClick={() => setShowList(true)}
                    >
                      <ChevronLeft className="w-5 h-5 rotate-180" />
                    </button>

                    <div
                      className="relative cursor-pointer shrink-0"
                      onClick={() => router.push(`/profile/${otherParticipant(activeConv)?.id}`)}
                    >
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black overflow-hidden shadow">
                        {otherParticipant(activeConv)?.image ? (
                          <img src={otherParticipant(activeConv)?.image || ''} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span>{otherParticipant(activeConv)?.name?.charAt(0) || 'U'}</span>
                        )}
                      </div>
                      {isUserOnline(otherParticipant(activeConv)?.id) && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3
                        onClick={() => router.push(`/profile/${otherParticipant(activeConv)?.id}`)}
                        className="text-sm font-black text-gray-900 dark:text-white truncate cursor-pointer hover:text-emerald-500 transition-colors"
                      >
                        {otherParticipant(activeConv)?.name}
                      </h3>
                      <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        {isUserOnline(otherParticipant(activeConv)?.id) ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                            متصل الآن في Cars JO
                          </>
                        ) : (
                          <span className="text-gray-400 font-normal">غير متصل حالياً</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {otherParticipant(activeConv)?.phone && (
                      <a
                        href={`tel:${otherParticipant(activeConv)?.phone}`}
                        className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-100 transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                        <span className="hidden sm:inline">اتصال هاتف</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Attached Vehicle Context Banner */}
                {activeConv.car && (
                  <div className="p-3 bg-gradient-to-r from-emerald-900/10 via-teal-900/10 to-slate-900/10 dark:from-emerald-950/40 dark:to-teal-950/40 border-b border-emerald-500/20 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-12 rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-800 shrink-0 border border-emerald-500/30 shadow-sm">
                        <img
                          src={activeConv.car.images?.[0]?.url || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=300&q=80'}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500 text-white">سيارة المحادثة</span>
                          <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                            {activeConv.car.brand?.nameAr} {activeConv.car.model?.nameAr} {activeConv.car.year}
                          </h4>
                        </div>
                        <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {activeConv.car.price?.toLocaleString('ar-JO')} د.أ
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Link
                        href={`/customs-calculator?year=${activeConv.car.year}&price=${activeConv.car.price}`}
                        className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[11px] font-bold border border-gray-200 dark:border-gray-700 hover:border-emerald-500 transition-colors hidden sm:flex items-center gap-1"
                        title="حاسبة الجمارك"
                      >
                        <Calculator className="w-3.5 h-3.5 text-emerald-500" /> الجمارك
                      </Link>
                      <Link
                        href={`/cars/${activeConv.car.slug || activeConv.carId}`}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> معاينة الإعلان
                      </Link>
                    </div>
                  </div>
                )}

                {/* Messages Stream Window */}
                <div
                  ref={chatContainerRef}
                  onScroll={handleScroll}
                  className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30 dark:bg-gray-950/40"
                >
                  {messages.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                        <Sparkles className="w-8 h-8" />
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">بداية محادثة جديدة</h4>
                      <p className="text-xs text-gray-500 mt-1">ابدأ بالتفاوض أو استخدم أزرار الرد السريع بالأسفل!</p>
                    </div>
                  ) : (
                    (() => {
                      let lastDate = '';
                      return messages.map((msg, i) => {
                        const isMine = msg.senderId === user?.id;
                        const msgDate = new Date(msg.createdAt).toLocaleDateString('ar-JO');
                        const showDate = msgDate !== lastDate;
                        if (showDate) lastDate = msgDate;

                        const { imageUrl, text } = parseMessageContent(msg.content);

                        return (
                          <div key={msg.id} className="space-y-2">
                            {showDate && (
                              <div className="text-center my-3">
                                <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                  {new Date(msg.createdAt).toLocaleDateString('ar-JO', { weekday: 'long', month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            )}

                            <div className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                              {!isMine && (
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden shadow-sm">
                                  {otherParticipant(activeConv)?.image ? (
                                    <img src={otherParticipant(activeConv)?.image || ''} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <span>{otherParticipant(activeConv)?.name?.charAt(0) || 'U'}</span>
                                  )}
                                </div>
                              )}

                              <div className={`max-w-[75%] sm:max-w-[65%] space-y-1 ${isMine ? 'items-end' : 'items-start'}`}>
                                {imageUrl ? (
                                  <div className="space-y-1">
                                    <img
                                      src={imageUrl}
                                      alt="مرفق صورة"
                                      className="max-w-[260px] sm:max-w-[320px] max-h-[300px] rounded-2xl cursor-pointer hover:opacity-90 transition-all shadow-md border border-gray-200 dark:border-gray-700 object-cover"
                                      onClick={() => setViewerImage(imageUrl)}
                                    />
                                    {text && (
                                      <div className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed shadow-sm ${
                                        isMine
                                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-none'
                                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700/60 rounded-bl-none'
                                      }`}>
                                        <p>{text}</p>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed shadow-sm ${
                                    isMine
                                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-none'
                                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700/60 rounded-bl-none'
                                  }`}>
                                    <p>{text}</p>
                                  </div>
                                )}

                                <div className={`flex items-center gap-1 text-[10px] text-gray-400 px-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                  <span>{new Date(msg.createdAt).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' })}</span>
                                  {isMine && (
                                    <span className={msg.read ? 'text-emerald-500 font-bold' : 'text-gray-400'}>
                                      {msg.read ? <CheckCheck className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()
                  )}

                  {/* Typing Indicator */}
                  {typingUsers.size > 0 && otherParticipant(activeConv)?.id && typingUsers.has(otherParticipant(activeConv)!.id) && (
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xs font-bold">
                        💬
                      </div>
                      <div className="px-3 py-2 rounded-2xl bg-gray-200 dark:bg-gray-800 text-gray-500 text-xs flex items-center gap-1.5">
                        <span>يكتب الآن</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" />
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce delay-150" />
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce delay-300" />
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Scroll to Bottom Floating Button */}
                <AnimatePresence>
                  {showScrollBtn && (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      onClick={() => scrollToBottom()}
                      className="absolute bottom-36 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-xl flex items-center gap-1 z-20"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                      الرسائل الحديثة
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* Fast Reply Chips */}
                <div className="px-3 py-2 bg-gray-100/60 dark:bg-gray-900/60 border-t border-gray-200 dark:border-gray-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 shrink-0 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> رد سريع:
                  </span>
                  {QUICK_REPLIES.map((reply, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickReply(reply)}
                      className="px-3 py-1 rounded-full bg-white dark:bg-gray-800 hover:bg-emerald-500 hover:text-white text-gray-700 dark:text-gray-300 text-xs font-medium border border-gray-200 dark:border-gray-700 shrink-0 transition-all shadow-sm"
                    >
                      {reply}
                    </button>
                  ))}
                </div>

                {/* Selected Image Preview Box */}
                {imagePreviewUrl && (
                  <div className="p-3 bg-emerald-950/20 border-t border-emerald-500/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img src={imagePreviewUrl} alt="" className="w-12 h-12 rounded-xl object-cover border border-emerald-500" />
                      <div>
                        <p className="text-xs font-bold text-emerald-400">تم اختيار صورة للإرسال</p>
                        <p className="text-[10px] text-gray-400">انقر إرسال للمشاركة بداخل الشات</p>
                      </div>
                    </div>
                    <button
                      onClick={cancelImagePreview}
                      className="p-1.5 rounded-xl bg-gray-800 text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Input Bar */}
                <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 relative">
                  
                  {/* Emoji Picker Popover */}
                  <AnimatePresence>
                    {showEmoji && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-full right-3 z-30 mb-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden"
                      >
                        <div className="p-2 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-900 dark:text-white">اختر إيموجي</span>
                          <button onClick={() => setShowEmoji(false)} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="max-h-60 overflow-y-auto p-2 space-y-2">
                          {Object.entries(EMOJI_DATA).map(([cat, emojis]) => (
                            <div key={cat}>
                              <span className="text-[10px] font-bold text-gray-400">{cat}</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {emojis.map((em, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => { setNewMessage((prev) => prev + em); inputRef.current?.focus(); }}
                                    className="w-8 h-8 text-base rounded-lg hover:bg-emerald-500/20 flex items-center justify-center transition-colors"
                                  >
                                    {em}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowEmoji(!showEmoji)}
                      className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-emerald-500 transition-colors"
                      title="إيموجي"
                    >
                      <Smile className="w-5 h-5" />
                    </button>

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-emerald-500 transition-colors disabled:opacity-50"
                      title="إرفاق صورة"
                    >
                      {uploadingImage ? <Loader2 className="w-5 h-5 animate-spin text-emerald-500" /> : <ImageIcon className="w-5 h-5" />}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileSelect}
                    />

                    <input
                      ref={inputRef}
                      type="text"
                      value={newMessage}
                      onChange={handleInputChange}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                      placeholder="اكتب رسالتك هنا..."
                      className="flex-1 px-4 py-2.5 rounded-2xl bg-gray-100 dark:bg-gray-800 text-xs sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none border border-transparent focus:border-emerald-500 transition-all"
                    />

                    <button
                      onClick={handleSend}
                      disabled={sending || (!newMessage.trim() && !selectedImageFile)}
                      className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all flex items-center gap-1.5"
                    >
                      {sending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <span>إرسال</span>
                          <Send className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center p-8 bg-gray-50/50 dark:bg-gray-950/50">
                <div className="text-center max-w-sm">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/20">
                    <MessageCircle className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white mb-1">مركز الرسائل والمحادثات 🇯🇴</h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-4">
                    حدد أي محادثة من القائمة الجانبية لبدء التواصل المباشر مع البائع أو المشتري بالتفاوض على أسعار السيارات!
                  </p>
                  <Link
                    href="/cars"
                    className="btn btn-emerald px-5 py-2.5 text-xs font-bold shadow-lg shadow-emerald-600/20 inline-flex items-center gap-2"
                  >
                    <Car className="w-4 h-4" /> استكشاف السيارات المتاحة
                  </Link>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {viewerImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setViewerImage(null)}
          >
            <button
              onClick={() => setViewerImage(null)}
              className="absolute top-4 left-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={viewerImage}
              alt=""
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
