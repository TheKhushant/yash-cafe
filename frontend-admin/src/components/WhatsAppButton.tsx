import { MessageCircle } from "lucide-react";

export default function WhatsAppButton({
  message = "Hi! I'm interested in your products.",
}: {
  message?: string;
}) {
  const href = `https://wa.me/919876543210?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-50 bg-[#25D366] text-white rounded-full p-2.5 sm:p-4 shadow-lg hover:shadow-xl active:scale-95 transition-all duration-300 group"
      aria-label="Chat on WhatsApp"
    >
      {/* Icon */}
      <MessageCircle
        size={20}
        className="sm:w-7 sm:h-7 group-active:rotate-12 transition-transform"
      />

      {/* Online Dot */}
      <div className="absolute top-0 right-0 w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full flex items-center justify-center">
        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#25D366] rounded-full animate-pulse" />
      </div>
    </a>
  );
}