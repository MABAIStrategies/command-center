import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface DiscoveredTask {
  id: string
  source: 'drive' | 'gmail' | 'github' | 'notion'
  type: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  actionable: boolean
  metadata: Record<string, any>
}

function getGoogleAuth() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
            'https://www.googleapis.com/auth/gmail.readonly',
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/documents.readonly',
    ],
  })
  return auth
}

async function scanGoogleDrive(): Promise<DiscoveredTask[]> {
  try {
    const auth = getGoogleAuth()
    const drive = google.drive({ version: 'v3', auth })
    const docs = google.docs({ version: 'v1', auth })
    
    const tasks: DiscoveredTask[] = []
    
    const searchQuery = "(name contains 'draft' or name contains 'WIP' or name contains 'TODO' or name contains 'incomplete') and mimeType='application/vnd.google-apps.document'"
    
    const response = await drive.files.list({
      q: searchQuery,
      fields: 'files(id, name, modifiedTime, webViewLink)',
      orderBy: 'modifiedTime desc',
      pageSize: 10,
    })
    
    if (response.data.files) {
      for (const file of response.data.files) {
        const docResponse = await docs.documents.get({
          documentId: file.id!,
        })
        
        const content = docResponse.data.body?.content?.map(element => 
          element.paragraph?.elements?.map(e => e.textRun?.content || '').join('') || ''
        ).join('\n') || ''
        
        const analysis = await analyzeDocument(file.name!, content)
        
        if (analysis.actionable) {
          tasks.push({
            id: file.id!,
            source: 'drive',
            type: analysis.type,
            title: file.name!,
            description: analysis.description,
            priority: analysis.priority,
            actionable: true,
            metadata: {
              url: file.webViewLink,
              modifiedTime: file.modifiedTime,
              contentPreview: content.substring(0, 200),
            },
          })
        }
      }
    }
    
    return tasks
  } catch (error) {
    console.error('Error scanning Google Drive:', error)
    return []
  }
}

async function analyzeDocument(title: string, content: string) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `You are an AI that analyzes documents to identify actionable tasks.\nRespond in JSON format with:\n{\n  "actionable": boolean,\n  "type": "content_creation" | "research" | "client_work" | "automation" | "other",\n  "description": "Brief description of what needs to be done",\n  "priority": "high" | "medium" | "low"\n}`,
      },
      {
        role: 'user',
        content: `Document Title: ${title}\n\nContent Preview:\n${content.substring(0, 500)}`,
      },
    ],
    response_format: { type: 'json_object' },
  })
  
  return JSON.parse(completion.choices[0].message.content!)
}

export async function GET() {
  try {
    console.log('Starting Task Executioner scan...')
    
    const driveTasks = await scanGoogleDrive()
    
    return NextResponse.json({
      success: true,
      tasksFound: driveTasks.length,
      tasks: driveTasks,
      sources: {

        // Scan Gmail for unanswered emails and customer inquiries
async function scanGmail(): Promise<DiscoveredTask[]> {
  try {
    const auth = getGoogleAuth()
    const gmail = google.gmail({ version: 'v1', auth })
    
    const tasks: DiscoveredTask[] = []
    
    // Search for unread emails in inbox (potential customer inquiries)
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread in:inbox',
      maxResults: 20,
    })
    
    if (response.data.messages) {
      for (const message of response.data.messages) {
        const fullMessage = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
          format: 'full',
        })
        
        const headers = fullMessage.data.payload?.headers || []
        const subject = headers.find(h => h.name === 'Subject')?.value || 'No subject'
        const from = headers.find(h => h.name === 'From')?.value || 'Unknown sender'
        const date = headers.find(h => h.name === 'Date')?.value || ''
        
        // Get email body
        let body = ''
        if (fullMessage.data.payload?.body?.data) {
          body = Buffer.from(fullMessage.data.payload.body.data, 'base64').toString('utf-8')
        } else if (fullMessage.data.payload?.parts) {
          for (const part of fullMessage.data.payload.parts) {
            if (part.mimeType === 'text/plain' && part.body?.data) {
              body = Buffer.from(part.body.data, 'base64').toString('utf-8')
              break
            }
          }
        }
        
        // Analyze if this email needs a response
        const analysis = await analyzeEmail(subject, from, body)
        
        if (analysis.requiresResponse) {
          tasks.push({
            id: message.id!,
            source: 'gmail',
            type: analysis.type,
            title: `Email: ${subject}`,
            description: analysis.description,
            priority: analysis.priority,
            actionable: true,
            metadata: {
              from,
              subject,
              date,
              threadId: message.threadId,
              snippet: fullMessage.data.snippet,
            },
          })
        }
      }
    }
    
    return tasks
  } catch (error) {
    console.error('Error scanning Gmail:', error)
    return []
  }
}

// Analyze if an email requires a response
async function analyzeEmail(subject: string, from: string, body: string) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `You are an AI that analyzes emails to determine if they require a response.\nRespond in JSON format with:\n{\n  "requiresResponse": boolean,\n  "type": "customer_inquiry" | "client_request" | "collaboration" | "spam" | "other",\n  "description": "Brief description of what action is needed",\n  "priority": "high" | "medium" | "low"\n}`,
      },
      {
        role: 'user',
        content: `From: ${from}\nSubject: ${subject}\n\nBody Preview:\n${body.substring(0, 500)}`,
      },
    ],
    response_format: { type: 'json_object' },
  })
  
  return JSON.parse(completion.choices[0].message.content!)
}
        drive: driveTasks.length,
        gmail: 0,
        github: 0,
        notion: 0,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Task Executioner scan error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Scan failed' },
      { status: 500 }
    )
  }
}
