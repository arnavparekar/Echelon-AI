'use client'

import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface UebaSummary {
  highest_risk_agent: string
  risk_score: number
}

interface UebaRankingRow {
  agent_id: string
  risk_score: number
}

interface UebaAgentProfile {
  failure_rate: number
  avg_latency: number
  avg_tokens: number
  off_hours: number
  [key: string]: number
}

interface UebaExplainResponse {
  agent: string
  risk_factors: string[]
  stats: {
    failure_rate: number
    avg_latency: number
    avg_tokens: number
    off_hours: number
  }
}

interface UebaRiskTrendPoint {
  date: string
  risk: number
}

export default function UebaDashboard() {
  const [summary, setSummary] = useState<UebaSummary | null>(null)
  const [ranking, setRanking] = useState<UebaRankingRow[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [profile, setProfile] = useState<UebaAgentProfile | null>(null)
  const [explanation, setExplanation] = useState<UebaExplainResponse | null>(null)
  const [trend, setTrend] = useState<UebaRiskTrendPoint[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch summary + ranking periodically
  useEffect(() => {
    const fetchSummaryAndRanking = async () => {
      try {
        setError(null)
        const [summaryRes, rankingRes] = await Promise.all([
          fetch('/api/ueba/summary'),
          fetch('/api/ueba/risk-ranking'),
        ])

        if (!summaryRes.ok) {
          throw new Error('Failed to fetch UEBA summary')
        }
        if (!rankingRes.ok) {
          throw new Error('Failed to fetch UEBA risk ranking')
        }

        const summaryData: UebaSummary = await summaryRes.json()
        const rankingData: UebaRankingRow[] = await rankingRes.json()

        setSummary(summaryData)
        setRanking(rankingData)

        // Auto-select highest risk agent if none selected
        if (!selectedAgent && summaryData.highest_risk_agent) {
          setSelectedAgent(summaryData.highest_risk_agent)
        }
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : 'Failed to load UEBA data')
      } finally {
        setLoading(false)
      }
    }

    fetchSummaryAndRanking()
    const interval = setInterval(fetchSummaryAndRanking, 30000)
    return () => clearInterval(interval)
  }, [selectedAgent])

  // Fetch agent-specific sections when selectedAgent changes
  useEffect(() => {
    if (!selectedAgent) return

    const fetchAgentData = async () => {
      try {
        setError(null)
        const [profileRes, explainRes, trendRes] = await Promise.all([
          fetch(`/api/ueba/agent/${selectedAgent}`),
          fetch(`/api/ueba/explain/${selectedAgent}`),
          fetch(`/api/ueba/risk-trend/${selectedAgent}`),
        ])

        if (profileRes.ok) {
          const profileData = await profileRes.json()
          setProfile(profileData)
        } else {
          setProfile(null)
        }

        if (explainRes.ok) {
          const explainData: UebaExplainResponse = await explainRes.json()
          setExplanation(explainData)
        } else {
          setExplanation(null)
        }

        if (trendRes.ok) {
          const trendData: UebaRiskTrendPoint[] = await trendRes.json()
          setTrend(trendData)
        } else {
          setTrend([])
        }
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : 'Failed to load agent details')
      }
    }

    fetchAgentData()
  }, [selectedAgent])

  const isHighRisk = summary && summary.risk_score > 75

  return (
    <main className="min-h-screen bg-ey-black text-white">
      {/* Header */}
      <header className="bg-ey-gray border-b-2 border-ey-yellow">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-ey-yellow rounded-lg flex items-center justify-center">
                <span className="text-ey-black font-bold text-xl">EY</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-ey-yellow">UEBA Dashboard</h1>
                <p className="text-sm text-gray-400">
                  Agent behaviour & risk monitoring for Agentic AI workflows
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Mode</p>
              <p className="text-sm font-semibold">User & Entity Behaviour Analytics</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-300 px-4 py-2 rounded">
            {error}
          </div>
        )}

        {loading && !summary ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-ey-gray-light border-2 border-ey-gray rounded-lg p-6 animate-pulse"
              >
                <div className="h-4 w-24 bg-ey-gray rounded mb-4" />
                <div className="h-8 w-32 bg-ey-gray rounded" />
              </div>
            ))}
          </div>
        ) : null}

        {/* 1️⃣ Executive Snapshot */}
        {summary && (
          <section>
            <h2 className="text-xl font-semibold text-ey-yellow mb-4">
              Executive Snapshot
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <div className="bg-ey-gray-light border-2 border-ey-yellow rounded-xl p-6 flex items-center justify-between relative overflow-hidden">
                  {/* Pulse ring for high risk */}
                  {isHighRisk && (
                    <div className="absolute -inset-0.5 border-2 border-red-500 rounded-xl animate-ping opacity-30 pointer-events-none" />
                  )}
                  <div>
                    <p className="text-sm text-gray-400">Highest Risk Agent</p>
                    <h3 className="text-2xl md:text-3xl font-bold text-ey-yellow mt-1">
                      {summary.highest_risk_agent}
                    </h3>
                    <p className="mt-4 text-xs uppercase tracking-wide text-gray-400">
                      System Status
                    </p>
                    <p
                      className={`text-sm font-semibold ${
                        isHighRisk ? 'text-red-400' : 'text-green-400'
                      }`}
                    >
                      {isHighRisk ? 'Immediate Attention Required' : 'Normal'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="text-xs text-gray-400 mb-2">Risk Score</p>
                    <div
                      className={`relative flex items-center justify-center w-24 h-24 rounded-full border-4 ${
                        isHighRisk ? 'border-red-500' : 'border-ey-yellow'
                      }`}
                    >
                      {isHighRisk && (
                        <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-pulse opacity-40" />
                      )}
                      <span className="text-3xl font-extrabold">
                        {summary.risk_score.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">0 – 100 risk index</p>
                  </div>
                </div>
              </div>

              {/* Quick stats from explanation if available */}
              {explanation && (
                <div className="bg-ey-gray-light border border-ey-gray rounded-xl p-4 space-y-3">
                  <p className="text-sm font-semibold text-ey-yellow">
                    Behaviour Snapshot
                  </p>
                  <div className="text-xs text-gray-300 space-y-1">
                    <p>
                      Failure rate:{' '}
                      <span className="font-semibold">
                        {(explanation.stats.failure_rate * 100).toFixed(1)}%
                      </span>
                    </p>
                    <p>
                      Avg latency:{' '}
                      <span className="font-semibold">
                        {explanation.stats.avg_latency.toFixed(0)} ms
                      </span>
                    </p>
                    <p>
                      Avg tokens:{' '}
                      <span className="font-semibold">
                        {explanation.stats.avg_tokens.toFixed(0)}
                      </span>
                    </p>
                    <p>
                      Off-hours actions:{' '}
                      <span className="font-semibold">
                        {explanation.stats.off_hours}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 2️⃣ Agent Risk Leaderboard & 3️⃣ Selected Agent Profile */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-ey-yellow mb-4">
              Agent Risk Leaderboard
            </h2>
            <div className="bg-ey-gray-light rounded-xl border-2 border-ey-gray overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-ey-gray">
                    <tr>
                      <th className="text-left px-4 py-3 text-ey-yellow">Agent ID</th>
                      <th className="text-left px-4 py-3 text-ey-yellow">Risk Score</th>
                      <th className="text-left px-4 py-3 text-ey-yellow">Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.map((row) => {
                      let level = 'Normal'
                      let levelColor = 'text-green-400'
                      if (row.risk_score > 80) {
                        level = 'High'
                        levelColor = 'text-red-400'
                      } else if (row.risk_score >= 60) {
                        level = 'Medium'
                        levelColor = 'text-orange-300'
                      }

                      const isSelected = selectedAgent === row.agent_id

                      return (
                        <tr
                          key={row.agent_id}
                          onClick={() => setSelectedAgent(row.agent_id)}
                          className={`border-t border-ey-gray cursor-pointer hover:bg-ey-gray ${
                            isSelected ? 'bg-ey-gray' : ''
                          }`}
                        >
                          <td className="px-4 py-3">
                            <span className="font-mono">{row.agent_id}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-3">
                              <div className="flex-1 h-2 bg-ey-gray rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${
                                    row.risk_score > 80
                                      ? 'bg-red-500'
                                      : row.risk_score >= 60
                                      ? 'bg-orange-400'
                                      : 'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min(row.risk_score, 100)}%` }}
                                />
                              </div>
                              <span className="w-12 text-right">
                                {row.risk_score.toFixed(1)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 text-xs rounded-full border ${levelColor} border-current`}
                            >
                              {level}
                            </span>
                          </td>
                        </tr>
                      )
                    })}

                    {ranking.length === 0 && !loading && (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-6 text-center text-gray-400 text-sm"
                        >
                          No agent risk data available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Selected agent behavioural profile */}
          <div>
            <h2 className="text-xl font-semibold text-ey-yellow mb-4">
              Selected Agent Profile
            </h2>
            <div className="bg-ey-gray-light rounded-xl border-2 border-ey-gray p-4 space-y-3">
              {selectedAgent ? (
                <>
                  <p className="text-sm text-gray-300 mb-2">
                    Agent:{' '}
                    <span className="font-mono font-semibold">
                      {selectedAgent}
                    </span>
                  </p>
                  {profile ? (
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-ey-gray rounded-lg p-3 border border-ey-gray">
                        <p className="text-gray-400 mb-1">Failure Rate</p>
                        <p className="text-lg font-bold text-ey-yellow">
                          {(profile.failure_rate * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div className="bg-ey-gray rounded-lg p-3 border border-ey-gray">
                        <p className="text-gray-400 mb-1">Avg Latency</p>
                        <p className="text-lg font-bold text-ey-yellow">
                          {profile.avg_latency.toFixed(0)} ms
                        </p>
                      </div>
                      <div className="bg-ey-gray rounded-lg p-3 border border-ey-gray">
                        <p className="text-gray-400 mb-1">Avg Tokens</p>
                        <p className="text-lg font-bold text-ey-yellow">
                          {profile.avg_tokens.toFixed(0)}
                        </p>
                      </div>
                      <div className="bg-ey-gray rounded-lg p-3 border border-ey-gray">
                        <p className="text-gray-400 mb-1">Off-hours Activity</p>
                        <p className="text-lg font-bold text-ey-yellow">
                          {profile.off_hours}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">
                      No profile metrics available for this agent.
                    </p>
                  )}
                </>
              ) : (
                <p className="text-xs text-gray-400">
                  Select an agent from the leaderboard to see its behavioural profile.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* 4️⃣ Risk Explanation Engine & 5️⃣ Risk Timeline */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Risk Explanation */}
          <div>
            <h2 className="text-xl font-semibold text-ey-yellow mb-4">
              Risk Explanation Engine
            </h2>
            <div className="bg-ey-gray-light rounded-xl border-2 border-ey-gray p-4">
              {explanation && explanation.risk_factors.length > 0 ? (
                <div className="space-y-3">
                  {explanation.risk_factors.map((reason, idx) => {
                    const severe =
                      reason.toLowerCase().includes('high failure') ||
                      reason.toLowerCase().includes('excessive')
                    const medium =
                      !severe &&
                      (reason.toLowerCase().includes('unusually') ||
                        reason.toLowerCase().includes('degradation'))

                    const colorClass = severe
                      ? 'text-red-400'
                      : medium
                      ? 'text-orange-300'
                      : 'text-ey-yellow'

                    return (
                      <div
                        key={idx}
                        className="flex items-start space-x-2 text-sm text-gray-200"
                      >
                        <span className={colorClass}>
                          {/* simple warning glyph, can be styled as icon */}
                          ⚠
                        </span>
                        <p>{reason}</p>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-400">
                  Select an agent to view its risk explanation.
                </p>
              )}
            </div>
          </div>

          {/* Risk Timeline */}
          <div>
            <h2 className="text-xl font-semibold text-ey-yellow mb-4">
              Agent Risk Timeline
            </h2>
            <div className="bg-ey-gray-light rounded-xl border-2 border-ey-gray p-4 h-80">
              {trend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" stroke="#999" />
                    <YAxis stroke="#999" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1A1A1A',
                        border: '1px solid #FFBE00',
                        color: '#fff',
                      }}
                      labelStyle={{ color: '#FFBE00' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="risk"
                      stroke="#FFBE00"
                      strokeWidth={3}
                      dot={{ r: 4, stroke: '#FFBE00', strokeWidth: 2, fill: '#000000' }}
                      activeDot={{ r: 6, stroke: '#FF0000', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-gray-400">
                  No risk trend data available for this agent.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}


