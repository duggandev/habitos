import React from 'react';
import { Search, Activity, Target, Calendar } from 'lucide-react';

interface SearchResult {
  type: 'habito' | 'registro' | 'actividad';
  title: string;
  description: string;
  link: string;
  date?: string;
}

interface SearchResultsDropdownProps {
  results: SearchResult[];
  show: boolean;
  onClose: () => void;
  onResultClick: (link: string) => void;
}

const getIconAndColor = (type: SearchResult['type'], description: string) => {
  switch (type) {
    case 'habito':
      // Si el hábito es "a eliminar", usamos rojo, si no, azul
      const isHabitToQuit = description.includes('eliminar');
      return {
        icon: <Target className={`w-4 h-4 ${isHabitToQuit ? 'text-red-400' : 'text-blue-400'}`} />,
        textColor: isHabitToQuit ? 'group-hover:text-red-400' : 'group-hover:text-blue-400'
      };
    case 'actividad':
      return {
        icon: <Activity className="w-4 h-4 text-green-400" />,
        textColor: 'group-hover:text-green-400'
      };
    case 'registro':
      return {
        icon: <Calendar className="w-4 h-4 text-purple-400" />,
        textColor: 'group-hover:text-purple-400'
      };
    default:
      return {
        icon: <Search className="w-4 h-4 text-gray-400" />,
        textColor: 'group-hover:text-gray-400'
      };
  }
};

const SearchResultsDropdown: React.FC<SearchResultsDropdownProps> = ({
  results,
  show,
  onClose,
  onResultClick
}) => {
  if (!show) return null;

  return (
    <>
      {/* Overlay para cerrar al hacer clic fuera */}
      <div 
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      
      {/* Dropdown de resultados */}
      <div className="absolute top-full left-0 right-0 mt-2 max-h-96 overflow-y-auto rounded-lg border border-gray-700 bg-gray-900 shadow-lg z-50">
        {results.length === 0 ? (
          <div className="px-4 py-3 text-sm text-gray-400">
            No se encontraron resultados
          </div>
        ) : (
          <div className="py-2">
            {results.map((result, index) => (
              <button
                key={index}
                onClick={() => onResultClick(result.link)}
                className="w-full px-4 py-2 text-left hover:bg-gray-800 transition-colors flex items-start gap-3 group"
              >
                <div className="mt-1 flex-shrink-0">
                  {getIconAndColor(result.type, result.description).icon}
                </div>
                <div>
                  <div className={`text-sm font-medium text-white ${getIconAndColor(result.type, result.description).textColor}`}>
                    {result.title}
                  </div>
                  <div className="text-xs text-gray-400">
                    {result.description}
                  </div>
                  {result.date && (
                    <div className="text-xs text-gray-500 mt-1">
                      {result.date}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default SearchResultsDropdown;
