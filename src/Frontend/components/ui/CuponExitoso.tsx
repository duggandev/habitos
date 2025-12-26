import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PartyPopper, Sparkles, Stars } from 'lucide-react';

interface CuponExitosoProps {
    onFinish: () => void;
    esGratis: boolean;
    descuento?: number;
    onRedirect?: string;
}

export function CuponExitoso({ onFinish, esGratis, descuento, onRedirect }: CuponExitosoProps) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    const handleAnimationComplete = () => {
        if (!isVisible) {
            onFinish();
            if (onRedirect) {
                window.location.href = onRedirect;
            }
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    onAnimationComplete={handleAnimationComplete}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ y: 50 }}
                        animate={{ y: 0 }}
                        className="relative rounded-2xl bg-gradient-to-b from-purple-900/90 to-purple-800/90 p-8 text-center shadow-2xl"
                    >
                        {/* Efectos de fondo */}
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                            <PartyPopper className="h-12 w-12 text-yellow-400" />
                        </div>
                        <div className="absolute -left-4 top-1/2 -translate-y-1/2">
                            <Stars className="h-8 w-8 text-purple-400" />
                        </div>
                        <div className="absolute -right-4 top-1/2 -translate-y-1/2">
                            <Sparkles className="h-8 w-8 text-purple-400" />
                        </div>

                        {/* Contenido */}
                        <motion.div
                            initial={{ y: 20 }}
                            animate={{ y: 0 }}
                            className="space-y-4"
                        >
                            <h2 className="text-2xl font-bold text-white">
                                ¡Felicitaciones!
                            </h2>
                            <div className="space-y-2">
                                <p className="text-lg text-purple-200">
                                    {esGratis
                                        ? "Has canjeado un cupón para una suscripción gratuita"
                                        : `Has obtenido un ${descuento}% de descuento en tu suscripción`}
                                </p>
                                <p className="text-sm text-purple-300">
                                    ¡Tu plan se activará en unos segundos!
                                </p>
                            </div>
                            <div className="mt-6 space-y-2">
                                <p className="text-sm text-purple-200">
                                    Actualizando la página para registrar los cambios...
                                </p>
                                <p className="text-xs text-purple-300/80">
                                    Serás redirigido automáticamente
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
