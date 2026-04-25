import { SHUTDOWN_WORD, tacticalPrompt, WAKE_WORD } from "./constant";

export const getWakeWord = WAKE_WORD.trim().toLowerCase();
export const getShutdownWord = SHUTDOWN_WORD.trim().toLowerCase();

export const getEnrichedPrompt = ({
    longTermContext,
    shortTermContext,
}: {
    longTermContext: string;
    shortTermContext: string;
}) => `
            [SYSTEM_PROTOCOL]
            ${tacticalPrompt}
            - You are bilingual. Sir may ask in Cantonese, but your facts are stored in English.
            - ALWAYS cross-reference the [ARCHIVE_CONTEXT] regardless of the language used in the query.

            [ARCHIVE_CONTEXT] (Your source of truth)
            ${longTermContext || "No specific long-term records."}

            [RECENT_HISTORY]
            ${shortTermContext || "Initial contact."}
            
            [TASK]
            Answer Sir's latest message. If the answer is in ARCHIVE_CONTEXT, you MUST use it, even if the language of the query is different.
        `;
