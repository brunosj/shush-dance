'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface PaymentMonitorProps {
  isEnabled?: boolean;
}

const PaymentMonitor: React.FC<PaymentMonitorProps> = ({ isEnabled }) => {
  const pathname = usePathname();
  const lastTestTime = useRef<number>(0);
  const hasTestedThisSession = useRef<boolean>(false);

  // Auto-detect if monitoring should be enabled (default: only in production)
  const shouldEnable =
    isEnabled ??
    (() => {
      // Check environment variable override first
      if (typeof window !== 'undefined') {
        const envOverride = process.env.NEXT_PUBLIC_ENABLE_PAYMENT_MONITOR;
        if (envOverride === 'true') return true;
        if (envOverride === 'false') return false;
      }

      // Auto-detect production environments
      return (
        typeof window !== 'undefined' &&
        (window.location.hostname === 'shush.dance' ||
          window.location.hostname.includes('production') ||
          window.location.hostname.includes('vercel.app'))
      );
    })();

  // Configuration - increased interval since we're using the comprehensive monitor
  const MONITOR_INTERVAL = 30 * 60 * 1000; // 30 minutes (increased from 15)
  const PAYMENT_PAGES = ['/cart', '/checkout', '/merch'];
  const isPaymentPage = PAYMENT_PAGES.some((page) => pathname.includes(page));

  const reportError = async (errorData: {
    type: string;
    message: string;
    responseTime?: number;
    context?: string;
    monitorData?: any;
  }) => {
    try {
      await fetch('/api/client-error-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'client-monitor',
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          ...errorData,
        }),
      });
      console.log('🚨 Payment system error reported to server');
    } catch (err) {
      console.error('Failed to report payment system error:', err);
    }
  };

  const testPaymentSystem = async (context: string = 'periodic') => {
    const testId = `client-${Date.now()}`;
    const startTime = Date.now();

    console.log(`[${testId}] 🧪 Testing basic site connectivity (${context})`);

    try {
      // Simple connectivity test - just ping the homepage
      const response = await fetch('/', {
        method: 'HEAD', // Lightweight request
        headers: {
          'X-Client-Monitor': 'true',
          'User-Agent': `SHUSH-Client-Monitor/1.0 (${navigator.userAgent})`,
        },
      });

      const responseTime = Date.now() - startTime;

      if (response.status === 502) {
        console.error(`[${testId}] 🔥 502 Bad Gateway detected!`);
        await reportError({
          type: '502_BAD_GATEWAY',
          message: `Client experiencing 502 Bad Gateway on ${pathname}`,
          responseTime,
          context,
        });
        return false;
      }

      if (!response.ok) {
        console.error(`[${testId}] ❌ HTTP ${response.status} error`);
        await reportError({
          type: 'HTTP_ERROR',
          message: `HTTP ${response.status}: ${response.statusText}`,
          responseTime,
          context,
        });
        return false;
      }

      // Check for slow responses (might indicate server issues)
      if (responseTime > 10000) {
        console.warn(`[${testId}] ⚠️ Slow site response: ${responseTime}ms`);
        await reportError({
          type: 'SLOW_SITE_RESPONSE',
          message: `Site response time: ${responseTime}ms (threshold: 10000ms)`,
          responseTime,
          context,
        });
      }

      console.log(
        `[${testId}] ✅ Basic site connectivity check successful (${responseTime}ms)`
      );
      return true;
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      console.error(`[${testId}] ❌ Network error:`, error.message);

      await reportError({
        type: 'NETWORK_ERROR',
        message: error.message,
        responseTime,
        context,
      });
      return false;
    }
  };

  const shouldTest = (): boolean => {
    const now = Date.now();

    // Always test on payment pages if not tested this session
    if (isPaymentPage && !hasTestedThisSession.current) {
      return true;
    }

    // Test every 30 minutes on any page (increased from 15 minutes)
    if (now - lastTestTime.current >= MONITOR_INTERVAL) {
      return true;
    }

    return false;
  };

  useEffect(() => {
    if (!shouldEnable) return;

    const runTest = async () => {
      if (shouldTest()) {
        lastTestTime.current = Date.now();
        hasTestedThisSession.current = true;

        const context = isPaymentPage ? 'payment-page-load' : 'periodic-check';
        await testPaymentSystem(context);
      }
    };

    // Test immediately if conditions are met
    runTest();

    // Set up periodic testing
    const interval = setInterval(() => {
      if (shouldTest()) {
        runTest();
      }
    }, 60000); // Check every minute, but only test based on shouldTest() logic

    return () => clearInterval(interval);
  }, [pathname, shouldEnable]);

  // Reset session flag when navigating to different page types
  useEffect(() => {
    if (!isPaymentPage) {
      hasTestedThisSession.current = false;
    }
  }, [pathname, isPaymentPage]);

  // This component renders nothing - it's just for monitoring
  return null;
};

export default PaymentMonitor;
