import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled Application Error caught by ErrorBoundary:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6 font-sans">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 border border-red-200 text-3xl flex items-center justify-center mx-auto">
              ⚠️
            </div>
            <h2 className="text-xl font-bold text-slate-900">Dashboard Render Warning</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              A temporary runtime glitch was prevented from interrupting your session.
            </p>
            {this.state.error?.message && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] font-mono text-red-600 text-left overflow-x-auto">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-colors"
            >
              Reload Dashboard
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
