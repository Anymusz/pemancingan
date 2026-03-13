// File: src/pages/landing/sections/FAQSection.jsx (MODIFIED)
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
// import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MovingBorderButton } from "@/components/ui/moving-border";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FAQ_DATA, FAQ_WHATSAPP } from "@/constants/faqData";

export default function FAQSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const handleWhatsAppClick = () => {
    const url = `https://wa.me/${FAQ_WHATSAPP.phoneNumber}?text=${encodeURIComponent(FAQ_WHATSAPP.message)}`;
    window.open(url, "_blank");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
      },
    },
  };

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-background" ref={ref}>
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-center space-y-4 text-center"
        >
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-primary/10 text-primary px-3 py-1 text-sm font-medium">
              FAQ
            </div>
            <h2 className="text-3xl font-bold tracking-tighter text-text-primary md:text-4xl/tight">
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="mx-auto max-w-[700px] text-text-body md:text-xl">
              Temukan jawaban untuk pertanyaan umum seputar layanan, membership,
              dan operasional Pemancingan S.
            </p>
          </div>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="mx-auto max-w-3xl mt-12"
        >
          <Accordion type="single" collapsible className="w-full">
            {FAQ_DATA.map((faq) => (
              <motion.div key={faq.id} variants={itemVariants}>
                <AccordionItem value={faq.id}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>

        {/* WhatsApp CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12 text-center"
        >
          <p className="text-text-body mb-4">
            Masih ada pertanyaan? Hubungi kami via WhatsApp
          </p>
          <Button onClick={handleWhatsAppClick}>
            {/* <MessageCircle className="h-4 w-4" /> */}
            Hubungi via WhatsApp
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
