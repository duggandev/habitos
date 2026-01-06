import React from 'react';
import { Sparkles, X, Loader2 } from 'lucide-react';

interface IASuggestions {
  dejar: string[];
  hacer: string[];
}

interface IASuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  iaInput: string;
  setIaInput: (value: string) => void;
  iaLoading: boolean;
  iaSuggestions: IASuggestions | null;
  iaError: string | null;
  selectedHabits: { hacer: boolean[]; dejar: boolean[] };
  setSelectedHabits: (habits: { hacer: boolean[]; dejar: boolean[] }) => void;
  bulkLoading: boolean;
  bulkSuccess: string | null;
  onGenerateSuggestions: () => Promise<void>;
  onBulkRegister: () => Promise<void>;
  onReset: () => void;
}

const IASuggestionsModal: React.FC<IASuggestionsModalProps> = ({
  isOpen,
  onClose,
  iaInput,
  setIaInput,
  iaLoading,
  iaSuggestions,
  iaError,
  selectedHabits,
  setSelectedHabits,
  bulkLoading,
  bulkSuccess,
  onGenerateSuggestions,
  onBulkRegister,
  onReset,
}) => {
  if (!isOpen) return null;

  const handleClose = () => {
    onReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-purple-400" />
              <h3 className="text-xl font-semibold text-white">Sugerencias de Hábitos con IA</h3>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {!iaSuggestions ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ¿Cuál es la meta que quieres lograr ahora mismo?
                </label>
                <input
                  type="text"
                  value={iaInput}
                  onChange={(e) => setIaInput(e.target.value)}
                  placeholder="Ej: bajar 10 kg, mejorar mi salud, ser más productivo..."
                  className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && onGenerateSuggestions()}
                />
              </div>

              {iaError && (
                <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  {iaError}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={onGenerateSuggestions}
                  disabled={iaLoading || !iaInput.trim()}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {iaLoading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                      Generando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Obtener Sugerencias
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-gray-300 mb-2">Meta: <span className="text-white font-medium">{iaInput}</span></p>
                <button
                  onClick={onReset}
                  className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                  ← Cambiar meta
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold text-red-400 flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    Hábitos para Dejar
                  </h4>
                  <ul className="space-y-2">
                    {iaSuggestions.dejar.map((sugerencia, index) => (
                      <li 
                        key={index} 
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          selectedHabits.dejar[index] 
                            ? "bg-red-500/20 border-red-400 shadow-md" 
                            : "bg-red-500/10 border-red-500/20 hover:bg-red-500/15"
                        }`}
                        onClick={() => {
                          const newSelected = { ...selectedHabits };
                          newSelected.dejar[index] = !newSelected.dejar[index];
                          setSelectedHabits(newSelected);
                        }}
                      >
                        <span className="text-gray-300 text-sm">{sugerencia}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="text-lg font-semibold text-emerald-400 flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    Hábitos para Hacer
                  </h4>
                  <ul className="space-y-2">
                    {iaSuggestions.hacer.map((sugerencia, index) => (
                      <li 
                        key={index} 
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          selectedHabits.hacer[index] 
                            ? "bg-emerald-500/20 border-emerald-400 shadow-md" 
                            : "bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/15"
                        }`}
                        onClick={() => {
                          const newSelected = { ...selectedHabits };
                          newSelected.hacer[index] = !newSelected.hacer[index];
                          setSelectedHabits(newSelected);
                        }}
                      >
                        <span className="text-gray-300 text-sm">{sugerencia}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {bulkSuccess && (
                <div className="text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                  {bulkSuccess}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={onBulkRegister}
                  disabled={bulkLoading || (!selectedHabits.hacer.some(Boolean) && !selectedHabits.dejar.some(Boolean))}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      Registrar Seleccionados
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IASuggestionsModal;