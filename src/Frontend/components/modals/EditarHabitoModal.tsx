import React, { useState, useEffect } from 'react';

interface EditarHabitoModalProps {
  isOpen: boolean;
  onClose: () => void;
  habitId: string;
  currentTitle: string;
  onSave: (newTitle: string) => Promise<void>;
}

const EditarHabitoModal: React.FC<EditarHabitoModalProps> = ({
  isOpen,
  onClose,
  currentTitle,
  onSave,
}) => {
  const [title, setTitle] = useState(currentTitle);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Log cuando cambia la propiedad isOpen
  useEffect(() => {
    if (isOpen) {
      setTitle(currentTitle);
    }
  }, [isOpen, currentTitle]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación básica
    if (!title.trim()) {
      setError('El título no puede estar vacío');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      await onSave(title);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el hábito');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl bg-gray-800 p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-semibold text-white">Editar hábito</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="habit-title" className="block text-sm font-medium text-gray-300">
              Título
            </label>
            <input
              type="text"
              id="habit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              placeholder="Nombre del hábito"
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-red-500/20 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-600 bg-transparent px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Guardando...
                </span>
              ) : (
                'Guardar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditarHabitoModal;
