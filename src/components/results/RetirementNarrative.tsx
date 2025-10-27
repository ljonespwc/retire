'use client';

import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { CalculationResults } from '@/types/calculator';

interface RetirementNarrativeProps {
  results: CalculationResults;
  isDarkMode?: boolean;
}

export function RetirementNarrative({ results, isDarkMode = false }: RetirementNarrativeProps) {
  const [narrative, setNarrative] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchNarrative() {
      try {
        console.log('📖 RetirementNarrative: Starting narrative generation...');
        setIsLoading(true);
        setError(false);

        // Call server-side API route
        const response = await fetch('/api/generate-narrative', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ results }),
        });

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();

        if (isMounted) {
          setNarrative(data.narrative);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('❌ RetirementNarrative: Failed to generate narrative:', err);
        if (isMounted) {
          setError(true);
          setIsLoading(false);
        }
      }
    }

    fetchNarrative();

    return () => {
      isMounted = false;
    };
  }, [results]);

  // Don't render if error occurred (graceful degradation)
  if (error) {
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

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-2 animate-pulse">
          <div className={`h-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded w-full`}></div>
          <div className={`h-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded w-5/6`}></div>
          <div className={`h-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded w-4/6`}></div>
        </div>
      )}

      {/* Narrative Content */}
      {!isLoading && narrative && (
        <p className={`${textColor} leading-relaxed text-[15px]`}>
          {narrative}
        </p>
      )}
    </div>
  );
}
