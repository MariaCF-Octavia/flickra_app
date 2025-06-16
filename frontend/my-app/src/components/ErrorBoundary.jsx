import React from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

export class ErrorBoundary extends React.Component {
  state = { 
    hasError: false,
    error: null,
    errorInfo: null 
  };

  static getDerivedStateFromError(error) {
    return { 
      hasError: true,
      error 
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Cloudinary Error Boundary:", error, errorInfo);
    this.setState({ errorInfo });
    
    // Log to error tracking service if needed
    if (process.env.NODE_ENV === 'production') {
      // yourErrorTrackingService.log(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false,
      error: null,
      errorInfo: null 
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 text-center">
          <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg border border-red-100">
            <div className="text-red-500 mb-4">
              <FiAlertTriangle className="w-12 h-12 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {this.state.error instanceof Error ? this.state.error.message : 'Something went wrong'}
            </h2>
            
            <p className="text-gray-600 mb-6">
              {this.props.fallbackText || 'The Cloudinary editor encountered an error.'}
            </p>

            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <FiRefreshCw className="w-5 h-5" />
                Try Again
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                Reload Page
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <details className="mt-6 text-left text-sm text-gray-500">
                <summary className="cursor-pointer mb-2">Error Details</summary>
                <pre className="bg-gray-100 p-3 rounded overflow-auto max-h-40">
                  {this.state.error?.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

