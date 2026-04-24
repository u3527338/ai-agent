"use client";
import { motion } from "framer-motion";

export default function ArcReactor({
    isListening,
    isThinking,
}: {
    isListening: boolean;
    isThinking: boolean;
}) {
    return (
        <div className="relative flex items-center justify-center w-64 h-64 sm:w-80 sm:h-80 md:scale-125 scale-100 transition-all duration-500">
            <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-[1px] border-cyan-500/10 rounded-full border-dashed"
            />

            <motion.div
                initial={{ rotate: 45 }}
                animate={{ rotate: -315 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute inset-2 border-[4px] border-cyan-400/10 rounded-full"
                style={{
                    borderStyle: "dashed",
                    strokeDasharray: "20 10",
                    clipPath: "polygon(0 0, 100% 0, 100% 30%, 0 30%)",
                }}
            />

            {[...Array(6)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ rotate: i * 60 }}
                    animate={{
                        rotate: isThinking
                            ? i % 2 === 0
                                ? i * 60 + 360
                                : i * 60 - 360
                            : i % 2 === 0
                            ? i * 60 + 360
                            : i * 60 - 360,
                    }}
                    transition={{
                        rotate: {
                            duration: isThinking ? 2 + i * 0.5 : 15 + i * 8,
                            repeat: Infinity,
                            ease: "linear",
                        },
                    }}
                    className="absolute border-cyan-400 rounded-full"
                    style={{
                        inset: `${i * 10 + 12}px`,
                        borderWidth: i % 2 === 0 ? "3px" : "1px",
                        opacity: 0.7 - i * 0.1,
                        borderTopColor: "transparent",
                        borderRightColor:
                            i % 3 === 0 ? "transparent" : "inherit",
                        borderLeftColor:
                            i % 2 === 0 ? "transparent" : "inherit",
                        borderStyle: i > 3 ? "dashed" : "solid",
                    }}
                />
            ))}

            <motion.div
                initial={{ rotate: 180 }}
                animate={{ rotate: 540 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[24%] border border-cyan-500/30 rounded-full border-l-transparent border-t-transparent"
            />

            <div className="relative z-10 w-[35%] h-[35%] min-w-[80px] min-h-[80px] rounded-full border-[2px] border-cyan-400 flex flex-col items-center justify-center bg-[#050b10]/60 backdrop-blur-md shadow-[inset_0_0_20px_rgba(34,211,238,0.5)]">
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    className="absolute inset-1 border-[1px] border-cyan-400/20 rounded-full border-t-cyan-400"
                />

                <div className="flex flex-col items-center">
                    <motion.h1
                        className="flex flex-col items-center"
                        aria-label="LUMOS: Logic Unit for Multitasking Operating System"
                    >
                        <motion.span
                            animate={{
                                opacity: isThinking ? [0.4, 1, 0.4] : 1,
                                textShadow: isListening
                                    ? "0 0 15px #22d3ee"
                                    : "0 0 5px #22d3ee",
                            }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                            className="text-cyan-50 text-[clamp(8px,2vw,11px)] font-black tracking-[0.5em] ml-2"
                        >
                            LUMOS
                        </motion.span>
                        <span className="sr-only">
                            Logic Unit for Multitasking Operating System
                        </span>
                    </motion.h1>

                    <div className="w-1/2 h-[1px] bg-cyan-400/40 mt-1" />
                    <span className="text-[clamp(4px,1vw,5px)] text-cyan-500 mt-1 tracking-[0.3em] font-mono uppercase opacity-60 text-center">
                        {isListening
                            ? "Illuminating"
                            : isThinking
                            ? "Thinking"
                            : "Secure"}
                    </span>
                </div>

                {[0, 120, 240].map((deg) => (
                    <div
                        key={deg}
                        className="absolute w-[4px] h-[1px] bg-cyan-100 shadow-[0_0_8px_#fff]"
                        style={{
                            transform: `rotate(${deg}deg) translateY(-140%)`,
                        }}
                    />
                ))}
            </div>

            <motion.div
                animate={{ opacity: isListening ? [0.1, 0.4, 0.1] : 0.05 }}
                transition={{ duration: 0.4, repeat: Infinity }}
                className="absolute inset-0 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none"
            />
        </div>
    );
}
