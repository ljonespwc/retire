'use client';

import { Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface RetirementNarrativeProps {
  narrative?: string | null;
  isDarkMode?: boolean;
}

export function RetirementNarrative({ narrative, isDarkMode = false }: RetirementNarrativeProps) {
  // Don't render if no narrative provided
  if (!narrative) {
    return null;
  }

  // Theme-aware colors
  const bgColor = isDarkMode ? 'bg-blue-900/10' : 'bg-blue-50/50';
  const borderColor = isDarkMode ? 'border-blue-500/30' : 'border-blue-500/30';
  const textColor = isDarkMode ? 'text-gray-300' : 'text-gray-700';
  const badgeBg = isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100';
  const badgeText = isDarkMode ? 'text-blue-300' : 'text-blue-700';

  return (
    <div
      className={`${bgColor} border-l-4 ${borderColor} rounded-r-lg p-6 transition-all duration-300`}
    >
      {/* Badge */}
      <div className="flex items-center gap-2 mb-3">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${badgeBg} ${badgeText} text-xs font-medium`}>
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Analysis</span>
        </div>
      </div>

      {/* Narrative Content - Markdown-enabled */}
      <div className={`${textColor} leading-relaxed text-[15px] prose prose-sm max-w-none
        prose-strong:font-semibold prose-strong:text-orange-600 dark:prose-strong:text-orange-400
        prose-ul:my-2 prose-li:my-1
        prose-p:my-3
        ${isDarkMode ? 'prose-invert' : ''}`}
      >
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="my-3">{children}</p>,
            strong: ({ children }) => (
              <strong className={`font-semibold ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                {children}
              </strong>
            ),
            ul: ({ children }) => <ul className="my-2 ml-5 list-disc">{children}</ul>,
            li: ({ children }) => <li className="my-1">{children}</li>,
          }}
        >
          {narrative}
        </ReactMarkdown>
      </div>
    </div>
  );
}
