import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const bugData = await request.json();
    
    // Validate required environment variables
    if (!process.env.SLACK_WEBHOOK_URL) {
      return Response.json(
        { success: false, error: 'Slack webhook URL not configured' }, 
        { status: 500 }
      );
    }
    
    // Build Slack-specific payload
    const payload = buildSlackPayload(bugData);
    
    // Send to Slack
    const response = await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`Slack webhook failed: ${response.status} ${response.statusText}`);
    }
    
    return Response.json({
      success: true,
      message: 'Bug report sent to Slack successfully'
    });
    
  } catch (error) {
    console.error('Slack webhook submission failed:', error);
    return Response.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send bug report to Slack' 
      }, 
      { status: 500 }
    );
  }
}

function buildSlackPayload(data: any) {
  const fields = [
    {
      title: 'URL',
      value: data.url,
      short: true
    },
    {
      title: 'User',
      value: data.userEmail || 'Anonymous',
      short: true
    },
    {
      title: 'Browser',
      value: extractBrowser(data.userAgent),
      short: true
    },
    {
      title: 'Viewport',
      value: `${data.viewport.width}×${data.viewport.height}`,
      short: true
    }
  ];

  // Add console logs if present
  if (data.consoleLogs && data.consoleLogs.length > 0) {
    const errorLogs = data.consoleLogs.filter((log: any) => log.level === 'error');
    if (errorLogs.length > 0) {
      fields.push({
        title: 'Recent Console Errors',
        value: '```' + errorLogs.slice(-3).map((log: any) => 
          `${log.level.toUpperCase()}: ${log.message.slice(0, 100)}`
        ).join('\n') + '```',
        short: false
      });
    }
  }

  return {
    username: process.env.SLACK_BOT_NAME || 'Bug Reporter',
    icon_emoji: process.env.SLACK_BOT_EMOJI || ':bug:',
    channel: process.env.SLACK_CHANNEL || undefined,
    attachments: [
      {
        color: getPriorityColor(data.priority),
        title: data.title || 'Bug Report',
        text: data.description,
        fields,
        footer: '@zudsniper/bugs',
        ts: Math.floor(data.timestamp / 1000)
      }
    ]
  };
}

function extractBrowser(userAgent: string): string {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Unknown';
}

function getPriorityColor(priority?: string): string {
  switch (priority) {
    case 'urgent': return '#ff0000';
    case 'high': return '#ff9900';
    case 'medium': return '#ffcc00';
    case 'low': return '#00cc00';
    default: return '#808080';
  }
}