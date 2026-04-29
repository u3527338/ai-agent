"use client";

import { getCoreColor } from "@/helpers/function";
import { motion } from "framer-motion";

interface ElectronBall {
    isElectron: boolean;
    isExpanded: boolean;
    onHoverChange: (hovered: boolean) => void;
    state: {
        isOnline: boolean;
        isSpeaking: boolean;
        isThinking: boolean;
        isPreWaking: boolean;
        isActive: boolean;
    };
}

export default function ElectronBall({
    isElectron,
    isExpanded,
    onHoverChange,
    state,
}: ElectronBall) {
    if (!isElectron) return null;

    const activeColor = getCoreColor({ state });

    return (
        <>
            {/* 🛡️ 物理感應區 (維持 48x48 確保容易 Hover) */}
            <div
                className="fixed top-0 right-0 w-48 h-48 z-[999] pointer-events-auto bg-transparent"
                onMouseEnter={() => onHoverChange(true)}
                onMouseLeave={() => onHoverChange(false)}
            />

            {/* 🔵 原生簡約波 (只換顏色 + 呼吸燈效果) */}
            <div
                className={`fixed top-8 right-8 z-[100] pointer-events-none transition-all duration-700 ${
                    isExpanded ? "opacity-0 scale-50" : "opacity-100 scale-100"
                }`}
            >
                <motion.div
                    animate={{
                        // 呼吸燈效果：顏色深淺變化
                        boxShadow: [
                            `0 0 10px ${activeColor}80`,
                            `0 0 20px ${activeColor}ff`,
                            `0 0 10px ${activeColor}80`,
                        ],
                    }}
                    transition={{
                        duration: state.isSpeaking ? 0.5 : 2, // 講緊嘢嗰陣呼吸快啲
                        repeat: Infinity,
                    }}
                    className="w-3 h-3 rounded-full transition-colors duration-500"
                    style={{ backgroundColor: activeColor }}
                />
            </div>
        </>
    );
}
