
"use client";

import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqItems = [
  {
    id: "item-1",
    question: "What is Trashure?",
    answer:
      "Trashure helps you discover what to do with items you no longer need. Identify an item's material, then explore ways to recycle, sell, donate, or reuse it instead of simply throwing it away.",
  },
  {
    id: "item-2",
    question: "How do I use Trashure?",
    answer:
      "Take a photo or upload an image of your item. Review the suggested material, confirm or correct the result, and explore the available options for giving your item a second life.",
  },
  {
    id: "item-3",
    question: "Is Trashure free to use?",
    answer:
      "Trashure is designed to be free for residents. You can explore material identification and recovery options without a resident subscription. Available services may depend on participating partners in your area.",
  },
  {
    id: "item-4",
    question: "What kinds of items can I scan?",
    answer:
      "You can explore common materials such as plastic bottles, cans, glass, scrap metal, cardboard, paper, and household items. Electronics and hazardous materials may require special handling.",
  },
  {
    id: "item-5",
    question: "Can I earn money from my recyclables?",
    answer:
      "You may be able to sell recyclable materials through participating recyclers. Prices depend on the material, quantity, condition, and available offers. Review the terms before deciding whether to accept an offer.",
  },
  {
    id: "item-6",
    question: "Where can I bring or donate my items?",
    answer:
      "Explore available junkshops, recycling partners, and community collection drives. Check which materials they accept and confirm their drop-off or pickup arrangements before visiting.",
  },
  {
    id: "item-7",
    question: "Is my personal information private?",
    answer:
      "Please review Trashure's privacy policy to understand how your photos and personal information are handled and when information may be shared with a recycler or community organization.",
  },
  {
    id: "item-8",
    question: "What if Trashure identifies my item incorrectly?",
    answer:
      "AI identification can make mistakes. Review the suggested material and correct it when possible. If you are unsure about an item's composition or safe handling, consult a qualified recycling partner before proceeding.",
  },
];

export default function FAQs() {
  return (
    <section
      id="faqs"
      aria-labelledby="faqs-heading"
      className="scroll-mt-20 bg-white px-5 py-16 sm:px-8 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid items-start gap-10 lg:grid-cols-[0.85fr_1.4fr] lg:gap-20">
          {/* FAQ introduction */}
          <div className="lg:sticky lg:top-28">
            <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-4 py-2 text-xs font-semibold tracking-wider text-green-700">
              FREQUENTLY ASKED QUESTIONS
            </span>

            <h2
              id="faqs-heading"
              className="mt-5 text-3xl font-bold leading-tight tracking-tight text-zinc-900 sm:text-4xl"
            >
              Everything you need to know about{" "}
              <span className="text-green-600">Trashure.</span>
            </h2>

            <p className="mt-5 max-w-md text-sm leading-7 text-zinc-600 sm:text-base">
              Have questions about scanning, recycling, selling, or donating?
              Find simple answers to help you get started.
            </p>

            {/* Support link */}
            <div className="mt-7 flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600">
                <MessageCircle className="h-5 w-5" />
              </span>

              <div>
                <p className="text-sm font-semibold text-zinc-900">
                  Still need help?
                </p>

                <p className="mt-1 text-sm leading-6 text-zinc-500">
                  Our team is happy to help with your questions.
                </p>

                <Link
                  href="/contact"
                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-green-700 transition hover:text-green-800"
                >
                  Contact our team
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* FAQ accordion */}
          <div className="min-w-0">
            <Accordion className="w-full">
              {faqItems.map((item) => (
                <AccordionItem
                  key={item.id}
                  value={item.id}
                  className="border-b border-green-100"
                >
                  <AccordionTrigger className="gap-4 py-5 text-left text-sm font-semibold leading-6 text-zinc-800 hover:text-green-700 hover:no-underline sm:py-6 sm:text-base [&>svg]:text-green-600">
                    {item.question}
                  </AccordionTrigger>

                  <AccordionContent>
                    <p className="max-w-2xl pb-5 text-sm leading-7 text-zinc-600 sm:pb-6 sm:text-base">
                      {item.answer}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
}
