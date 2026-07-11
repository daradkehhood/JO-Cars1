'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { MessageCircle, Send, ChevronLeft, Eye } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { getSocket } from '@/lib/socket';
import type { Conversation, Message } from '@/types';
import toast from 'react-hot-toast';

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
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const startedRef = useRef(false);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/conversations');
      const data = await res.json();
      if (data.success) setConversations(data.data || []);
    } catch {}
  }, []);

  const fetchMessages = useCallback(async (convId: string) => {
    try {
      const res = await fetch(`/api/conversations/${convId}/messages`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.data || []);
        setActiveConv((prev) => prev ? { ...prev, unreadCount: 0 } : prev);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    fetchConversations().finally(() => setLoading(false));
  }, [isAuthenticated, router, fetchConversations]);

  useEffect(() => {
    if (startedRef.current) return;
    const convId = searchParams.get('conversationId');
    if (convId && conversations.length > 0) {
      const found = conversations.find((c) => c.id === convId);
      if (found) {
        startedRef.current = true;
        setActiveConv(found);
        setShowList(false);
        fetchMessages(convId);
      }
    }
  }, [searchParams, conversations, fetchMessages]);

  const scrollToBottom = () => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    const socket = getSocket();
    socket.on('message-received', (data: Message) => {
      if (activeConv && data.conversationId === activeConv.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev;
          return [...prev, data];
        });
        scrollToBottom();
      }
      fetchConversations();
    });
    return () => { socket.off('message-received'); };
  }, [activeConv, fetchConversations]);

  useEffect(() => {
    const socket = getSocket();
    if (activeConv) {
      socket.emit('join-conversation', activeConv.id);
    }
    return () => {
      if (activeConv) {
        socket.emit('leave-conversation', activeConv.id);
      }
    };
  }, [activeConv?.id]);

  const openConversation = async (conv: Conversation) => {
    setActiveConv(conv);
    setShowList(false);
    await fetchMessages(conv.id);
    scrollToBottom();
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !activeConv || sending) return;
    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');

    const receiverId = activeConv.buyerId === user?.id ? activeConv.sellerId : activeConv.buyerId;

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, receiverId, carId: activeConv.carId, conversationId: activeConv.id }),
      });
      const data = await res.json();
      if (data.success) {
        const socket = getSocket();
        socket.emit('new-message', { ...data.data, conversationId: activeConv.id });
        setMessages((prev) => [...prev, data.data]);
        fetchConversations();
      } else {
        toast.error('فشل الإرسال');
        setNewMessage(content);
      }
    } catch {
      toast.error('فشل الإرسال');
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  if (!isAuthenticated) return null;

  const otherParticipant = (conv: Conversation) =>
    conv.buyerId === user?.id ? conv.seller : conv.buyer;

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] py-4">
      <div className="container-custom max-w-6xl">
        <div className="card overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-5 min-h-[80vh]">
            <div className={`md:col-span-1 border-l border-gray-100 dark:border-gray-800 ${showList ? 'block' : 'hidden md:block'}`}>
              <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                <h2 className="font-bold text-gray-900 dark:text-white">المحادثات</h2>
              </div>
              {conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageCircle className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">لا توجد محادثات</p>
                </div>
              ) : (
                <div className="overflow-y-auto max-h-[65vh]">
                  {conversations.map((conv) => {
                    const other = otherParticipant(conv);
                    const isActive = activeConv?.id === conv.id;
                    return (
                      <button key={conv.id} onClick={() => openConversation(conv)}
                        className={`w-full text-right p-4 border-b border-gray-50 dark:border-gray-800/50 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30 ${isActive ? 'bg-blue-50 dark:bg-blue-500/5' : ''}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {other?.name?.charAt(0) || 'U'}
                          </div>
                          <div className="flex-1 min-w-0 text-right">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{other?.name}</p>
                              {conv.lastMessage && (
                                <span className="text-[10px] text-gray-400 whitespace-nowrap">{formatDate(conv.lastMessage.createdAt)}</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 truncate mt-0.5">{conv.lastMessage?.content || 'اضغط لبدء المحادثة'}</p>
                          </div>
                          {(conv.unreadCount || 0) > 0 && (
                            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                              <span className="text-[10px] text-white font-bold">{conv.unreadCount}</span>
                            </div>
                          )}
                        </div>
                        {conv.car && (
                          <p className="text-[11px] text-gray-400 mt-1.5 pr-[52px] truncate">بخصوص: {conv.car.slug}</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className={`md:col-span-4 flex flex-col ${!showList ? 'block' : 'hidden md:block'}`}>
              {activeConv ? (
                <>
                  <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
                    <button className="md:hidden" onClick={() => setShowList(true)}>
                      <ChevronLeft className="w-5 h-5 text-gray-500" />
                    </button>
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                      {otherParticipant(activeConv)?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{otherParticipant(activeConv)?.name}</p>
                      {activeConv.car && (
                        <p className="text-xs text-gray-500 truncate">بخصوص: {activeConv.car.price} د.أ</p>
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
                        const isMine = msg.senderId === user?.id;
                        const isAdminMsg = msg.sender?.role === 'ADMIN';
                        let bubbleClass = 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-tl-sm';
                        if (isAdminMsg) {
                          bubbleClass = 'bg-red-500 text-white rounded-tr-sm';
                        } else if (isMine) {
                          bubbleClass = 'bg-blue-500 text-white rounded-tr-sm';
                        }
                        return (
                          <div key={msg.id} className={`flex ${isMine || isAdminMsg ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${bubbleClass}`}>
                              {isAdminMsg && <div className="text-[10px] opacity-60 mb-1">الإدارة</div>}
                              {msg.content}
                              <div className={`flex items-center gap-1.5 mt-1 ${isMine || isAdminMsg ? 'justify-end' : 'justify-start'}`}>
                                <span className="text-[10px] opacity-70">{formatDate(msg.createdAt)}</span>
                                {isMine && <span className="text-[10px] opacity-70">{msg.read ? '✓✓' : '✓'}</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={chatEndRef} />
                    </div>
                  </div>

                  <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                      <input ref={inputRef} value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                        placeholder="اكتب رسالتك..."
                        className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-2.5 text-sm outline-none focus:border-blue-500" />
                      <Button onClick={handleSend} disabled={sending || !newMessage.trim()} icon={<Send className="w-4 h-4" />}>إرسال</Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center p-8">
                  <div className="text-center">
                    <MessageCircle className="w-14 h-14 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">اختر محادثة من القائمة</p>
                    <p className="text-xs text-gray-400 mt-1">أو ابدأ محادثة جديدة من صفحة السيارة</p>
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
