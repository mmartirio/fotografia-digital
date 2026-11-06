"use client";

import { motion } from "framer-motion";
import { linkWhatsapp } from "@/lib/contato";
import { IconeWhatsapp } from "./Icones";

// CTA flutuante: sempre ao alcance do polegar no mobile
export function BotaoWhatsapp({ numero, mensagem }: { numero: string; mensagem: string }) {
  return (
    <motion.a
      href={linkWhatsapp(numero, mensagem)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Conversar no WhatsApp"
      className="fixed bottom-5 right-5 z-30 inline-flex size-14 items-center justify-center rounded-full bg-whatsapp text-white shadow-lg shadow-black/40"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1.2, type: "spring", stiffness: 260, damping: 18 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
    >
      <IconeWhatsapp className="size-7" />
    </motion.a>
  );
}
