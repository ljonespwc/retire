'use client'

import { useLayercodeVoice } from '@/hooks/useLayercodeVoice'
import { useState } from 'react'

export function TestVoiceContent() {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([])
  const [dataMessages, setDataMessages] = useState<any[]>([])
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const [collectedData, setCollectedData] = useState<any | null>(null)
  const [isComplete, setIsComplete] = useState(false)

  const {
    isConnected,
    isConnecting,
    connectionStatus,
    userAudioLevel,
    agentAudioLevel,
    conversationId,
    connect,
    disconnect,
    startNewConversation
  } = useLayercodeVoice({
    autoConnect: false,
    onDataMessage: (data) => {
      console.log('Data message received:', data)
      setDataMessages(prev => [...prev, data])

      // Track progress
      if (data.type === 'progress') {
        setProgress({ current: data.current, total: data.total })
      }

      // Track completion
      if (data.type === 'complete') {
        setIsComplete(true)
        setCollectedData(data.collectedData)
        console.log('✅ Conversation complete! Collected data:', data.collectedData)
      }
    }
  })

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Voice Integration Test
          </h1>
          <p className="text-gray-600">
            Testing Layercode WebRTC voice connection
          </p>
        </div>

        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Connection Status</h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                isConnected ? 'bg-green-100 text-green-800' :
                isConnecting ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {connectionStatus}
              </span>
            </div>

            {conversationId && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Conversation ID:</span>
                <span className="text-xs text-gray-600 font-mono">
                  {conversationId.substring(0, 16)}...
                </span>
              </div>
            )}

            {/* Audio Levels */}
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">User Audio:</span>
                  <span className="text-gray-600">{Math.round((userAudioLevel || 0) * 100)}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-100"
                    style={{ width: `${(userAudioLevel || 0) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">Agent Audio:</span>
                  <span className="text-gray-600">{Math.round((agentAudioLevel || 0) * 100)}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-100"
                    style={{ width: `${(agentAudioLevel || 0) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-6 flex gap-3">
            {!isConnected && !isConnecting && (
              <button
                onClick={connect}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Connect & Start
              </button>
            )}

            {isConnected && (
              <>
                <button
                  onClick={disconnect}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Disconnect
                </button>
                <button
                  onClick={startNewConversation}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  New Conversation
                </button>
              </>
            )}
          </div>
        </div>

        {/* Progress Indicator */}
        {progress && !isComplete && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Collecting Retirement Data</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
              </div>
              <span className="text-sm font-medium text-blue-900">
                {progress.current} / {progress.total}
              </span>
            </div>
          </div>
        )}

        {/* Collected Data Display */}
        {isComplete && collectedData && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-green-900 mb-4">✅ Data Collection Complete!</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {collectedData.currentAge && (
                <div>
                  <span className="font-medium text-gray-700">Current Age:</span>
                  <span className="ml-2 text-gray-900">{collectedData.currentAge}</span>
                </div>
              )}
              {collectedData.retirementAge && (
                <div>
                  <span className="font-medium text-gray-700">Retirement Age:</span>
                  <span className="ml-2 text-gray-900">{collectedData.retirementAge}</span>
                </div>
              )}
              {collectedData.province && (
                <div>
                  <span className="font-medium text-gray-700">Province:</span>
                  <span className="ml-2 text-gray-900">{collectedData.province}</span>
                </div>
              )}
              {collectedData.rrsp && (
                <div>
                  <span className="font-medium text-gray-700">RRSP:</span>
                  <span className="ml-2 text-gray-900">${collectedData.rrsp.toLocaleString()}</span>
                </div>
              )}
              {collectedData.tfsa && (
                <div>
                  <span className="font-medium text-gray-700">TFSA:</span>
                  <span className="ml-2 text-gray-900">${collectedData.tfsa.toLocaleString()}</span>
                </div>
              )}
              {collectedData.non_registered && (
                <div>
                  <span className="font-medium text-gray-700">Non-Registered:</span>
                  <span className="ml-2 text-gray-900">${collectedData.non_registered.toLocaleString()}</span>
                </div>
              )}
              {collectedData.monthlySpending && (
                <div>
                  <span className="font-medium text-gray-700">Monthly Spending:</span>
                  <span className="ml-2 text-gray-900">${collectedData.monthlySpending.toLocaleString()}</span>
                </div>
              )}
              {collectedData.investmentReturn && (
                <div>
                  <span className="font-medium text-gray-700">Investment Return:</span>
                  <span className="ml-2 text-gray-900">{collectedData.investmentReturn}%</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">How to Test:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
            <li>Click "Connect & Start" to establish voice connection</li>
            <li>Answer the retirement planning questions naturally</li>
            <li>The AI will guide you through ~11 questions</li>
            <li>Watch the progress bar as you go</li>
            <li>See your collected data displayed at the end</li>
          </ol>
        </div>

        {/* Data Messages */}
        {dataMessages.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Data Messages</h2>
            <div className="space-y-2">
              {dataMessages.map((msg, idx) => (
                <div key={idx} className="text-xs font-mono bg-gray-50 p-2 rounded">
                  {JSON.stringify(msg, null, 2)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Environment Check */}
        <div className="mt-6 bg-gray-100 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Environment:</h3>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-medium">Pipeline ID:</span>
              <span className={process.env.NEXT_PUBLIC_LAYERCODE_PIPELINE_ID ? 'text-green-600' : 'text-red-600'}>
                {process.env.NEXT_PUBLIC_LAYERCODE_PIPELINE_ID ? '✓ Set' : '✗ Not set'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
