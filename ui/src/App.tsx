import { useState, useEffect } from 'react'
import './App.css'

interface HealthStatus {
  status: string
  timestamp: string
}

interface HelloResponse {
  message: string
  timestamp: string
}

function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [message, setMessage] = useState<HelloResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check backend health
    fetch('http://localhost:8000/health')
      .then(res => res.json())
      .then(data => setHealth(data))
      .catch(err => console.error('Health check failed:', err))
      .finally(() => setLoading(false))
  }, [])

  const fetchMessage = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/hello')
      const data = await response.json()
      setMessage(data)
    } catch (err) {
      console.error('Failed to fetch message:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-6xl font-bold text-white mb-4">
              StarkMatter
            </h1>
            <p className="text-xl text-purple-300">
              A Modern Full-Stack Web Application
            </p>
          </div>

          {/* Status Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 mb-6">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Backend Status
            </h2>

            {loading ? (
              <div className="flex items-center text-gray-300">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Connecting to backend...
              </div>
            ) : health ? (
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="inline-block w-3 h-3 rounded-full bg-green-400 mr-3"></span>
                  <span className="text-white font-medium">
                    Status: {health.status}
                  </span>
                </div>
                <p className="text-gray-300 text-sm">
                  Last checked: {new Date(health.timestamp).toLocaleString()}
                </p>
              </div>
            ) : (
              <div className="flex items-center text-red-400">
                <span className="inline-block w-3 h-3 rounded-full bg-red-400 mr-3"></span>
                Backend is not responding
              </div>
            )}
          </div>

          {/* Interactive Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Test API Connection
            </h2>

            <button
              onClick={fetchMessage}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 mb-4"
            >
              Fetch Message from API
            </button>

            {message && (
              <div className="bg-black/30 rounded-lg p-4 border border-purple-500/50">
                <p className="text-white font-medium mb-2">
                  {message.message}
                </p>
                <p className="text-gray-400 text-sm">
                  Received: {new Date(message.timestamp).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center mt-12">
            <p className="text-purple-300 text-sm">
              Built with FastAPI, React, TypeScript, and Tailwind CSS
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
