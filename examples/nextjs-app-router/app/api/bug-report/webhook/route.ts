import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const bugData = await request.json();
    
    // Validate required environment variables
    if (!process.env.WEBHOOK_URL) {
      return Response.json(
        { success: false, error: 'Webhook URL not configured' }, 
        { status: 500 }
      );
    }
    
    // Build the payload
    const payload = {
      event: 'bug_report',
      timestamp: bugData.timestamp,
      report: {
        title: bugData.title,
        description: bugData.description,
        url: bugData.url,
        userAgent: bugData.userAgent,
        viewport: bugData.viewport,
        user: {
          id: bugData.userId,
          email: bugData.userEmail
        },
        priority: bugData.priority,
        category: bugData.category,
        tags: bugData.tags,
        reproductionSteps: bugData.reproductionSteps,
        expectedBehavior: bugData.expectedBehavior,
        actualBehavior: bugData.actualBehavior,
        screenshot: bugData.screenshot ? 'included' : null, // Don't send raw screenshot data
        additionalFiles: bugData.additionalFiles?.map((file: any) => ({
          name: file.name,
          type: file.type,
          size: file.size
        })),
        technical: {
          consoleLogs: bugData.consoleLogs?.slice(-10), // Limit to recent logs
          networkRequests: bugData.networkRequests?.slice(-10).map((req: any) => ({
            method: req.method,
            url: req.url,
            status: req.status,
            duration: req.duration
          }))
        }
      }
    };
    
    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': '@zudsniper/bugs webhook'
    };
    
    // Add authentication if configured
    if (process.env.WEBHOOK_AUTH_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.WEBHOOK_AUTH_TOKEN}`;
    } else if (process.env.WEBHOOK_API_KEY) {
      headers['X-API-Key'] = process.env.WEBHOOK_API_KEY;
    }
    
    // Add custom headers if configured
    if (process.env.WEBHOOK_CUSTOM_HEADERS) {
      try {
        const customHeaders = JSON.parse(process.env.WEBHOOK_CUSTOM_HEADERS);
        Object.assign(headers, customHeaders);
      } catch (error) {
        console.warn('Invalid WEBHOOK_CUSTOM_HEADERS format:', error);
      }
    }
    
    // Make the webhook request
    const response = await fetch(process.env.WEBHOOK_URL, {
      method: process.env.WEBHOOK_METHOD || 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
    }
    
    // Try to parse response
    let result = {};
    try {
      result = await response.json();
    } catch {
      // Response might not be JSON, that's okay
      result = { message: 'Webhook received successfully' };
    }
    
    return Response.json({
      success: true,
      issueId: (result as any).id || (result as any).issueId || (result as any).ticket_id,
      issueUrl: (result as any).url || (result as any).link || (result as any).issueUrl,
      message: (result as any).message || 'Bug report submitted successfully via webhook'
    });
    
  } catch (error) {
    console.error('Webhook submission failed:', error);
    return Response.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to submit bug report via webhook' 
      }, 
      { status: 500 }
    );
  }
}