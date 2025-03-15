/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'

interface PrescriptionCheckLog {
    id: number
    patient_id: number
    model_used?: string
    result_json: string
    task_name?: string
    created_at: string
}

export default function PrescriptionCheckPage() {
    const [patientId, setPatientId] = useState<number>(0)
    const [additionalContext, setAdditionalContext] = useState('')
    const [logs, setLogs] = useState<PrescriptionCheckLog[]>([])
    const [selectedLog, setSelectedLog] = useState<PrescriptionCheckLog | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Fetch logs on initial mount
    useEffect(() => {
        fetchLogs()
    }, [])

    // Fetch logs, sort by created_at descending, and auto-select newest log
    async function fetchLogs() {
        try {
            const res = await fetch('http://localhost:8000/inference/prescription-check-logs')
            if (!res.ok) {
                throw new Error(`Error fetching logs: ${res.status}`)
            }
            const data: PrescriptionCheckLog[] = await res.json()
            // Sort logs so that the newest log appears first
            data.sort(
                (a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
            setLogs(data)
            // Auto-select the newest log
            if (data.length > 0) {
                setSelectedLog(data[0])
            } else {
                setSelectedLog(null)
            }
        } catch (err: any) {
            setError(err.message)
        }
    }

    // Create a new prescription check and re-fetch logs; newest will be auto-selected.
    async function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            const formData = new FormData()
            formData.append('patient_id', String(patientId))
            formData.append('additional_context', additionalContext)

            const res = await fetch('http://localhost:8000/inference/prescription-check', {
                method: 'POST',
                body: formData,
            })
            if (!res.ok) {
                throw new Error(`Failed to create prescription check: ${res.status}`)
            }
            await res.json()
            // Re-fetch logs so the newest prescription is automatically selected.
            await fetchLogs()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    // Manually select a log from the sidebar.
    async function handleSelectLog(logId: number) {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`http://localhost:8000/inference/prescription-check-logs/${logId}`)
            if (!res.ok) {
                throw new Error(`Error fetching log by ID: ${res.status}`)
            }
            const data: PrescriptionCheckLog = await res.json()
            setSelectedLog(data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    // Parse the stored JSON from the selected log.
    let parsedResult: any = null
    if (selectedLog) {
        try {
            parsedResult = JSON.parse(selectedLog.result_json)
        } catch (err) {
            parsedResult = { error: 'Failed to parse result JSON' }
        }
    }

    return (
        <div className="min-h-screen flex">
            {/* Sidebar with logs */}
            <aside className="w-64 bg-gray-100 border-r border-gray-300 p-4">
                <h2 className="font-bold text-lg mb-2">Prescription Check Logs</h2>
                {logs.length === 0 ? (
                    <p className="text-gray-600 text-sm">No logs available.</p>
                ) : (
                    <ul className="space-y-1">
                        {logs.map((log) => (
                            <li
                                key={log.id}
                                className={`cursor-pointer p-2 rounded ${selectedLog?.id === log.id ? 'bg-blue-100' : 'hover:bg-gray-200'
                                    }`}
                                onClick={() => handleSelectLog(log.id)}
                            >
                                <div className="font-semibold">
                                    {log.task_name || `Log #${log.id}`}
                                </div>
                                <div className="text-xs text-gray-600">
                                    {new Date(log.created_at).toLocaleString()}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </aside>

            {/* Main content */}
            <main className="flex-1 p-4">
                <h1 className="text-2xl font-bold mb-4">Prescription Check</h1>

                {/* Form to create a new prescription check */}
                <form onSubmit={handleCreate} className="space-y-4 max-w-md mb-8">
                    <div>
                        <label className="block mb-1 font-semibold">Patient ID</label>
                        <input
                            type="number"
                            value={patientId}
                            onChange={(e) => setPatientId(Number(e.target.value))}
                            className="border p-2 w-full"
                            required
                        />
                    </div>
                    <div>
                        <label className="block mb-1 font-semibold">Additional Context</label>
                        <textarea
                            value={additionalContext}
                            onChange={(e) => setAdditionalContext(e.target.value)}
                            className="border p-2 w-full"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Generating...' : 'Generate Prescription'}
                    </button>
                </form>

                {/* Display the selected log details */}
                {selectedLog ? (
                    <div className="p-4 border border-gray-200 rounded">
                        <h2 className="text-xl font-bold mb-2">
                            {selectedLog.task_name || 'Selected Prescription'}
                        </h2>
                        <p className="text-sm text-gray-600 mb-2">
                            Created: {new Date(selectedLog.created_at).toLocaleString()}
                        </p>
                        {parsedResult && (
                            <div className="space-y-4">
                                <div>
                                    <span className="font-semibold">Sickness Name: </span>
                                    {parsedResult.sickness_name}
                                </div>
                                {/* Display medications in a grid */}
                                <div>
                                    <h3 className="font-semibold mb-2">Medications:</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {parsedResult.medications &&
                                            Array.isArray(parsedResult.medications) &&
                                            parsedResult.medications.map((med: any, idx: number) => (
                                                <div key={idx} className="border p-2 rounded bg-gray-50">
                                                    <p className="font-semibold">{med.name}</p>
                                                    <p>Quantity: {med.quantity}</p>
                                                    <p>Frequency: {med.frequency}</p>
                                                    <p>Route: {med.route}</p>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                                <div>
                                    <span className="font-semibold">Start Date: </span>
                                    {parsedResult.start_date}
                                </div>
                                <div>
                                    <span className="font-semibold">End Date: </span>
                                    {parsedResult.end_date}
                                </div>
                                <div>
                                    <span className="font-semibold">Final Verdict: </span>
                                    {parsedResult.final_verdict}
                                </div>
                                <div className="text-gray-600 text-sm">
                                    <span className="font-semibold">Analysis Time:</span>{' '}
                                    {parsedResult.analysis_time}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-gray-600">No prescription check selected.</p>
                )}

                {error && <div className="text-red-500 mt-4">{error}</div>}
            </main>
        </div>
    )
}
