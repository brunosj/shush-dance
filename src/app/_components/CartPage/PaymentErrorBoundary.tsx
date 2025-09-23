import React from 'react';

interface PaymentErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface PaymentErrorBoundaryProps {
  children: React.ReactNode;
  onRetry?: () => void;
}

class PaymentErrorBoundary extends React.Component<
  PaymentErrorBoundaryProps,
  PaymentErrorBoundaryState
> {
  constructor(props: PaymentErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): PaymentErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error for debugging
    console.error('PaymentErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    // Reset the error boundary
    this.setState({ hasError: false, error: undefined });

    // Call the optional retry callback
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className='bg-red-50 border border-red-200 rounded-lg p-6 text-center'>
          <div className='mb-4'>
            <svg
              className='mx-auto h-12 w-12 text-red-400'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
              />
            </svg>
          </div>
          <h3 className='text-lg font-medium text-red-800 mb-2'>
            Payment System Error
          </h3>
          <p className='text-red-600 mb-4'>
            Something went wrong with the payment system. Please try again or
            refresh the page.
          </p>
          <div className='space-x-3'>
            <button
              onClick={this.handleRetry}
              className='bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors'
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className='bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors'
            >
              Refresh Page
            </button>
          </div>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className='mt-4 text-left'>
              <summary className='text-red-800 cursor-pointer'>
                Error Details (Development Only)
              </summary>
              <pre className='mt-2 text-xs text-red-700 bg-red-100 p-2 rounded overflow-x-auto'>
                {this.state.error.toString()}
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default PaymentErrorBoundary;
