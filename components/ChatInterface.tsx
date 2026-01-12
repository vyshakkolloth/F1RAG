'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, ExternalLink, Bot, User, Sparkles } from 'lucide-react';

interface Message {
    role: 'user' | 'bot';
    content: string;
    sources?: { text: string; similarity: number; metadata: any }[];
}

export function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'bot', content: 'Hello! I am your F1 RAG Assistant. Ask me anything about Formula 1.' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [selectedSource, setSelectedSource] = useState<{ text: string; metadata: any } | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const response = await fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: userMessage }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch response');
            }

            const data = await response.json();
            setMessages((prev) => [
                ...prev,
                { role: 'bot', content: data.answer, sources: data.sources },
            ]);
        } catch (error) {
            console.error('Error:', error);
            setMessages((prev) => [
                ...prev,
                { role: 'bot', content: 'Sorry, I encountered an error while searching. Please try again.' },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSourceClick = (source: { text: string; metadata: any }) => {
        setSelectedSource(source);
        setIsDialogOpen(true);
    };

    return (
        <Card className="w-full max-w-4xl mx-auto h-[80vh] flex flex-col bg-white/10 dark:bg-black/20 backdrop-blur-lg border-white/20 shadow-2xl overflow-hidden">
            <CardHeader className="border-b border-white/10 bg-white/5 backdrop-blur-md py-4">
                <CardTitle className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    F1 RAG Assistant
                </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full p-4">
                    <div className="space-y-6 pr-4">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                            >
                                <div
                                    className={`max-w-[85%] p-4 rounded-2xl shadow-sm flex gap-3 ${msg.role === 'user'
                                            ? 'bg-blue-600 text-white rounded-tr-none'
                                            : 'bg-white dark:bg-zinc-800/80 text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-200 dark:border-zinc-700/50'
                                        }`}
                                >
                                    {msg.role === 'bot' && (
                                        <Bot className="w-5 h-5 mt-1 text-blue-500 shrink-0" />
                                    )}
                                    <div className="flex flex-col gap-2">
                                        <div className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">
                                            {msg.content}
                                        </div>

                                        {msg.sources && msg.sources.length > 0 && (
                                            <div className="mt-2 pt-2 border-t border-black/5 dark:border-white/5">
                                                <div className="text-xs font-medium opacity-70 mb-2 flex items-center gap-1">
                                                    <Sparkles className="w-3 h-3" />
                                                    Sources:
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {msg.sources.slice(0, 3).map((source, sIdx) => (
                                                        <Badge
                                                            key={sIdx}
                                                            variant="secondary"
                                                            className="cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors max-w-[200px] truncate"
                                                            onClick={() => handleSourceClick(source)}
                                                        >
                                                            {source.metadata?.title || `Source ${sIdx + 1}`}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {msg.role === 'user' && (
                                        <User className="w-5 h-5 mt-1 text-blue-100 shrink-0" />
                                    )}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white dark:bg-zinc-800/80 p-4 rounded-2xl rounded-tl-none border border-gray-200 dark:border-zinc-700/50 shadow-sm flex items-center gap-2">
                                    <Bot className="w-5 h-5 text-blue-500 animate-pulse" />
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-blue-500/50 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-2 h-2 bg-blue-500/50 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-2 h-2 bg-blue-500/50 rounded-full animate-bounce"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>
            </CardContent>

            <CardFooter className="p-4 bg-white/5 border-t border-white/10 backdrop-blur-md">
                <form onSubmit={handleSubmit} className="flex gap-2 w-full">
                    <Input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about F1 drivers, races, or history..."
                        className="flex-1 bg-white/50 dark:bg-zinc-900/50 border-white/20 focus-visible:ring-blue-500 text-gray-900 dark:text-white"
                        disabled={isLoading}
                    />
                    <Button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                    >
                        <Send className="w-4 h-4 mr-2" />
                        Send
                    </Button>
                </form>
            </CardFooter>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{selectedSource?.metadata?.title || 'Source Details'}</DialogTitle>
                        <DialogDescription>
                            Excerpt from the knowledge base used to generate the answer.
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="flex-1 mt-4 p-4 rounded-md border bg-muted/50">
                        <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed">
                            {selectedSource?.text}
                        </div>
                    </ScrollArea>
                    {selectedSource?.metadata?.url && (
                        <div className="flex justify-end pt-4">
                            <Button variant="outline" size="sm" asChild>
                                <a
                                    href={selectedSource.metadata.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2"
                                >
                                    Visit Original Source
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </Card>
    );
}
