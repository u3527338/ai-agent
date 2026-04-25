import { SHUTDOWN_WORD, WAKE_WORD } from "./constant";

export const getWakeWord = WAKE_WORD.trim().toLowerCase();
export const getShutdownWord = SHUTDOWN_WORD.trim().toLowerCase();
