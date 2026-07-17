'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, Send, ChevronLeft, Eye, Search, Smile, CheckCheck, Check,
  ArrowDown, Image as ImageIcon, X, Loader2
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { getSocket } from '@/lib/socket';
import type { Conversation, Message } from '@/types';
import toast from 'react-hot-toast';

const EMOJI_DATA: Record<string, string[]> = {
  'الوجوه': ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🥵','🥶','🥴','😵','🤯','🤠','🥳','🥸','😎','🤓','🧐','😕','😟','🙁','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖'],
  'اليدان': ['👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏'],
  'الحيوانات': ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🪲','🪳','🦟','🦗','🕷️','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊'],
  'الطعام': ['🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🥑','🍆','🥔','🥕','🌽','🌶️','🫑','🥒','🥬','🥦','🧄','🧅','🍄','🥜','🫘','🌰','🍞','🥐','🥖','🫓','🥨','🥯','🥞','🧇','🧀','🍖','🍗','🥩','🥓','🍔','🍟','🍕','🌭','🥪','🌮','🌯','🫔','🥙','🧆','🥚','🍳','🥘','🍲','🫕','🥣','🥗','🍿','🧈','🧂','🥫'],
  'الرياضة': ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🥅','⛳','🪁','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛼','🛷','⛸️','🥌','🎿','🎯','🪃','🏆','🥇','🥈','🥉','🏅','🎖️','🏵️','🎗️','🎫','🎟️','🎪'],
  'السفر': ['🚗','🚕','🚌','🏎️','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🛵','🏍️','🛺','🚲','🛴','🛹','🛼','🚁','✈️','🛩️','🚀','🛸','🚢','⛵','🚤','🛥️','🏠','🏡','🏢','🏣','🏤','🏥','🏦','🏨','🏩','🏪','🏫','🏬','🏭','🏯','🏰'],
  'الرموز': ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉️','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','🆔','⚛️','🉑','☢️','☣️','📴','📳','🈶','🈚','🈸','🈺','🈷️','✴️','🆚','💮','🉐','㊙️','㊗️','🈴','🈵','🈹','🈲','🅰️','🅱️','🆎','🆑','🅾️','🆘','❌','⭕','🛑','⛔','📛','🚫','💯','💢','♨️','🚷','🚯','🚳','🚱','🔞','📵','🚭'],
  'الأجسام': ['👀','👁️','👅','👄','💋','🩸','👂','🦻','👃','🧠','🦷','🦴','🦵','🦶','🫀','🫁','💪','🫶'],
};

export default function MessagesContent() {
  const { user, isAuthenticated } = useAuth();
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
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
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
      if (data.success) { setMessages(data.data || []); return true; }
      return false;
    } catch { return false; }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
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
  }, [isAuthenticated, router, fetchConversations, fetchMessages, convIdParam]);

  useEffect(() => {
    const socket = getSocket(user?.id);
    const onOnline = (data: { userId: string }) => setOnlineUsers((prev) => new Set(prev).add(data.userId));
    const onOffline = (data: { userId: string }) => setOnlineUsers((prev) => { const n = new Set(prev); n.delete(data.userId); return n; });
    socket.on('user-online', onOnline);
    socket.on('user-offline', onOffline);
    conversations.forEach((conv) => {
      const otherId = conv.buyerId === user?.id ? conv.sellerId : conv.buyerId;
      if (otherId) socket.emit('check-online', otherId);
    });
    socket.on('user-status', (data: { userId: string; online: boolean }) => {
      setOnlineUsers((prev) => { const n = new Set(prev); if (data.online) n.add(data.userId); else n.delete(data.userId); return n; });
    });
    return () => { socket.off('user-online', onOnline); socket.off('user-offline', onOffline); socket.off('user-status'); };
  }, [user?.id, conversations]);

  const scrollToBottom = (smooth = true) => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' }), 100);
  };
  useEffect(() => { scrollToBottom(false); }, [messages]);

  const handleScroll = () => {
    const container = chatContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 200);
  };

  useEffect(() => {
    const socket = getSocket(user?.id);
    const onMsg = (data: Message) => {
      if (activeConv && data.conversationId === activeConv.id) {
        setMessages((prev) => { if (prev.some((m) => m.id === data.id)) return prev; return [...prev, data]; });
        scrollToBottom();
      }
      fetchConversations();
    };
    const onTyping = (data: { userId: string }) => setTypingUsers((prev) => new Set(prev).add(data.userId));
    const onStopTyping = () => setTypingUsers(new Set());
    socket.on('message-received', onMsg);
    socket.on('user-typing', onTyping);
    socket.on('user-stop-typing', onStopTyping);
    return () => { socket.off('message-received', onMsg); socket.off('user-typing', onTyping); socket.off('user-stop-typing', onStopTyping); };
  }, [activeConv, fetchConversations, user?.id]);

  useEffect(() => {
    const socket = getSocket(user?.id);
    if (activeConv) socket.emit('join-conversation', activeConv.id);
    return () => { if (activeConv) socket.emit('leave-conversation', activeConv.id); };
  }, [activeConv?.id, user?.id]);

  const openConversation = async (conv: Conversation) => {
    setActiveConv(conv);
    setShowList(false);
    await fetchMessages(conv.id);
    scrollToBottom(false);
    setTimeout(() => inputRef.current?.focus(), 200);
  };

  const emitTyping = (isTyping: boolean) => {
    const socket = getSocket(user?.id);
    if (!activeConv) return;
    if (isTyping) socket.emit('typing', { conversationId: activeConv.id, userId: user?.id });
    else socket.emit('stop-typing', { conversationId: activeConv.id });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (!typingTimeoutRef.current) emitTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => { emitTyping(false); typingTimeoutRef.current = null; }, 1500);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConv) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadData.success) { toast.error('فشل رفع الصورة'); return; }
      const imageUrl = uploadData.data?.url;
      if (imageUrl) {
        const caption = newMessage.trim();
        const content = caption ? `IMG:${imageUrl}\n${caption}` : `IMG:${imageUrl}`;
        setNewMessage('');
        await sendMessage(content);
      }
    } catch { toast.error('فشل رفع الصورة'); }
    finally { setUploadingImage(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
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
        body: JSON.stringify({ content: finalContent, receiverId, carId: activeConv.carId, conversationId: activeConv.id }),
      });
      const data = await res.json();
      if (data.success) {
        const socket = getSocket(user?.id);
        socket.emit('new-message', { ...data.data, conversationId: activeConv.id });
        setMessages((prev) => [...prev, data.data]);
        fetchConversations();
        scrollToBottom();
      } else {
        toast.error('فشل الإرسال');
        setNewMessage(finalContent);
      }
    } catch {
      toast.error('فشل الإرسال');
      setNewMessage(finalContent);
    } finally { setSending(false); }
  };

  const handleSend = () => {
    if (!newMessage.trim()) return;
    sendMessage(newMessage);
  };

  if (!isAuthenticated) return null;

  const otherParticipant = (conv: Conversation) => conv.buyerId === user?.id ? conv.seller : conv.buyer;
  const isUserOnline = (userId?: string) => userId ? onlineUsers.has(userId) : false;

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const other = otherParticipant(conv);
    const q = searchQuery.toLowerCase();
    return other?.name?.toLowerCase().includes(q) || conv.car?.brand?.nameAr?.includes(q) || conv.car?.model?.nameAr?.includes(q);
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
    if (imageUrl) return '📷 صورة';
    return msg.content;
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center" style={{ backgroundColor: '#1a1b26' }}>
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-[#0084ff] border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-gray-400">جاري تحميل المحادثات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container-custom max-w-[1400px] mx-auto">
        <div className="rounded-none md:rounded-2xl overflow-hidden shadow-2xl" style={{ backgroundColor: '#18191a', height: '100vh' }}>
          <div className="flex h-full">

            {/* Sidebar */}
            <div className={`border-l border-[#3a3b3c]/50 flex flex-col ${showList ? 'flex' : 'hidden md:flex'}`}
              style={{ width: '360px', minWidth: '360px', backgroundColor: '#18191a' }}>
              <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #3a3b3c' }}>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">الرسائل</h2>
                  {unreadTotal > 0 && (
                    <span className="px-2 py-0.5 bg-[#0084ff] text-white text-xs font-bold rounded-full">{unreadTotal}</span>
                  )}
                </div>
              </div>
              <div className="px-3 py-2">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b0b3b8]" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="بحث في المحادثات..."
                    className="w-full pr-9 pl-4 py-2 rounded-full text-sm outline-none placeholder:text-[#b0b3b8]"
                    style={{ backgroundColor: '#3a3b3c', color: '#e4e6eb' }} />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#3a3b3c' }}>
                      <MessageCircle className="w-7 h-7 text-[#b0b3b8]" />
                    </div>
                    <p className="text-sm font-medium text-[#b0b3b8]">لا توجد محادثات</p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const other = otherParticipant(conv);
                    const isActive = activeConv?.id === conv.id;
                    const hasUnread = (conv.unreadCount || 0) > 0;
                    const otherOnline = isUserOnline(other?.id);
                    return (
                      <button key={conv.id} onClick={() => openConversation(conv)}
                        className="w-full text-right px-3 py-2.5 flex items-center gap-3 transition-colors duration-150"
                        style={{
                          backgroundColor: isActive ? '#0084ff' : 'transparent',
                          borderRight: hasUnread && !isActive ? '3px solid #0084ff' : '3px solid transparent',
                        }}
                        onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = '#3a3b3c'; }}
                        onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                        <div className="relative flex-shrink-0">
                          <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold"
                            style={{ backgroundColor: other?.image ? 'transparent' : '#0084ff' }}>
                            {other?.image ? (
                              <img src={other.image} alt="" className="w-14 h-14 rounded-full object-cover" />
                            ) : (other?.name?.charAt(0) || 'U')}
                          </div>
                          {otherOnline && (
                            <div className="absolute bottom-0 right-0 w-4 h-4 bg-[#31a24c] rounded-full border-[3px]" style={{ borderColor: '#18191a' }} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <p className="text-[15px] truncate" style={{ color: hasUnread ? '#ffffff' : '#e4e6eb', fontWeight: hasUnread ? '700' : '400' }}>
                              {other?.name}
                            </p>
                            {conv.lastMessage && (
                              <span className="text-xs flex-shrink-0 ml-2" style={{ color: hasUnread ? '#0084ff' : '#b0b3b8' }}>
                                {getTimeLabel(String(conv.lastMessage.createdAt))}
                              </span>
                            )}
                          </div>
                          <p className="text-[13px] truncate" style={{ color: hasUnread ? '#e4e6eb' : '#b0b3b8', fontWeight: hasUnread ? '600' : '400' }}>
                            {getLastMsgPreview(conv.lastMessage)}
                          </p>
                          {conv.car && (
                            <div className="mt-1">
                              <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : '#3a3b3c', color: isActive ? '#fff' : '#b0b3b8' }}>
                                🚗 {conv.car.brand?.nameAr} {conv.car.model?.nameAr}
                              </span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col ${!showList ? 'flex' : 'hidden md:flex'}`} style={{ backgroundColor: '#242526' }}>
              {activeConv ? (
                <>
                  {/* Header */}
                  <div className="px-4 py-2.5 flex items-center gap-3" style={{ backgroundColor: '#242526', borderBottom: '1px solid #3a3b3c' }}>
                    <button className="md:hidden p-1.5 rounded-lg" style={{ color: '#0084ff' }} onClick={() => setShowList(true)}>
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="relative cursor-pointer" onClick={() => router.push(`/profile/${otherParticipant(activeConv)?.id}`)}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: otherParticipant(activeConv)?.image ? 'transparent' : '#0084ff' }}>
                        {otherParticipant(activeConv)?.image ? (
                          <img src={otherParticipant(activeConv)?.image || ''} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (otherParticipant(activeConv)?.name?.charAt(0) || 'U')}
                      </div>
                      {isUserOnline(otherParticipant(activeConv)?.id) && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#31a24c] rounded-full border-2" style={{ borderColor: '#242526' }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-white truncate">{otherParticipant(activeConv)?.name}</p>
                      <p className="text-xs" style={{ color: isUserOnline(otherParticipant(activeConv)?.id) ? '#31a24c' : '#b0b3b8' }}>
                        {isUserOnline(otherParticipant(activeConv)?.id) ? 'متصل الآن' : 'غير متصل'}
                      </p>
                    </div>
                    {activeConv.car && (
                      <button onClick={() => router.push(`/cars/${activeConv.car?.slug || activeConv.carId}`)}
                        className="p-2 rounded-lg" style={{ color: '#0084ff' }} title="عرض السيارة">
                        <Eye className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {/* Messages */}
                  <div ref={chatContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-3" style={{ backgroundColor: '#242526' }}>
                    <div dir="rtl" className="space-y-1">
                      {messages.length > 0 && (
                        <div className="text-center py-3 mb-2">
                          <span className="text-[11px] px-3 py-1 rounded-full" style={{ backgroundColor: '#3a3b3c', color: '#b0b3b8' }}>بداية المحادثة</span>
                        </div>
                      )}

                      {(() => {
                        let lastDate = '';
                        return messages.map((msg, i) => {
                          const isMine = msg.senderId === user?.id;
                          const msgDate = new Date(msg.createdAt).toLocaleDateString('ar-JO');
                          const showDate = msgDate !== lastDate;
                          if (showDate) lastDate = msgDate;
                          const showTimeSepar = i === 0 || (new Date(msg.createdAt).getTime() - new Date(messages[i - 1].createdAt).getTime() > 300000);

                          const { imageUrl, text } = parseMessageContent(msg.content);

                          return (
                            <div key={msg.id}>
                              {showDate && (
                                <div className="text-center py-2">
                                  <span className="text-[11px] px-3 py-1 rounded-full" style={{ backgroundColor: '#3a3b3c', color: '#b0b3b8' }}>
                                    {new Date(msg.createdAt).toLocaleDateString('ar-JO', { weekday: 'long', month: 'short', day: 'numeric' })}
                                  </span>
                                </div>
                              )}
                              <div className={`flex ${isMine ? 'justify-start' : 'justify-end'} ${showTimeSepar && i > 0 ? 'mt-3' : 'mt-0.5'}`}>
                                {!isMine && (
                                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold ml-2 mt-auto mb-0.5 flex-shrink-0"
                                    style={{ backgroundColor: otherParticipant(activeConv)?.image ? 'transparent' : '#0084ff' }}>
                                    {otherParticipant(activeConv)?.image ? (
                                      <img src={otherParticipant(activeConv)?.image || ''} alt="" className="w-7 h-7 rounded-full object-cover" />
                                    ) : (otherParticipant(activeConv)?.name?.charAt(0) || 'U')}
                                  </div>
                                )}
                                <div className={`max-w-[65%] flex flex-col`}>
                                  {showTimeSepar && i > 0 && (
                                    <span className="text-[10px] text-center w-full mb-1" style={{ color: '#b0b3b8' }}>
                                      {new Date(msg.createdAt).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  )}

                                  {imageUrl ? (
                                    <div className="mb-1">
                                      <img src={imageUrl} alt=""
                                        className="max-w-[280px] max-h-[300px] rounded-xl cursor-pointer hover:opacity-90 transition-opacity shadow-lg object-cover"
                                        onClick={() => setViewerImage(imageUrl)} />
                                      {text && (
                                        <div className="mt-1 px-3 py-2 rounded-2xl text-[15px] leading-relaxed" style={{
                                          backgroundColor: isMine ? '#0084ff' : '#3a3b3c', color: '#e4e6eb',
                                          borderBottomRightRadius: isMine ? '4px' : '18px', borderBottomLeftRadius: isMine ? '18px' : '4px',
                                        }}>
                                          <p>{text}</p>
                                        </div>
                                      )}
                                    </div>
                                  ) : text ? (
                                    <div className="px-3 py-2 rounded-2xl text-[15px] leading-relaxed" style={{
                                      backgroundColor: isMine ? '#0084ff' : '#3a3b3c', color: '#e4e6eb',
                                      borderBottomRightRadius: isMine ? '4px' : '18px', borderBottomLeftRadius: isMine ? '18px' : '4px',
                                    }}>
                                      <p>{text}</p>
                                    </div>
                                  ) : null}

                                  <div className="flex items-center gap-1 mt-0.5 px-1">
                                    <span className="text-[10px]" style={{ color: '#b0b3b8' }}>
                                      {new Date(msg.createdAt).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {isMine && (
                                      <span style={{ color: msg.read ? '#0084ff' : '#b0b3b8' }}>
                                        {msg.read ? <CheckCheck className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}

                      {typingUsers.size > 0 && otherParticipant(activeConv)?.id && typingUsers.has(otherParticipant(activeConv).id) && (
                        <div className="flex justify-end mt-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold ml-2 flex-shrink-0"
                            style={{ backgroundColor: otherParticipant(activeConv)?.image ? 'transparent' : '#0084ff' }}>
                            {otherParticipant(activeConv)?.image ? (
                              <img src={otherParticipant(activeConv)?.image || ''} alt="" className="w-7 h-7 rounded-full object-cover" />
                            ) : (otherParticipant(activeConv)?.name?.charAt(0) || 'U')}
                          </div>
                          <div className="px-4 py-3 rounded-2xl" style={{ backgroundColor: '#3a3b3c', borderBottomLeftRadius: '4px' }}>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#b0b3b8', animationDelay: '0ms' }} />
                              <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#b0b3b8', animationDelay: '150ms' }} />
                              <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#b0b3b8', animationDelay: '300ms' }} />
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  </div>

                  {/* Scroll to bottom */}
                  <AnimatePresence>
                    {showScrollBtn && (
                      <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => scrollToBottom()}
                        className="absolute bottom-20 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center shadow-lg z-10"
                        style={{ backgroundColor: '#3a3b3c', color: '#e4e6eb', border: '1px solid #4e4f50' }}>
                        <ArrowDown className="w-4 h-4" />
                      </motion.button>
                    )}
                  </AnimatePresence>

                  {/* Input */}
                  <div className="relative">
                    {/* Emoji Picker */}
                    <AnimatePresence>
                      {showEmoji && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                          className="absolute bottom-full right-3 z-30 mb-2">
                          <div className="rounded-2xl shadow-2xl overflow-hidden" style={{ backgroundColor: '#18191a', border: '1px solid #3a3b3c', width: '340px' }}>
                            <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid #3a3b3c' }}>
                              <span className="text-sm font-bold text-white">إيموجي</span>
                              <button onClick={() => setShowEmoji(false)} className="p-1 rounded-lg hover:bg-[#3a3b3c] transition-colors" style={{ color: '#b0b3b8' }}>
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="overflow-y-auto" style={{ maxHeight: '320px' }}>
                              {Object.entries(EMOJI_DATA).map(([category, emojis]) => (
                                <div key={category} className="px-3 py-2">
                                  <p className="text-[11px] font-bold mb-1.5" style={{ color: '#b0b3b8' }}>{category}</p>
                                  <div className="flex flex-wrap gap-0.5">
                                    {emojis.map((emoji, idx) => (
                                      <button key={idx}
                                        className="w-9 h-9 flex items-center justify-center text-xl rounded-lg hover:bg-[#3a3b3c] transition-colors"
                                        onClick={() => { setNewMessage((prev) => prev + emoji); inputRef.current?.focus(); }}>
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="px-3 py-2.5 flex items-center gap-2" style={{ backgroundColor: '#242526', borderTop: '1px solid #3a3b3c' }}>
                      <button onClick={() => setShowEmoji(!showEmoji)} className="p-2 rounded-full flex-shrink-0 hover:bg-[#3a3b3c] transition-colors" style={{ color: '#0084ff' }}>
                        <Smile className="w-6 h-6" />
                      </button>
                      <button onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}
                        className="p-2 rounded-full flex-shrink-0 disabled:opacity-50 hover:bg-[#3a3b3c] transition-colors" style={{ color: '#0084ff' }}>
                        {uploadingImage ? <Loader2 className="w-6 h-6 animate-spin" /> : <ImageIcon className="w-6 h-6" />}
                      </button>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      <div className="flex-1 relative">
                        <input ref={inputRef} value={newMessage} onChange={handleInputChange}
                          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                          placeholder="Aa"
                          className="w-full rounded-full px-4 py-2.5 text-[15px] outline-none placeholder:text-[#b0b3b8]"
                          style={{ backgroundColor: '#3a3b3c', color: '#e4e6eb' }} />
                      </div>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={handleSend} disabled={sending || !newMessage.trim()}
                        className="p-2.5 rounded-full flex-shrink-0 transition-colors"
                        style={{ color: newMessage.trim() ? '#0084ff' : '#3a3b3c' }}>
                        {sending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                      </motion.button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center" style={{ backgroundColor: '#242526' }}>
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: '#3a3b3c' }}>
                      <MessageCircle className="w-12 h-12" style={{ color: '#0084ff' }} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">الرسائل</h3>
                    <p className="text-sm max-w-xs mx-auto" style={{ color: '#b0b3b8' }}>أرسل رسائل وصور لمن تريد</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Full-screen image viewer */}
      <AnimatePresence>
        {viewerImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}
            onClick={() => setViewerImage(null)}>
            <button className="absolute top-4 left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-50"
              onClick={() => setViewerImage(null)}>
              <X className="w-6 h-6 text-white" />
            </button>
            <img src={viewerImage} alt="" className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
