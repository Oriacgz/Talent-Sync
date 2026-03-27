import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    // Keep diagnostics available for debugging without crashing the whole app.
    console.error('Application render error:', error)
  }

  handleRetry = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="neo-shell flex min-h-screen items-center justify-center p-4">
          <div className="card-base stack-dense max-w-lg text-center">
            <p className="text-primary-hero">Something went wrong</p>
            <p className="text-secondary">A render error occurred. Retry to continue using the dashboard.</p>
            <div className="pt-2">
              <button type="button" onClick={this.handleRetry} className="btn-secondary btn-feedback">
                Retry
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
