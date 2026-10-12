'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import Link from 'next/link'
import { motion } from "framer-motion";
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import ResourceHeader from '@/components/ResourceHeader';

export default function FAQs() {
    const faqItems = [
        {
            id: 'item-1',
            question: 'What is Trashure?',
            answer: 'Trashure is a free app that helps you figure out what to do with items you no longer need. Just take a photo, and it tells you whether you can recycle it, sell it, donate it, or reuse it, so it stays out of the landfill.',
        },
        {
            id: 'item-2',
            question: 'How do I use it?',
            answer: 'Open the app, snap a photo of your item, and Trashure will identify what it is made of. Confirm the result, then choose what you want to do, recycle, sell, donate, or reuse. It only takes a few seconds.',
        },
        {
            id: 'item-3',
            question: 'Is it really free?',
            answer: 'Yes. Trashure is free for residents to use. You can scan items, find junkshops, and sell your recyclables without paying anything.',
        },
        {
            id: 'item-4',
            question: 'What kinds of items can I scan?',
            answer: 'You can scan plastic bottles, cans, scrap metal, glass containers, cardboard and paper, old chargers and electronics, and many reusable household materials. If Trashure is unsure, it will ask you to confirm or pick the material yourself.',
        },
        {
            id: 'item-5',
            question: 'How much can I earn from selling my recyclables?',
            answer: 'It depends on the material and the junkshop. Once you post an item for sale, nearby recyclers send you their price per kilogram. You can compare offers and accept the one you like best, or cancel anytime.',
        },
        {
            id: 'item-6',
            question: 'Where can I bring my recyclables?',
            answer: 'Trashure shows you junkshops and recyclers near you that accept your specific material. You can choose to drop it off yourself, request a pickup, or either, whichever is more convenient.',
        },
        {
            id: 'item-7',
            question: 'Can I donate instead of selling?',
            answer: 'Absolutely. Trashure lists active collection drives from schools and community organizations near you. If your material matches what they need, you can donate it directly to a good cause.',
        },
        {
            id: 'item-8',
            question: 'How do I know which items are safe to reuse?',
            answer: 'Trashure flags hazardous items, like certain electronics or chemical containers, and gives you safe handling instructions. Reuse ideas are only shown for items that are safe to handle at home.',
        },
        {
            id: 'item-9',
            question: 'Is my information private?',
            answer: 'Yes. Your photos and personal details are kept private. Only you and the recycler or organization you choose to work with can see your scan and contact information.',
        },
        {
            id: 'item-10',
            question: 'What if Trashure gets my item wrong?',
            answer: 'No problem, you are always in control. If the AI guesses the wrong material, you can correct it manually before choosing what to do with your item. Trashure never makes a final decision without your confirmation.',
        },
        {
            id: 'item-11',
            question: 'Do I need a special phone or app to use it?',
            answer: 'No. Trashure works right in your web browser on any phone, tablet, or computer. You do not need to install anything.',
        },
        {
            id: 'item-12',
            question: 'How does my recycling actually help?',
            answer: 'Every item you recover through Trashure is tracked. Your city can see how many kilograms of waste were diverted from landfills, which helps keep your community cleaner and supports local recycling programs.',
        },
    ];


    return (
        <main className='min-h-screen bg-white'>
            <section className="py-16 md:py-24">
                <div className="mx-auto max-w-5xl px-6">
                    <div className="grid gap-8 md:grid-cols-5 md:gap-12">

                        <div className="md:col-span-2">
                            <h2 className="text-foreground text-4xl font-semibold">FAQs</h2>
                            <p className="text-muted-foreground mt-4 text-balance text-lg">
                                Here are some of the most common questions we get about Trashure. If you have a question that isn&apos;t answered here, please reach out to our support team.
                            </p>
                            <p className="text-muted-foreground mt-6 hidden md:block">
                                Can&apos;t find what you&apos;re looking for? Reach out to our{' '}
                                <Link
                                    href="/contact"
                                    className="text-primary font-medium hover:underline"
                                >
                                Trashure support team
                                </Link>{' '}
                                for assistance.
                            </p>
                        </div>

                        <div className="md:col-span-3">

                            <Accordion>
                                {faqItems.map((item) => (
                                    <AccordionItem
                                        key={item.id}
                                        value={item.id}
                                        className="border-b border-gray-200 dark:border-gray-600">
                                        <AccordionTrigger className="cursor-pointer text-base font-medium hover:no-underline">{item.question}</AccordionTrigger>
                                        <AccordionContent>
                                            <BlurredStagger text={item.answer} />
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}


export const BlurredStagger = ({
    text = "built by ruixen.com",
}: {
    text: string;
}) => {
    const headingText = text;

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.015,
            },
        },
    };

    const letterAnimation = {
        hidden: {
            opacity: 0,
            filter: "blur(10px)",
        },
        show: {
            opacity: 1,
            filter: "blur(0px)",
        },
    };

    return (
        <>
            <div className="w-full">
                <motion.p
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="text-base leading-relaxed break-words whitespace-normal"
                >
                    {headingText.split("").map((char, index) => (
                        <motion.span
                            key={index}
                            variants={letterAnimation}
                            transition={{ duration: 0.3 }}
                            className="inline-block"
                        >
                            {char === " " ? "\u00A0" : char}
                        </motion.span>
                    ))}
                </motion.p>
            </div>
        </>
    );
};