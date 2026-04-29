"use client";

import { THEME } from "@/helpers/constant";
import { getCoreColor } from "@/helpers/function";
import { motion } from "framer-motion";

export default function ArcReactor({
    isOnline,
    isActive,
    isSpeaking,
    isThinking,
    isPreWaking,
}: {
    isOnline: boolean;
    isActive: boolean;
    isSpeaking: boolean;
    isThinking: boolean;
    isPreWaking: boolean;
}) {
    const activeColor = getCoreColor({
        state: { isOnline, isSpeaking, isThinking, isPreWaking, isActive },
    });

    return (
        <div className="relative flex items-center justify-center w-64 h-64 sm:w-80 sm:h-80 md:scale-125 scale-100 transition-all duration-500">
            {/* 1. 最外層虛線環 */}
            <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-[1px] rounded-full border-dashed transition-colors duration-500"
                style={{ borderColor: `${activeColor}20` }}
            />

            <motion.div
                initial={{ rotate: 45 }}
                animate={{ rotate: -315 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute inset-2 border-[4px] rounded-full transition-colors duration-500"
                style={{
                    borderColor: `${activeColor}10`,
                    borderStyle: "dashed",
                    strokeDasharray: "20 10",
                    clipPath: "polygon(0 0, 100% 0, 100% 30%, 0 30%)",
                }}
            />

            {/* 3. 6層動力環 (你提供的核心旋轉邏輯) */}
            {[...Array(6)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ rotate: i * 60 }}
                    animate={{
                        rotate: i % 2 === 0 ? i * 60 + 360 : i * 60 - 360,
                    }}
                    transition={{
                        rotate: {
                            duration: isThinking
                                ? 2 + i * 0.5
                                : isPreWaking
                                ? 5
                                : 15 + i * 8,
                            repeat: Infinity,
                            ease: "linear",
                        },
                    }}
                    className="absolute rounded-full transition-colors duration-500"
                    style={{
                        inset: `${i * 10 + 12}px`,
                        borderWidth: i % 2 === 0 ? "3px" : "1px",
                        opacity: 0.7 - i * 0.1,
                        borderTopColor: "transparent",
                        borderRightColor:
                            i % 3 === 0 ? "transparent" : activeColor,
                        borderLeftColor:
                            i % 2 === 0 ? "transparent" : activeColor,
                        borderBottomColor: activeColor,
                        borderStyle: i > 3 ? "dashed" : "solid",
                    }}
                />
            ))}

            {/* 4. 核心內層發光半環 */}
            <motion.div
                initial={{ rotate: 180 }}
                animate={{ rotate: 540 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[24%] border rounded-full border-l-transparent border-t-transparent transition-colors duration-500"
                style={{ borderColor: `${activeColor}30` }}
            />

            {/* 5. ⚛️ 核心中心組件 */}
            <div
                className="relative z-10 w-[35%] h-[35%] min-w-[80px] min-h-[80px] rounded-full border-[2px] flex flex-col items-center justify-center bg-[#050b10]/60 backdrop-blur-md transition-all duration-500"
                style={{
                    borderColor: activeColor,
                    boxShadow: `inset 0 0 20px ${activeColor}80`,
                }}
            >
                {/* 內部快速轉動細線環 */}
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{
                        duration: isPreWaking ? 1 : 4,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    className="absolute inset-1 border-[1px] rounded-full transition-colors duration-500"
                    style={{
                        borderTopColor: activeColor,
                        borderBottomColor: `${activeColor}20`,
                        borderLeftColor: `${activeColor}20`,
                        borderRightColor: `${activeColor}20`,
                    }}
                />

                <div className="flex flex-col items-center text-center">
                    <motion.h1 className="flex flex-col items-center">
                        <motion.span
                            animate={{
                                opacity: isActive ? [0.4, 1, 0.4] : 0.2,
                                textShadow: `0 0 15px ${activeColor}`,
                            }}
                            transition={{
                                duration: isActive ? 0.6 : 0,
                                repeat: Infinity,
                            }}
                            className={`${THEME.primary} text-[clamp(8px,2vw,11px)] font-black tracking-[0.5em] ml-2`}
                        >
                            LUMOS
                        </motion.span>
                    </motion.h1>
                    <div
                        className="w-1/2 h-[1px] mt-1 transition-colors duration-500"
                        style={{ backgroundColor: `${activeColor}60` }}
                    />
                    <span
                        className="text-[clamp(4px,1vw,6px)] mt-1 tracking-[0.3em] font-mono uppercase opacity-60 transition-colors duration-500"
                        style={{ color: activeColor }}
                    >
                        {!isOnline
                            ? "Offline"
                            : isSpeaking
                            ? "Transmitting"
                            : isThinking
                            ? "Synthesizing"
                            : isPreWaking
                            ? "Intercepting"
                            : isActive
                            ? "Operational"
                            : "Standby"}
                    </span>
                </div>

                {[0, 120, 240].map((deg) => (
                    <div
                        key={deg}
                        className="absolute w-[4px] h-[1px] bg-white shadow-[0_0_8px_#fff] transition-all duration-500"
                        style={{
                            transform: `rotate(${deg}deg) translateY(-140%)`,
                            opacity: isActive ? 1 : 0.2,
                        }}
                    />
                ))}
            </div>

            {/* 底層氛圍擴散光 */}
            <motion.div
                animate={{
                    opacity: isPreWaking ? [0.2, 0.6, 0.2] : 0.05,
                    scale: isPreWaking ? [1, 1.1, 1] : 1,
                }}
                transition={{
                    duration: isPreWaking ? 0.3 : 0.4,
                    repeat: Infinity,
                }}
                className="absolute inset-0 rounded-full blur-3xl pointer-events-none transition-colors duration-500"
                style={{ backgroundColor: `${activeColor}30` }}
            />
        </div>
    );
}
