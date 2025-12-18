/**
 * Script to generate test logs from different "packages" with session context
 * Run with: npm run generate-logs
 */

import { createLogger, startSessionAsync, runWithLogContextAsync } from 'hazo_logs';

// Create loggers for different mock packages
const authLogger = createLogger('hazo_auth');
const notifyLogger = createLogger('hazo_notify');
const filesLogger = createLogger('hazo_files');

// Helper for delays
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Simulated users
const users = [
  { id: 'user_alice', name: 'Alice' },
  { id: 'user_bob', name: 'Bob' },
  { id: 'user_charlie', name: 'Charlie' },
];

async function simulateUserSession(user: { id: string; name: string }): Promise<void> {
  // Use startSessionAsync to auto-generate sessionId and log session start
  await startSessionAsync({ reference: user.id, logger: authLogger }, async () => {
    console.log(`  Starting session for ${user.name}...`);

    // Auth flow
    authLogger.info(`User ${user.name} logging in`, { email: `${user.name.toLowerCase()}@example.com` });
    await delay(50);
    authLogger.debug('Validating credentials', { method: 'password' });
    await delay(30);

    // Random chance of auth failure
    if (Math.random() > 0.85) {
      authLogger.error('Authentication failed', {
        reason: 'Invalid password',
        attempts: 3
      });
      authLogger.warn('Account temporarily locked', { lockDuration: '15m' });
      return;
    }

    authLogger.info('Login successful', { userId: user.id });
    await delay(50);

    // Token generation
    authLogger.debug('Generating access token', { expiresIn: '1h' });
    authLogger.info('Token issued', { tokenId: `tok_${Date.now()}` });
    await delay(30);

    // File operations - demonstrating nested context (depth tracking)
    await runWithLogContextAsync({}, async () => {
      // depth: 2 (nested inside session which is depth: 1)
      filesLogger.info('Listing files', { directory: `/users/${user.id}/documents` });
      await delay(40);
      filesLogger.debug('Found files', { count: Math.floor(Math.random() * 20) + 5 });

      // Random file upload with deeper nesting
      if (Math.random() > 0.5) {
        const filename = ['report.pdf', 'data.xlsx', 'image.png', 'notes.txt'][Math.floor(Math.random() * 4)];
        const fileSize = Math.floor(Math.random() * 5000000) + 100000;

        filesLogger.info('Uploading file', { filename, size: fileSize });
        await delay(100);

        // Nested validation context - depth: 3
        await runWithLogContextAsync({}, async () => {
          filesLogger.debug('Validating file type', { mimeType: 'application/octet-stream' });
          await delay(40);

          // Even deeper nesting - depth: 4
          await runWithLogContextAsync({}, async () => {
            filesLogger.debug('Computing file hash', { algorithm: 'sha256' });
            await delay(40);

            if (fileSize > 4000000) {
              filesLogger.warn('Large file detected', {
                filename,
                size: fileSize,
                threshold: 4000000
              });
            }
          });

          filesLogger.debug('Validation complete', { valid: true });
        });

        filesLogger.info('Upload complete', {
          fileId: `file_${Date.now()}`,
          path: `/uploads/${user.id}/${filename}`
        });
      }
    });

    // Random file download
    if (Math.random() > 0.6) {
      filesLogger.info('File download requested', { fileId: `file_${Math.floor(Math.random() * 1000)}` });
      await delay(50);
      filesLogger.debug('Generating signed URL', { expiresIn: '5m' });
      filesLogger.info('Download URL generated');
    }

    // Notification operations - demonstrating nested context
    if (Math.random() > 0.4) {
      await runWithLogContextAsync({}, async () => {
        // depth: 2
        notifyLogger.info('Sending notification', {
          type: 'email',
          template: 'activity_summary'
        });
        await delay(60);

        // Nested email processing - depth: 3
        await runWithLogContextAsync({}, async () => {
          notifyLogger.debug('Email queued', { queuePosition: Math.floor(Math.random() * 10) + 1 });
          await delay(30);

          // Random delivery issue
          if (Math.random() > 0.8) {
            notifyLogger.warn('Email delivery delayed', {
              reason: 'High queue volume',
              estimatedDelay: '2m'
            });
          } else {
            notifyLogger.info('Email sent successfully', { messageId: `msg_${Date.now()}` });
          }
        });
      });
    }

    // SMS notification
    if (Math.random() > 0.7) {
      notifyLogger.info('Sending SMS notification', {
        phone: '+1XXXXXXXXXX',
        type: 'verification'
      });
      await delay(40);
      notifyLogger.debug('SMS gateway response', { status: 'queued' });
      notifyLogger.info('SMS delivered');
    }

    // Webhook
    if (Math.random() > 0.6) {
      notifyLogger.info('Sending webhook', {
        url: 'https://api.example.com/webhook',
        event: 'file.uploaded'
      });
      await delay(80);

      if (Math.random() > 0.9) {
        notifyLogger.error('Webhook delivery failed', {
          statusCode: 500,
          retryIn: '30s'
        });
      } else {
        notifyLogger.debug('Webhook delivered', { statusCode: 200 });
      }
    }

    // Session end
    authLogger.info('Session ended', {
      duration: `${Math.floor(Math.random() * 3600) + 60}s`,
      actions: Math.floor(Math.random() * 20) + 5
    });
  });
}

async function main() {
  console.log('='.repeat(60));
  console.log('  hazo_logs Test - Generating Sample Logs with Context');
  console.log('='.repeat(60));
  console.log('');

  // Run multiple sessions for each user
  for (const user of users) {
    const sessionCount = Math.floor(Math.random() * 2) + 2; // 2-3 sessions per user
    console.log(`\nGenerating ${sessionCount} sessions for ${user.name}:`);

    for (let i = 0; i < sessionCount; i++) {
      await simulateUserSession(user);
      await delay(200); // Gap between sessions
    }
  }

  // Also run some operations without session context (background jobs)
  console.log('\nGenerating background job logs (no session context):');

  filesLogger.info('Background cleanup job started');
  await delay(50);
  filesLogger.debug('Scanning for orphaned files');
  filesLogger.info('Found orphaned files', { count: 3 });
  filesLogger.debug('Deleting orphaned files');
  filesLogger.info('Cleanup complete', { deleted: 3, reclaimed: '15MB' });

  notifyLogger.info('Email digest job started');
  await delay(100);
  notifyLogger.debug('Building digest for users', { userCount: users.length });
  notifyLogger.info('Digests sent', { sent: users.length, failed: 0 });

  console.log('');
  console.log('='.repeat(60));
  console.log('  Logs generated!');
  console.log('  Check ./logs directory for JSON log files.');
  console.log('  Visit http://localhost:3000/logs to view them.');
  console.log('');
  console.log('  Features to test:');
  console.log('  - Human-readable session IDs (e.g., 2025-12-17-14:30:45-1234)');
  console.log('  - Session start log entries');
  console.log('  - Filter by user reference');
  console.log('  - Timeline view (click the Timeline tab)');
  console.log('  - Session selector dropdown in Timeline');
  console.log('  - Package grouping (collapsible sections)');
  console.log('  - Depth tracking (nested calls show indentation)');
  console.log('='.repeat(60));
}

main().catch(console.error);
