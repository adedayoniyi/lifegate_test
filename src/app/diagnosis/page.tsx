/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'

interface DiagnosisLog {
    id: number
    patient_id: number
    model_used?: string
    result_json: string
    task_name?: string
    created_at: string
}

export default function DiagnosisPage() {
    const [patientId, setPatientId] = useState<number>(0)
    const [additionalContext, setAdditionalContext] = useState('')
    const [diagnosisLogs, setDiagnosisLogs] = useState<DiagnosisLog[]>([])
    const [selectedLog, setSelectedLog] = useState<DiagnosisLog | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Fetch logs on mount
    useEffect(() => {
        fetchLogs()
    }, [])

    // Fetch all diagnosis logs and automatically select the newest log.
    async function fetchLogs() {
        try {
            const res = await fetch('http://localhost:8000/inference/diagnosis-logs')
            if (!res.ok) {
                throw new Error(`Error fetching logs: ${res.status}`)
            }
            const data: DiagnosisLog[] = await res.json()
            // Sort descending by created_at (newest first)
            data.sort(
                (a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
            setDiagnosisLogs(data)
            // Automatically select the newest log
            if (data.length > 0) {
                setSelectedLog(data[0])
            } else {
                setSelectedLog(null)
            }
        } catch (err: any) {
            setError(err.message)
        }
    }

    // Create a new diagnosis and then re-fetch logs,
    // automatically selecting the newest record.
    async function handleCreateDiagnosis(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            const formData = new FormData()
            formData.append('patient_id', String(patientId))
            formData.append('additional_context', additionalContext)

            const res = await fetch('http://localhost:8000/inference/diagnosis', {
                method: 'POST',
                body: formData,
            })
            if (!res.ok) {
                throw new Error(`Failed to create diagnosis: ${res.status}`)
            }
            // We don't need to use the POST response directly because
            // we'll re-fetch the logs and select the latest one.
            await res.json()
            await fetchLogs() // re-fetch logs; the newest should be selected automatically
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    // Fetch a log by ID and set it as selected.
    async function handleSelectLog(logId: number) {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`http://localhost:8000/inference/diagnosis-logs/${logId}`)
            if (!res.ok) {
                throw new Error(`Error fetching log by ID: ${res.status}`)
            }
            const data: DiagnosisLog = await res.json()
            setSelectedLog(data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    // Parse the stored JSON (result_json) from the selected log.
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
            {/* Sidebar */}
            <aside className="w-64 bg-gray-100 border-r border-gray-300 p-4">
                <h2 className="font-bold text-lg mb-2">Diagnosis Logs</h2>
                {diagnosisLogs.length === 0 ? (
                    <p className="text-gray-600 text-sm">No diagnosis logs available.</p>
                ) : (
                    <ul className="space-y-1">
                        {diagnosisLogs.map((log) => (
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
                                    Created: {new Date(log.created_at).toLocaleString()}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4">
                <h1 className="text-2xl font-bold mb-4">Diagnosis</h1>

                {/* Form */}
                <form onSubmit={handleCreateDiagnosis} className="space-y-4 max-w-md mb-8">
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
                        {loading ? 'Generating Diagnosis...' : 'Generate Diagnosis'}
                    </button>
                </form>

                {/* Display Selected Log Details */}
                {selectedLog ? (
                    <div className="p-4 border border-gray-200 rounded">
                        <h2 className="text-xl font-bold mb-2">
                            {selectedLog.task_name || 'Selected Diagnosis'}
                        </h2>
                        <p className="text-sm text-gray-600 mb-2">
                            Created: {new Date(selectedLog.created_at).toLocaleString()}
                        </p>
                        <pre className="bg-gray-50 p-2 rounded text-sm whitespace-pre-wrap">
                            {JSON.stringify(parsedResult, null, 2)}
                        </pre>
                    </div>
                ) : (
                    <p className="text-gray-600">No diagnosis selected.</p>
                )}

                {error && <div className="text-red-500 mt-4">{error}</div>}
            </main>
        </div>
    )
}
