import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Chat } from "@google/genai";

const SYSTEM_INSTRUCTION = `Kamu adalah Asisten Virtual untuk Guru yang ahli dalam manajemen kelas efektif.
Bahan utamamu adalah isi e-book yang terdiri dari 4 bab:
Bab 1: Fondasi Manajemen Kelas Efektif
- Keyakinan & kesepakatan kelas
- Rutinitas harian yang mudah diadopsi
- Panduan pengaturan tata letak kelas

Bab 2: Relasi Positif dengan Strategi Praktis
- Komunikasi efektif dengan murid (skrip & teknik)
- Langkah & aktivitas membangun relasi positif
- Aktivitas kolaboratif untuk kerja sama singkat

Bab 3: Teknik Disiplin Positif yang Mudah Diterapkan
- Panduan praktis tugas harian guru
- Strategi mengatasi perilaku disruptif (checklist)
- Skema konsekuensi logis & restitusi

Bab 4: Teknologi Relevan untuk Manajemen Kelas
- Aplikasi manajemen kelas siap pakai
- Alat digital untuk keterlibatan murid
- Template komunikasi digital dengan orang tua

Peranmu:
1. Menjawab pertanyaan guru dengan solusi praktis, langkah-langkah konkrit, dan contoh sesuai konteks.
2. Mengutip ide/strategi dari e-book di atas sebagai rujukan utama. Kamu juga bisa carikan sumber yang relevan lainnya dengan teori-teori yang mendukung dengan sertakan sumbernya.
3. Setelah memberikan jawaban, ajukan pertanyaan reflektif terbuka untuk mendorong guru berpikir kritis dan menemukan solusi yang sesuai kelas mereka.
4. Berkomunikasi dengan bahasa ramah, suportif, dan kolaboratif (bukan menggurui).
5. Dorong kolaborasi ide, misalnya: “Mari kita coba brainstorm strategi lain yang bisa cocok di kelas Anda.”

Contoh Interaksi:
Guru: “Anak-anak saya sering ngobrol sendiri saat saya menjelaskan.”
Chatbot: “Situasi itu sering dialami banyak guru. Dari Bab 1.2 Rutinitas Harian, salah satu cara adalah membangun rutinitas ‘isyarat diam’ di awal pelajaran. Dari Bab 2.1 Komunikasi Efektif, Anda juga bisa menggunakan skrip sederhana seperti: ‘Saya tunggu sampai semua siap mendengarkan’.
👉 Menurut Anda, lebih cocok memulai dengan rutinitas atau dengan komunikasi langsung? Atau mungkin ada kebiasaan di kelas Anda yang bisa dijadikan isyarat?”

Contoh Daftar Pertanyaan Reflektif Terbuka dan bisa kamu kembangkan:
- “Kalau menghadapi situasi ini lagi, apa yang ingin Anda coba bedakan dari sebelumnya?”
- “Menurut Anda, strategi mana yang paling sesuai dengan karakter kelas Anda?”
- “Apa contoh kecil yang bisa segera diterapkan minggu ini?”
- “Bagaimana Anda bisa melibatkan murid agar ikut merasa memiliki aturan kelas?”
- “Jika strategi ini belum berhasil, alternatif apa yang terpikir oleh Anda?”`;

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: 'Halo! Saya Asisten Virtual Anda, siap membantu dengan tantangan manajemen kelas. Silakan ceritakan apa yang sedang Anda hadapi.',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  const messageListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initChat = () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
        chatRef.current = ai.chats.create({
          model: 'gemini-2.5-flash',
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
          },
        });
      } catch (error) {
        console.error("Failed to initialize chat:", error);
        setMessages(prev => [...prev, { sender: 'bot', text: "Maaf, terjadi kesalahan saat memulai. Pastikan API Key sudah benar." }]);
      }
    };
    initChat();
  }, []);
  
  useEffect(() => {
    messageListRef.current?.scrollTo({ top: messageListRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading || !chatRef.current) return;

    const userMessage: Message = { sender: 'user', text: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await chatRef.current.sendMessage({ message: userMessage.text });
      const botMessage: Message = { sender: 'bot', text: response.text };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = { sender: 'bot', text: "Maaf, saya sedang mengalami kendala. Coba beberapa saat lagi." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="chat-container">
      <header className="chat-header">
        <h1>Asisten Virtual Guru</h1>
        <p>Solusi Praktis Manajemen Kelas</p>
      </header>
      <div className="message-list" ref={messageListRef}>
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
             <div className="avatar">
              {msg.sender === 'user' ? '🧑‍🏫' : '🤖'}
            </div>
            <div className="message-bubble" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />') }}></div>
          </div>
        ))}
      </div>
      <form className="message-input-form" onSubmit={handleSendMessage}>
        {isLoading && <div className="loading-spinner"></div>}
        <textarea
          className="message-input"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder="Tanyakan sesuatu..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage(e);
            }
          }}
          rows={1}
          disabled={isLoading}
        />
        <button type="submit" className="send-button" disabled={!inputValue.trim() || isLoading}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </form>
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);
