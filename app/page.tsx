import { BubbleBackground } from "@/components/BubbleBackground";
import { ChatInterface } from "@/components/ChatInterface";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 lg:p-24 overflow-hidden bg-linear-to-b from-slate-900 via-purple-900 to-slate-900">
      <div className="absolute inset-0 bg-transparent"></div>

      <BubbleBackground />

      <div className="relative z-10 w-full flex flex-col items-center gap-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl lg:text-6xl font-black text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-purple-400 drop-shadow-sm">
            F1 Neural Link
          </h1>
          <p className="text-gray-300 max-w-lg mx-auto text-lg">
            AI-Powered RAG System for Formula 1 Information
          </p>
        </div>

        <ChatInterface />
      </div>
    </main>
  );
}
