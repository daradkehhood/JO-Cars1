'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { MessageCircle, Send, Eye, ChevronLeft, Search, Shield } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { getSocket } from '@/lib/socket';
import type { Conversation, Message } from '@/types';
import toast from 'react-hot-toast';

export default function AdminMessagesPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filtered, setFiltered] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [search, setSearch] = useState('');
  const [showList, setShowList] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') { router.push('/'); return; }
    fetch('/api/admin/conversations')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setConversations(data.data || []);
          setFiltered(data.data || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (search.trim()) {
      const q = search.toLowerCase();
      setFiltered(
        conversations.filter(
          (c) =>
            c.buyer?.name?.toLowerCase().includes(q) ||
            c.seller?.name?.toLowerCase().includes(q) ||
            c.car?.slug?.toLowerCase().includes(q)
        )
      );
    } else {
      setFiltered(conversations);
    }
  }, [search, conversations]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const socket = getSocket();
    socket.on('message-received', (data: Message) => {
      if (activeConv && data.conversationId === activeConv.id) {
        setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data]));
      }
      fetch('/api/admin/conversations')
        .then((r) => r.json())
        .then((d) => { if (d.success) { setConversations(d.data); setFiltered(d.data); } });
    });
    return () => { socket.off('message-received'); };
  }, [activeConv]);

  const openConversation = async (conv: Conversation) => {
    setActiveConv(conv);
    setShowList(false);
    try {
      const res = await fetch(`/api/admin/conversations/${conv.id}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.data.messages || []);
      }
    } catch {}
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !activeConv) return;
    const content = newMessage.trim();
    setNewMessage('');
    try {
      const res = await fetch(`/api/admin/conversations/${activeConv.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (data.success) {
        const socket = getSocket();
        socket.emit('new-message', { ...data.data, conversationId: activeConv.id });
        setMessages((prev) => [...prev, data.data]);
        toast.success('تم الإرسال');
      } else {
        toast.error('فشل الإرسال');
        setNewMessage(content);
      }
    } catch {
      toast.error('فشل الإرسال');
      setNewMessage(content);
    }
  };

  if (!isAuthenticated || user?.role !== 'ADMIN') return null;

  return (
    <div className="min-h-[80vh] py-4">
      <div className="container-custom max-w-6xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">الرسائل (الإدارة)</h1>
        </div>

        <div className="card overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-5 min-h-[80vh]">
            {/* Conversations List */}
            <div className={`md:col-span-1 border-l border-gray-100 dark:border-gray-800 ${showList ? 'block' : 'hidden md:block'}`}>
              <div className="p-4 border-b border-gray-100 dark:border-gray-800 space-y-3">
                <h2 className="font-bold text-gray-900 dark:text-white">جميع المحادثات</h2>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="بحث..."
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 pr-9 pl-3 py-2 text-sm outline-none focus:border-purple-500"
                  />
                </div>
              </div>
              {loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">لا توجد محادثات</p>
                </div>
              ) : (
                <div className="overflow-y-auto max-h-[65vh]">
                  {filtered.map((conv) => {
                    const isActive = activeConv?.id === conv.id;
                    return (
                      <button
                        key={conv.id}
                        onClick={() => openConversation(conv)}
                        className={`w-full text-right p-4 border-b border-gray-50 dark:border-gray-800/50 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30 ${isActive ? 'bg-purple-50 dark:bg-purple-500/5' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {conv.buyer?.name?.charAt(0) || 'U'}
                          </div>
                          <div className="flex-1 min-w-0 text-right">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {conv.buyer?.name} ← {conv.seller?.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate mt-0.5">
                              {conv.lastMessage?.content || 'لا توجد رسائل'}
                            </p>
                          </div>
                          <span className="text-[10px] text-gray-400 whitespace-nowrap">
                            {conv.lastMessage ? formatDate(conv.lastMessage.createdAt) : ''}
                          </span>
                        </div>
                        {conv.car && (
                          <div className="flex items-center gap-1.5 mt-1.5 pr-[52px]">
                            <Shield className="w-3 h-3 text-gray-400" />
                            <span className="text-[11px] text-gray-400 truncate">{conv.car.slug}</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Chat Area */}
            <div className={`md:col-span-4 flex flex-col ${!showList ? 'block' : 'hidden md:block'}`}>
              {activeConv ? (
                <>
                  <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
                    <button className="md:hidden" onClick={() => setShowList(true)}>
                      <ChevronLeft className="w-5 h-5 text-gray-500" />
                    </button>
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                      {activeConv.buyer?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {activeConv.buyer?.name} مع {activeConv.seller?.name}
                      </p>
                      {activeConv.car && (
                        <p className="text-xs text-gray-500">السيارة: {activeConv.car.slug}</p>
                      )}
                    </div>
                    {activeConv.car && (
                      <button onClick={() => router.push(`/cars/${activeConv.car?.slug || activeConv.carId}`)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                        <Eye className="w-4 h-4 text-gray-400" />
                      </button>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[70vh] max-h-[80vh]">
                    <div dir="rtl" className="space-y-3">
                      {messages.map((msg) => {
                        const isAdmin = msg.senderId === user?.id;
                        const isBuyer = msg.senderId === activeConv.buyerId;
                        return (
                          <div key={msg.id} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${isAdmin
                                ? 'bg-red-500 text-white rounded-tr-sm'
                                : isBuyer
                                  ? 'bg-blue-100 dark:bg-blue-500/10 text-gray-700 dark:text-gray-300 rounded-tl-sm'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-tl-sm'
                              }`}>
                              <div className="text-[10px] opacity-60 mb-1">
                                {isAdmin ? 'الإدارة' : isBuyer ? activeConv.buyer?.name : activeConv.seller?.name}
                              </div>
                              {msg.content}
                              <div className="text-[10px] opacity-70 mt-1">{formatDate(msg.createdAt)}</div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={chatEndRef} />
                    </div>
                  </div>

                  <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                      <input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                        placeholder="اكتب رداً من الإدارة..."
                        className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-2.5 text-sm outline-none focus:border-purple-500"
                      />
                      <Button onClick={handleSend} disabled={!newMessage.trim()} icon={<Send className="w-4 h-4" />}>
                        إرسال
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center p-8">
                  <div className="text-center">
                    <MessageCircle className="w-14 h-14 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">اختر محادثة من القائمة</p>
                    <p className="text-xs text-gray-400 mt-1">يمكنك مشاهدة ومشاركة أي محادثة</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
