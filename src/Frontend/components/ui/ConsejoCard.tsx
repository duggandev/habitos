import React, { useState } from "react";
import {
  ThumbsUp,
  Archive,
  Eye,
  EyeOff,
  Lightbulb,
  Award,
  Zap,
  Heart,
  Loader,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Consejo } from "../../hooks/useCoachIA";

interface ConsejoCardProps {
  consejo: Consejo;
  onAccion?: (accion: "visto" | "archivado" | "seguido" | "ignorado") => Promise<boolean>;
}

const getIconoYColor = (tipo: Consejo["tipo"]) => {
  switch (tipo) {
    case "motivacion":
      return { icon: Heart, color: "text-red-400", bgColor: "bg-red-900/20", border: "border-red-400/20" };
    case "mejora_habito":
      return { icon: Lightbulb, color: "text-yellow-400", bgColor: "bg-yellow-900/20", border: "border-yellow-400/20" };
    case "reto":
      return { icon: Zap, color: "text-orange-400", bgColor: "bg-orange-900/20", border: "border-orange-400/20" };
    case "celebracion":
      return { icon: Award, color: "text-green-400", bgColor: "bg-green-900/20", border: "border-green-400/20" };
    case "felicitacion":
      return { icon: Award, color: "text-purple-400", bgColor: "bg-purple-900/20", border: "border-purple-400/20" };
    case "ruptura_racha":
      return { icon: Lightbulb, color: "text-blue-400", bgColor: "bg-blue-900/20", border: "border-blue-400/20" };
    default:
      return { icon: Lightbulb, color: "text-blue-400", bgColor: "bg-blue-900/20", border: "border-blue-400/20" };
  }
};

const etiquetaTipo: Record<Consejo["tipo"], string> = {
  motivacion: "Motivación",
  mejora_habito: "Mejora de Hábito",
  reto: "Reto",
  celebracion: "Celebración",
  felicitacion: "¡Felicitación!",
  ruptura_racha: "Ruptura de Racha",
};

const MarkdownRenderer = ({ content }: { content: string }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="text-gray-300 mb-3 leading-relaxed">{children}</p>,
        h1: ({ children }) => <h1 className="text-xl font-bold text-white mt-4 mb-2">{children}</h1>,
        h2: ({ children }) => <h2 className="text-lg font-bold text-white mt-3 mb-2">{children}</h2>,
        h3: ({ children }) => <h3 className="text-base font-semibold text-white mt-3 mb-2">{children}</h3>,
        ul: ({ children }) => <ul className="list-disc list-inside space-y-2 mb-3 text-gray-300">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside space-y-2 mb-3 text-gray-300">{children}</ol>,
        li: ({ children }) => (
          <li className="ml-2 text-gray-300">
            {children}
          </li>
        ),
        strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
        em: ({ children }) => <em className="italic text-gray-200">{children}</em>,
        code: ({ children }) => (
          <code className="bg-gray-800/50 px-2 py-1 rounded text-sm font-mono text-orange-300">
            {children}
          </code>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-blue-400 pl-4 py-2 my-3 text-gray-400 italic">
            {children}
          </blockquote>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

const ConsejoCard: React.FC<ConsejoCardProps> = ({ consejo, onAccion }) => {
  const [loading, setLoading] = useState(false);
  const [expandido, setExpandido] = useState(false);
  const [needsExpand, setNeedsExpand] = useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const { icon: Icon, color, bgColor, border } = getIconoYColor(consejo.tipo);

  React.useEffect(() => {
    if (contentRef.current) {
      const scrollHeight = contentRef.current.scrollHeight;
      const clientHeight = contentRef.current.clientHeight;
      setNeedsExpand(scrollHeight > clientHeight + 10); // 10px de tolerancia
    }
  }, [consejo]);

  const handleAccion = async (accion: "visto" | "archivado" | "seguido" | "ignorado") => {
    setLoading(true);
    try {
      if (onAccion) {
        await onAccion(accion);
      }
    } finally {
      setLoading(false);
    }
  };

  const fecha = new Date(consejo.generado_en);
  const fechaFormato = fecha.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div
      className={`rounded-xl border transition-all ${border} ${bgColor} p-4 hover:shadow-lg hover:shadow-current/20`}
    >
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Icon className={`h-5 w-5 ${color}`} />
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${bgColor} ${color}`}>
              {etiquetaTipo[consejo.tipo]}
            </span>
            {consejo.leido && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Eye className="h-3 w-3" />
                Leído
              </span>
            )}
          </div>
          <h3 className="text-base font-semibold text-white">{consejo.titulo}</h3>
        </div>
      </div>

      {/* Contenido */}
      <div className="mt-3">
        <div
          ref={contentRef}
          className={`text-sm text-gray-300 transition-all overflow-hidden ${
            expandido ? "max-h-none" : "max-h-64"
          }`}
        >
          <div className="prose prose-invert max-w-none text-sm">
            {/* Renderizar el contenido como markdown completo */}
            <MarkdownRenderer content={consejo.contenido} />
          </div>
        </div>

        {!expandido && needsExpand && (
          <button
            onClick={() => setExpandido(true)}
            className="mt-2 text-xs text-blue-400 hover:text-blue-300 font-semibold"
          >
            Leer más
          </button>
        )}

        {expandido && (
          <button
            onClick={() => setExpandido(false)}
            className="mt-2 text-xs text-blue-400 hover:text-blue-300 font-semibold"
          >
            Mostrar menos
          </button>
        )}
      </div>

      {/* Pie con fecha y acciones */}
      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="text-xs text-gray-500">{fechaFormato}</span>

        <div className="flex items-center gap-2">
          {/* Botón Marcar como visto */}
          <button
            onClick={() => handleAccion("visto")}
            disabled={loading || consejo.leido}
            className={`p-2 rounded-lg transition-colors ${
              consejo.leido
                ? "bg-gray-800/50 text-gray-600 cursor-default"
                : "bg-gray-800/50 text-gray-300 hover:bg-blue-900/30 hover:text-blue-400"
            }`}
            title={consejo.leido ? "Ya marcado como leído" : "Marcar como leído"}
          >
            {loading ? <Loader className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
          </button>

          {/* Botón Seguir consejo */}
          <button
            onClick={() => handleAccion("seguido")}
            disabled={loading}
            className="p-2 rounded-lg bg-green-900/30 text-green-400 hover:bg-green-900/50 transition-colors disabled:opacity-50"
            title="Seguir este consejo"
          >
            {loading ? <Loader className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
          </button>

          {/* Botón Archivar */}
          <button
            onClick={() => handleAccion("archivado")}
            disabled={loading}
            className="p-2 rounded-lg bg-gray-800/50 text-gray-300 hover:bg-orange-900/30 hover:text-orange-400 transition-colors disabled:opacity-50"
            title="Archivar este consejo"
          >
            {loading ? <Loader className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
          </button>

          {/* Botón Ignorar */}
          <button
            onClick={() => handleAccion("ignorado")}
            disabled={loading}
            className="p-2 rounded-lg bg-gray-800/50 text-gray-300 hover:bg-red-900/30 hover:text-red-400 transition-colors disabled:opacity-50"
            title="Ignorar este consejo"
          >
            {loading ? <Loader className="h-4 w-4 animate-spin" /> : <EyeOff className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsejoCard;
