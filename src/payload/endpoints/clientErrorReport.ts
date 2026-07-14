import { Endpoint } from 'payload/config';

export const clientErrorReportEndpoint: Endpoint = {
  path: '/client-error-report',
  method: 'post',
  handler: async (req, res) => {
    const reportId = `client-report-${Date.now()}`;

    try {
      const { source, type, message, userAgent, url, responseTime, timestamp } =
        req.body;

      console.log(`[${reportId}] 🚨 CLIENT ERROR REPORT received:`, {
        source,
        type,
        message,
        userAgent: userAgent?.substring(0, 100),
        url,
        responseTime,
        timestamp,
        ip: req.ip || req.connection?.remoteAddress,
      });

      // Handle critical 502 errors from clients
      if (type === '502_BAD_GATEWAY') {
        console.error(
          `[${reportId}] 🔥 CRITICAL: Real user experiencing 502 Bad Gateway!`
        );

        // Send immediate alert
        try {
          const alertEmail = process.env.ALERT_EMAIL || 'hello@shush.dance';

          await req.payload.sendEmail({
            to: alertEmail,
            from: `"SHUSH Client Monitor" <${process.env.SMTP_USER}>`,
            subject: `🔥 URGENT: Real User 502 Error Detected`,
            html: `
              <div style="background: #ff4444; color: white; padding: 15px; border-radius: 5px; margin: 10px 0;">
                <h2>🚨 CRITICAL: Real User 502 Error</h2>
                <p><strong>⚠️ A real customer is experiencing payment failures!</strong></p>
              </div>
              
              <h3>Error Details:</h3>
              <ul>
                <li><strong>Error Type:</strong> ${type}</li>
                <li><strong>Message:</strong> ${message}</li>
                <li><strong>User's URL:</strong> ${url}</li>
                <li><strong>Response Time:</strong> ${responseTime}ms</li>
                <li><strong>User Agent:</strong> ${userAgent}</li>
                <li><strong>Timestamp:</strong> ${timestamp}</li>
                <li><strong>Source IP:</strong> ${req.ip || 'unknown'}</li>
              </ul>
              
              <div style="background: #fff3cd; padding: 10px; border-radius: 5px; margin: 10px 0;">
                <h3>🔧 Immediate Actions Required:</h3>
                <ol>
                  <li><strong>Restart application:</strong> <code>pm2 restart all</code></li>
                  <li><strong>Check server resources:</strong> <code>free -h && df -h</code></li>
                  <li><strong>Check application logs:</strong> <code>pm2 logs</code></li>
                  <li><strong>Monitor for more reports</strong></li>
                </ol>
              </div>
              
              <p><strong>Dashboard:</strong> <a href="${process.env.PAYLOAD_PUBLIC_SERVER_URL}/admin">Admin Panel</a></p>
              <p><strong>Server Monitor:</strong> <a href="${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/monitor-payment-system?key=${process.env.MONITOR_API_KEY}">Monitor Status</a></p>
            `,
          });

          console.log(`[${reportId}] 📧 URGENT client error alert sent`);
        } catch (emailError) {
          console.error(
            `[${reportId}] ❌ Failed to send client error alert:`,
            emailError
          );
        }
      }

      // NOTE: reports are intentionally not persisted. There is no
      // `client-error-reports` collection, and attempting to create one here
      // only produced error noise. Logging + email alerts above are enough.

      return res.status(200).json({
        success: true,
        reportId,
        message: 'Error report received and processed',
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error(
        `[${reportId}] ❌ Failed to process client error report:`,
        error
      );
      return res.status(500).json({
        success: false,
        error: 'Failed to process error report',
        reportId,
        timestamp: new Date().toISOString(),
      });
    }
  },
};
