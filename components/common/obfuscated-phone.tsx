'use client';

import { useEffect, useState } from 'react';
import { rot13 } from '@/components/common/obfuscated-email';

interface ObfuscatedPhoneProps {
    number: string;
    displayText?: string;
    className?: string; // Add className prop for flexibility
}

/**
 * Client component that obfuscates phone numbers to prevent spam bots from scraping them.
 * Uses ROT13 encryption during hydration - the plain text number is only assembled client-side.
 * The initial HTML shows ROT13-encrypted text, and after hydration it becomes a clickable tel link.
 */
export function ObfuscatedPhone({ number, displayText, className }: ObfuscatedPhoneProps) {
    const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
    const [href, setHref] = useState<string | null>(null);

    useEffect(() => {
        // Assemble phone number and create tel link only after hydration
        // This ensures the plain text number is never in the initial HTML
        const timer = setTimeout(() => {
            // Remove spaces for the link
            const cleanNumber = number.replace(/\s/g, '');
            setPhoneNumber(number);
            setHref(`tel:${cleanNumber}`);
        }, 0);
        return () => clearTimeout(timer);
    }, [number]);

    if (!phoneNumber || !href) {
        // Show ROT13-encrypted version during SSR (before hydration)
        // This obfuscates the number in the initial HTML
        const encryptedNumber = rot13(displayText || number);
        return <span className={className}>{encryptedNumber}</span>;
    }

    // After hydration, show clickable tel link with displayText or plain number
    return (
        <a href={href} className={className}>
            {displayText || phoneNumber}
        </a>
    );
}
