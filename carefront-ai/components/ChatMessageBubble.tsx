import React from 'react';
import { ChatMessage, Sender } from '../types';
import { User, Bot } from 'lucide-react';

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ message }) => {
  const isBot = message.sender === Sender.BOT;
  const isSystem = message.sender === Sender.SYSTEM;

  if (isSystem) {
    return (
      <div className="flex justify-center my-4 animate-fade-in">
        <span className="bg-slate-100 text-slate-500 text-xs px-3 py-1 rounded-full border border-slate-200">
          {message.text}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex w-full mb-4 ${isBot ? 'justify-start' : 'justify-end'} animate-fade-in-up`}>
      <div className={`flex max-w-[85%] md:max-w-[70%] ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${isBot ? 'bg-cyan-100 text-cyan-700 mr-2' : 'bg-slate-200 text-slate-600 ml-2'}`}>
          {isBot ? <Bot size={18} /> : <User size={18} />}
        </div>

        {/* Message Body */}
        <div className={`
          p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm overflow-hidden
          ${isBot 
            ? 'bg-white text-slate-800 border border-slate-100 rounded-tl-none' 
            : 'bg-teal-600 text-white rounded-tr-none'}
        `}>
          {message.image && (
            <div className="mb-2">
              <img src={message.image} alt="Uploaded content" className="max-w-full rounded-lg max-h-64 object-cover" />
            </div>
          )}
          {message.text}
        </div>
      </div>
    </div>
  );
};