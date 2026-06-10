import { useState, useRef, useEffect, useCallback } from 'react';
import { streamChat } from '@/api/client';
import { getGreeting } from '@/api/coach';
import type { ChatMessage, ToolCallInfo, SSEEvent } from '@/types/coach';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import ToolCallCard from './ToolCallCard';

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const [pendingTools, setPendingTools] = useState<ToolCallInfo[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    getGreeting().then((res) => {
      if (res.should_greet && res.message) {
        setMessages([
          {
            id: 'greeting',
            role: 'assistant',
            content: res.message,
            timestamp: Date.now(),
          },
        ]);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, streamContent, pendingTools]);

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  const handleSend = useCallback(async (text: string) => {
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setStreaming(true);
    setStreamContent('');
    setPendingTools([]);

    const controller = new AbortController();
    abortRef.current = controller;

    let content = '';
    const tools: ToolCallInfo[] = [];

    const onEvent = (event: SSEEvent) => {
      switch (event.type) {
        case 'token':
          content += event.content;
          setStreamContent(content);
          break;
        case 'tool_call':
          tools.push({ name: event.name, args: event.args, status: 'calling' });
          setPendingTools([...tools]);
          break;
        case 'tool_result': {
          const tc = tools.find((t) => t.name === event.name && t.status === 'calling');
          if (tc) {
            tc.status = 'done';
            tc.result = event.content;
          }
          setPendingTools([...tools]);
          break;
        }
        case 'done': {
          const assistantMsg: ChatMessage = {
            id: `a-${event.message_id}`,
            role: 'assistant',
            content,
            toolCalls: tools.length > 0 ? [...tools] : undefined,
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
          content = '';
          setStreamContent('');
          setPendingTools([]);
          break;
        }
        case 'stream_end':
          setStreaming(false);
          break;
      }
    };

    try {
      await streamChat(text, 'default', onEvent, controller.signal);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setStreaming(false);
      const errorMsg: ChatMessage = {
        id: `e-${Date.now()}`,
        role: 'assistant',
        content: '连接出错，请检查后端服务是否启动。',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 pt-3 pb-3 space-y-3">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {streaming && streamContent && (
          <div className="flex justify-start">
            <div className="max-w-[80%]">
              <div className="px-4 py-3 rounded-2xl rounded-bl-none text-sm leading-relaxed bg-surface text-primary whitespace-pre-wrap">
                {streamContent}
                <span className="inline-block w-1.5 h-4 bg-accent animate-pulse ml-0.5 align-middle" />
              </div>
            </div>
          </div>
        )}
        {pendingTools.length > 0 && (
          <div className="mb-3 ml-1 space-y-1">
            {pendingTools.map((tc, i) => (
              <ToolCallCard key={i} toolCall={tc} />
            ))}
          </div>
        )}
      </div>
      <ChatInput onSend={handleSend} disabled={streaming} />
    </div>
  );
}
