'use client'

import { useEffect, useState } from 'react'
import CytoscapeComponent from 'react-cytoscapejs'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface RcaSummary {
  top_risk_supplier: string
  most_frequent_failure: string
  recurring_defect_percent: number
}

interface RcaGraphNode {
  id: string
  type: 'supplier' | 'model' | 'failure' | string
}

interface RcaGraphEdge {
  source: string
  target: string
  weight: number
}

interface RcaGraphResponse {
  nodes: RcaGraphNode[]
  edges: RcaGraphEdge[]
}

interface SupplierRiskRow {
  supplier: string
  risk_score: number
}

interface HeatmapRow {
  failure: string
  count: number
}

export default function RcaDashboard() {
  const [summary, setSummary] = useState<RcaSummary | null>(null)
  const [graph, setGraph] = useState<RcaGraphResponse | null>(null)
  const [supplierRisk, setSupplierRisk] = useState<SupplierRiskRow[]>([])
  const [heatmap, setHeatmap] = useState<HeatmapRow[]>([])
  const [selectedNode, setSelectedNode] = useState<RcaGraphNode | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setError(null)
        const [summaryRes, graphRes, supplierRes, heatmapRes] = await Promise.all([
          fetch('/api/rca/summary'),
          fetch('/api/rca/graph'),
          fetch('/api/rca/supplier-risk'),
          fetch('/api/rca/heatmap'),
        ])

        if (summaryRes.ok) {
          setSummary(await summaryRes.json())
        }
        if (graphRes.ok) {
          setGraph(await graphRes.json())
        }
        if (supplierRes.ok) {
          setSupplierRisk(await supplierRes.json())
        }
        if (heatmapRes.ok) {
          setHeatmap(await heatmapRes.json())
        }
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : 'Failed to load RCA data')
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
    const interval = setInterval(fetchAll, 30000)
    return () => clearInterval(interval)
  }, [])

  const elements =
    graph &&
    [
      // Nodes
      ...graph.nodes.map((n) => ({
        data: { id: n.id, label: n.id, type: n.type },
      })),
      // Edges
      ...graph.edges.map((e, idx) => ({
        data: {
          id: `e-${idx}`,
          source: e.source,
          target: e.target,
          weight: e.weight,
        },
      })),
    ]

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
                <h1 className="text-2xl font-bold text-ey-yellow">RCA Dashboard</h1>
                <p className="text-sm text-gray-400">
                  Root-cause analytics across suppliers, failures & models
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Mode</p>
              <p className="text-sm font-semibold">Root Cause Analytics (RCA)</p>
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

        {/* 1️⃣ Top KPI Tiles */}
        {summary && (
          <section>
            <h2 className="text-xl font-semibold text-ey-yellow mb-4">Top KPIs</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-ey-gray-light border-2 border-ey-yellow rounded-lg p-6">
                <p className="text-xs text-gray-400 mb-1">Top Risk Supplier</p>
                <p className="text-2xl font-bold text-ey-yellow">
                  {summary.top_risk_supplier}
                </p>
              </div>
              <div className="bg-ey-gray-light border-2 border-ey-yellow rounded-lg p-6">
                <p className="text-xs text-gray-400 mb-1">Most Frequent Failure</p>
                <p className="text-2xl font-bold text-ey-yellow">
                  {summary.most_frequent_failure}
                </p>
              </div>
              <div className="bg-ey-gray-light border-2 border-ey-yellow rounded-lg p-6">
                <p className="text-xs text-gray-400 mb-1">Recurring Defect %</p>
                <p className="text-2xl font-bold text-ey-yellow">
                  {summary.recurring_defect_percent.toFixed(1)}%
                </p>
              </div>
            </div>
          </section>
        )}

        {/* 2️⃣ Knowledge Graph & 3️⃣ Insight Panel */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-ey-yellow mb-4">
              Knowledge Graph
            </h2>
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl border-2 border-ey-yellow/30 h-[420px] p-4 shadow-2xl">
              {elements ? (
                <CytoscapeComponent
                  elements={elements}
                  style={{ width: '100%', height: '100%' }}
                  stylesheet={[
                    {
                      selector: 'node',
                      style: {
                        label: 'data(label)',
                        'background-color': '#FFBE00',
                        color: '#ffffff',
                        'font-size': 14,
                        'font-weight': 'bold',
                        'text-valign': 'center',
                        'text-halign': 'center',
                        'text-outline-width': 3,
                        'text-outline-color': '#000000',
                        width: 80,
                        height: 80,
                        'border-width': 3,
                        'border-color': '#FFBE00',
                        'border-opacity': 0.8,
                        'background-opacity': 0.95,
                        'overlay-padding': 8,
                        'shadow-blur': 20,
                        'shadow-opacity': 0.6,
                        'shadow-color': '#FFBE00',
                        'shadow-offset-x': 0,
                        'shadow-offset-y': 0,
                      },
                    },
                    {
                      selector: 'node[type = "supplier"]',
                      style: {
                        'background-color': '#3b82f6',
                        'border-color': '#60a5fa',
                        'shadow-color': '#3b82f6',
                      },
                    },
                    {
                      selector: 'node[type = "model"]',
                      style: {
                        'background-color': '#22c55e',
                        'border-color': '#4ade80',
                        'shadow-color': '#22c55e',
                      },
                    },
                    {
                      selector: 'node[type = "failure"]',
                      style: {
                        'background-color': '#ef4444',
                        'border-color': '#f87171',
                        'shadow-color': '#ef4444',
                      },
                    },
                    {
                      selector: 'node:selected',
                      style: {
                        'border-width': 5,
                        'border-color': '#FFBE00',
                        'shadow-blur': 30,
                        'shadow-opacity': 0.9,
                      },
                    },
                    {
                      selector: 'edge',
                      style: {
                        width: 'mapData(weight, 1, 100, 1, 3)',
                        'line-color': '#4a5568',
                        'target-arrow-color': '#4a5568',
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier',
                        opacity: 0.5,
                        'line-style': 'solid',
                        'arrow-scale': 1,
                      },
                    },
                    {
                      selector: 'edge:selected',
                      style: {
                        'line-color': '#FFBE00',
                        'target-arrow-color': '#FFBE00',
                        opacity: 0.8,
                        width: 'mapData(weight, 1, 100, 2, 4)',
                      },
                    },
                  ]}
                  layout={{
                    name: 'cose',
                    animate: true,
                    animationDuration: 1000,
                    nodeRepulsion: 15000,
                    idealEdgeLength: 150,
                    edgeElasticity: 100,
                    nestingFactor: 5,
                    gravity: 40,
                    numIter: 1000,
                    initialTemp: 200,
                    coolingFactor: 0.95,
                    minTemp: 1.0,
                  }}
                  cy={(cy) => {
                    cy.on('tap', 'node', (evt) => {
                      const node = evt.target
                      const type = (node.data('type') || 'unknown') as string
                      const id = node.data('id') as string
                      setSelectedNode({ id, type })
                    })
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-gray-400">
                  No graph data available.
                </div>
              )}
            </div>
          </div>

          {/* Insight Panel */}
          <div>
            <h2 className="text-xl font-semibold text-ey-yellow mb-4">Insight Panel</h2>
            <div className="bg-ey-gray-light rounded-xl border-2 border-ey-gray p-4 h-[420px] overflow-y-auto">
              {selectedNode ? (
                <div className="space-y-3 text-sm">
                  <p className="text-gray-300">
                    Selected:{' '}
                    <span className="font-semibold text-ey-yellow">
                      {selectedNode.id}
                    </span>{' '}
                    <span className="text-xs text-gray-500 uppercase ml-1">
                      ({selectedNode.type})
                    </span>
                  </p>
                  <hr className="border-ey-gray" />
                  {selectedNode.type === 'supplier' && supplierRisk.length > 0 && (
                    <>
                      {supplierRisk
                        .filter((s) => s.supplier === selectedNode.id)
                        .map((s) => (
                          <p key={s.supplier}>
                            <span className="text-ey-yellow font-semibold">
                              {s.supplier}
                            </span>{' '}
                            contributes to approximately{' '}
                            <span className="font-semibold">
                              {s.risk_score.toFixed(1)}%
                            </span>{' '}
                            of recorded recurring failures.
                          </p>
                        ))}
                    </>
                  )}
                  {selectedNode.type === 'failure' && heatmap.length > 0 && (
                    <>
                      {heatmap
                        .filter((h) => h.failure === selectedNode.id)
                        .map((h) => (
                          <p key={h.failure}>
                            Failure code{' '}
                            <span className="text-ey-yellow font-semibold">
                              {h.failure}
                            </span>{' '}
                            appears{' '}
                            <span className="font-semibold">{h.count}</span> times in
                            the cause graph, indicating a recurring defect hotspot.
                          </p>
                        ))}
                    </>
                  )}
                  {!(
                    (selectedNode.type === 'supplier' && supplierRisk.length > 0) ||
                    (selectedNode.type === 'failure' && heatmap.length > 0)
                  ) && (
                    <p className="text-gray-400">
                      No additional insights available for this node. Try selecting a
                      supplier or failure node.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-400">
                  Click any node in the knowledge graph to view contextual RCA insights.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* 4️⃣ Bottom Section: Heatmap + Supplier Risk Bar Chart */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Heatmap approximation as bar chart */}
          <div>
            <h2 className="text-xl font-semibold text-ey-yellow mb-4">
              Failure Heatmap
            </h2>
            <div className="bg-ey-gray-light rounded-xl border-2 border-ey-gray p-4 h-80">
              {heatmap.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={heatmap}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="failure" stroke="#999" />
                    <YAxis stroke="#999" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1A1A1A',
                        border: '1px solid #FFBE00',
                        color: '#fff',
                      }}
                      labelStyle={{ color: '#FFBE00' }}
                    />
                    <Bar dataKey="count" fill="#FFBE00" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-gray-400">
                  No heatmap data available.
                </div>
              )}
            </div>
          </div>

          {/* Supplier risk bar chart */}
          <div>
            <h2 className="text-xl font-semibold text-ey-yellow mb-4">
              Supplier Risk Ranking
            </h2>
            <div className="bg-ey-gray-light rounded-xl border-2 border-ey-gray p-4 h-80">
              {supplierRisk.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={supplierRisk}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="supplier" stroke="#999" />
                    <YAxis stroke="#999" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1A1A1A',
                        border: '1px solid #FFBE00',
                        color: '#fff',
                      }}
                      labelStyle={{ color: '#FFBE00' }}
                    />
                    <Bar dataKey="risk_score" fill="#E6A800" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-gray-400">
                  No supplier risk data available.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}