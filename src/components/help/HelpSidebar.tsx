/**
 * HelpSidebar Component
 *
 * Displays contextual help tips based on focused field,
 * or shows welcome state / load scenario options when appropriate.
 */

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Play, Lightbulb } from 'lucide-react'
import { HELP_TIPS } from '@/lib/calculator/help-tips'
import { LoadScenarioDropdown } from '@/components/scenarios/LoadScenarioDropdown'
import { CalculationResults } from '@/types/calculator'
import { type FormData } from '@/lib/scenarios/scenario-mapper'
import { type VariantMetadata } from '@/lib/scenarios/variant-metadata'

interface HelpSidebarProps {
  focusedField: string | null
  isDarkMode: boolean
  theme: any
  onStartPlanning: () => void
  onLoadScenario: (formData: FormData, scenarioName: string, variantMetadata?: VariantMetadata) => void
  planningStarted: boolean
  calculationResults: CalculationResults | null
  isMandatoryFieldsComplete: () => boolean
}

export function HelpSidebar({
  focusedField,
  isDarkMode,
  theme,
  onStartPlanning,
  onLoadScenario,
  planningStarted,
  calculationResults,
  isMandatoryFieldsComplete
}: HelpSidebarProps) {
  const tip = focusedField && HELP_TIPS[focusedField] ? HELP_TIPS[focusedField] : null

  return (
    <Card className={`border-0 shadow-lg rounded-3xl ${theme.card} h-full`}>
      <CardContent className="pt-6 sm:pt-8 lg:pt-10">
        {tip ? (
          // Show tooltip when field is focused (highest priority)
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{tip.icon}</span>
              <h3 className={`text-xl font-bold ${theme.text.primary}`}>{tip.title}</h3>
            </div>
            <div className="space-y-3">
              {tip.content.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className={`${theme.text.secondary} text-base leading-relaxed`}>
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        ) : !planningStarted || calculationResults ? (
          // Show welcome state if not started yet OR after calculation
          <div className="py-6 sm:py-8 lg:py-10 px-4 space-y-6">
            <div className="text-center space-y-4">
              <div className="text-6xl">🇨🇦</div>
              <h2 className={`text-2xl font-bold ${theme.text.primary}`}>Let's Plan Your Retirement</h2>
              <p className={`${theme.text.secondary} text-base leading-relaxed`}>
                Fill out the form to see your personalized retirement projection. We'll calculate your income, taxes, and portfolio balance year by year.
              </p>
            </div>

            {/* Load Saved Scenario */}
            <div className="max-w-xs mx-auto">
              <LoadScenarioDropdown
                onLoad={onLoadScenario}
                isDarkMode={isDarkMode}
              />
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 my-4">
              <div className={`flex-1 h-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
              <span className={`text-sm ${theme.text.muted}`}>or</span>
              <div className={`flex-1 h-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
            </div>

            {/* Create New Plan Button */}
            <div className="text-center">
              <Button
                onClick={onStartPlanning}
                size="lg"
                className={`${theme.button.secondary} text-white px-6 sm:px-8 lg:px-10 py-5 sm:py-6 lg:py-7 text-base sm:text-lg font-semibold rounded-2xl shadow-xl w-full sm:w-auto`}
              >
                <Play className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                Create New Plan
              </Button>
            </div>
          </div>
        ) : isMandatoryFieldsComplete() ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">✅</span>
              <h3 className={`text-xl font-bold ${theme.text.primary}`}>Ready to Calculate</h3>
            </div>
            <p className={`${theme.text.secondary} text-base leading-relaxed`}>
              All required fields are complete! Click the <strong>Calculate</strong> button to see your personalized retirement projection.
            </p>
            <p className={`${theme.text.secondary} text-base leading-relaxed`}>
              You can add more details (like RRSP contributions or pension income) to get a more accurate projection, or calculate now and refine later.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Lightbulb className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-orange-500'}`} />
              <h3 className={`text-xl font-bold ${theme.text.primary}`}>Pro Tip</h3>
            </div>
            <p className={`${theme.text.secondary} text-base leading-relaxed`}>
              Click on any field to see helpful information about what it means and how it affects your retirement plan.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
