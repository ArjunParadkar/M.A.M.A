'use client';

import { useEffect, useRef, useState } from 'react';
import { DEMO_MODE } from '@/lib/demoData';

type Msg = {
  id: string;
  job_id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
  sender_name?: string;
};

export default function JobMessages({ jobId }: { jobId: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      if (DEMO_MODE) {
        // For demo mode, use localStorage for messages
        const stored = localStorage.getItem(`demo_messages_${jobId}`);
        const demoMessages = stored ? JSON.parse(stored) : [];
        setMessages(demoMessages);
      } else {
        const res = await fetch(`/api/jobs/${jobId}/messages`);
        const data = await res.json();
        if (data.error) {
          setError(data.error);
          setMessages([]);
        } else {
          setMessages(data.messages || []);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load messages');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [jobId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    setError(null);
    try {
      if (DEMO_MODE) {
        // For demo mode, save to localStorage
        const newMessage: Msg = {
          id: `demo_msg_${Date.now()}`,
          job_id: jobId,
          sender_id: 'reva_demo_id', // Will be current user in real system
          recipient_id: 'arham_demo_id',
          body: text.trim(),
          created_at: new Date().toISOString(),
          sender_name: 'Reva',
        };
        const stored = localStorage.getItem(`demo_messages_${jobId}`);
        const existing = stored ? JSON.parse(stored) : [];
        const updated = [...existing, newMessage];
        localStorage.setItem(`demo_messages_${jobId}`, JSON.stringify(updated));
        setMessages(updated);
        setText('');
      } else {
        const res = await fetch(`/api/jobs/${jobId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: text.trim() }),
        });
        const data = await res.json();
        if (data.error) {
          setError(data.error);
        } else {
          setText('');
          await load();
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-[#0a1929] border border-[#1a2332] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold heading-font">Messages</h3>
        <button
          onClick={load}
          className="text-[#9ca3af] hover:text-white text-sm underline"
        >
          Refresh
        </button>
      </div>

      <div className="bg-[#1a2332] border border-[#253242] h-64 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="text-[#9ca3af] text-sm">Loading...</div>
        ) : error ? (
          <div className="text-red-400 text-sm">
            {error}
            {DEMO_MODE && (
              <div className="text-[#9ca3af] text-xs mt-2">Using demo mode messaging (localStorage)</div>
            )}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-[#9ca3af] text-sm">No messages yet. Start the conversation!</div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="border border-[#253242] p-3 bg-[#0a1929]">
              <div className="flex justify-between items-center mb-1">
                <div className="text-[#9ca3af] text-xs font-medium">
                  {m.sender_name || (m.sender_id === 'reva_demo_id' ? 'Reva' : 'Client')}
                </div>
                <div className="text-[#9ca3af] text-xs">
                  {new Date(m.created_at).toLocaleString()}
                </div>
              </div>
              <div className="text-white text-sm whitespace-pre-wrap">{m.body}</div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-3 mt-4">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message..."
          className="flex-1 bg-[#1a2332] border border-[#253242] text-white px-4 py-2 text-sm focus:outline-none focus:border-[#3a4552]"
        />
        <button
          disabled={sending || !text.trim()}
          onClick={send}
          className="bg-[#253242] hover:bg-[#3a4552] text-white px-4 py-2 border border-[#3a4552] transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}


