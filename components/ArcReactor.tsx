"use client";

import { motion } from "framer-motion";

export default function ArcReactor({
    isListening,
    isThinking,
    isPreWaking,
}: {
    isListening: boolean;
    isThinking: boolean;
    isPreWaking?: boolean;
}) {
    const getCoreColor = () => {
        if (isThinking) return "#22d3ee";
        if (isPreWaking) return "#facc15";
        if (isListening) return "#22d3ee";
        return "#0ea5e9";
    };

    const activeColor = getCoreColor();

    return (
        <div className="relative flex items-center justify-center w-64 h-64 sm:w-80 sm:h-80 md:scale-125 scale-100 transition-all duration-500">
            <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-[1px] rounded-full border-dashed transition-colors duration-500"
                style={{
                    borderTopColor: `${activeColor}20`,
                    borderBottomColor: `${activeColor}20`,
                    borderLeftColor: `${activeColor}20`,
                    borderRightColor: `${activeColor}20`,
                }}
            />

            {[...Array(6)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ rotate: i * 60 }}
                    animate={{
                        rotate:
                            isThinking || isPreWaking
                                ? i % 2 === 0
                                    ? i * 60 + 360
                                    : i * 60 - 360
                                : i % 2 === 0
                                ? i * 60 + 360
                                : i * 60 - 360,
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

            <div
                className="relative z-10 w-[35%] h-[35%] min-w-[80px] min-h-[80px] rounded-full border-[2px] flex flex-col items-center justify-center bg-[#050b10]/60 backdrop-blur-md transition-all duration-500"
                style={{
                    borderTopColor: activeColor,
                    borderBottomColor: activeColor,
                    borderLeftColor: activeColor,
                    borderRightColor: activeColor,
                    boxShadow: `inset 0 0 20px ${activeColor}80`,
                }}
            >
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
                        borderBottomColor: `${activeColor}40`,
                        borderLeftColor: `${activeColor}40`,
                        borderRightColor: `${activeColor}40`,
                    }}
                />

                <div className="flex flex-col items-center text-center">
                    <motion.h1 className="flex flex-col items-center">
                        <motion.span
                            animate={{
                                opacity:
                                    isThinking || isPreWaking
                                        ? [0.4, 1, 0.4]
                                        : 1,
                                textShadow:
                                    isListening || isPreWaking
                                        ? `0 0 15px ${activeColor}`
                                        : `0 0 5px ${activeColor}`,
                            }}
                            transition={{
                                duration: isPreWaking ? 0.4 : 0.8,
                                repeat: Infinity,
                            }}
                            className="text-cyan-50 text-[clamp(8px,2vw,11px)] font-black tracking-[0.5em] ml-2"
                        >
                            LUMOS
                        </motion.span>
                    </motion.h1>
                    <div
                        className="w-1/2 h-[1px] mt-1 transition-colors duration-500"
                        style={{ backgroundColor: `${activeColor}60` }}
                    />
                    <span
                        className="text-[clamp(4px,1vw,5px)] mt-1 tracking-[0.3em] font-mono uppercase opacity-60 transition-colors duration-500"
                        style={{ color: activeColor }}
                    >
                        {isPreWaking
                            ? "Syncing"
                            : isListening
                            ? "Illuminating"
                            : isThinking
                            ? "Thinking"
                            : "Secure"}
                    </span>
                </div>
            </div>

            <motion.div
                animate={{
                    opacity: isPreWaking
                        ? [0.2, 0.6, 0.2]
                        : isListening
                        ? [0.1, 0.4, 0.1]
                        : 0.05,
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
