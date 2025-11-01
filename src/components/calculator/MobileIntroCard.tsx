/**
 * MobileIntroCard Component
 *
 * Mobile-only welcome card shown before planning starts
 * or after calculation is complete.
 */

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Play } from 'lucide-react'
import { LoadScenarioDropdown } from '@/components/scenarios/LoadScenarioDropdown'
import { type FormData } from '@/lib/scenarios/scenario-mapper'
import { type VariantMetadata } from '@/lib/scenarios/variant-metadata'

interface MobileIntroCardProps {
  isDarkMode: boolean
  theme: any
  onStartPlanning: () => void
  onLoadScenario: (formData: FormData, scenarioName: string, variantMetadata?: VariantMetadata) => void
}

export function MobileIntroCard({
  isDarkMode,
  theme,
  onStartPlanning,
  onLoadScenario
}: MobileIntroCardProps) {
  return (
    <div className="lg:hidden">
      <Card className={`border-0 shadow-lg rounded-3xl ${theme.card}`}>
        <CardContent className="pt-6 sm:pt-8">
          <div className="py-6 sm:py-8 px-4 space-y-6">
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
                className={`${theme.button.secondary} text-white px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-semibold rounded-2xl shadow-xl w-full sm:w-auto`}
              >
                <Play className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                Create New Plan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
