import React from 'react';
import { X, Loader2 } from 'lucide-react';

interface RegistroHabitoProps {
  isOpen: boolean;
  onClose: () => void;

  /** Debe ejecutar la llamada al endpoint de éxito (p.ej. markDone) y resolver cuando confirme */
  onSuccess: (comentario?: string) => Promise<void>;

  /** Debe ejecutar la llamada al endpoint de fallo (p.ej. markFail) y resolver cuando confirme */
  onFail: (comentario?: string) => Promise<void>;

  habitTitle: string;
  habitId: string;
  habitType: 'hacer' | 'dejar';
}

const NuevoRegistroHabito: React.FC<RegistroHabitoProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onFail,
  habitTitle,
}) => {
  const [comentario, setComentario] = React.useState('');
  const [selectedOption, setSelectedOption] = React.useState<'success' | 'fail' | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedOption) return;

    try {
      setIsLoading(true);

      if (selectedOption === 'success') {
        // 1) Disparamos la llamada al endpoint (el padre debe hacer markDone internamente)
        // Pasamos el comentario si existe
        await onSuccess(comentario || undefined);
        // 2) Cerramos modal y limpiamos
        setComentario('');
        setSelectedOption(null);
        onClose();
        // 3) La animación la enciende el padre inmediatamente después de la confirmación 💥
      } else {
        await onFail(comentario || undefined);
        setComentario('');
        setSelectedOption(null);
        onClose();
      }
    } catch (error) {
      console.error('Error al registrar el progreso:', error);
      // Aquí podrías mostrar un toast/mensaje al usuario
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-gray-900 p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Registrar progreso de hoy</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-white/10 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="space-y-4">
          <h3 className="text-lg text-white">{habitTitle}</h3>
          <div className="text-gray-300">¿Cómo te fue hoy?</div>

          {/* Botones de éxito/fallo */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedOption('success')}
              className={`flex items-center justify-center gap-2 rounded-xl border p-4 transition-colors
                ${
                  selectedOption === 'success'
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                    : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                }`}
              disabled={isLoading}
            >
              <span className="text-lg">¡Éxito!</span>
            </button>
            <button
              onClick={() => setSelectedOption('fail')}
              className={`flex items-center justify-center gap-2 rounded-xl border p-4 transition-colors
                ${
                  selectedOption === 'fail'
                    ? 'border-red-500 bg-red-500/20 text-red-300'
                    : 'border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20'
                }`}
              disabled={isLoading}
            >
              <span className="text-lg">No pude</span>
            </button>
          </div>

          {/* Comentario opcional */}
          <div>
            <label className="mb-2 block text-sm text-gray-400">
              Comentario (opcional)
            </label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="¿Cómo te sentiste? ¿Qué aprendiste?"
              className="w-full rounded-lg border border-white/10 bg-gray-800 px-4 py-3 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              rows={3}
              disabled={isLoading}
            />
          </div>

          {/* Acciones */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-gray-300 hover:bg-white/10"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedOption || isLoading}
              className={`rounded-lg px-4 py-2 font-medium flex items-center gap-2
                ${
                  selectedOption && !isLoading
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'cursor-not-allowed bg-emerald-600/40 text-white/70'
                }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Registrando...</span>
                </>
              ) : (
                'Registrar'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NuevoRegistroHabito;
