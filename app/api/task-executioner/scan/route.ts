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
                  private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          },
          scopes: [
                  'https://www.googleapis.com/auth/drive.readonly',
                  'https://www.googleapis.com/auth/documents.readonly',
                  'https://www.googleapis.com/auth/gmail.readonly',
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

            const searchQuery = "(name contains 'draft' or name contains 'WIP' or name contains 'TODO') and mimeType='application/vnd.google-apps.document'"

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

async function scanGmail(): Promise<DiscoveredTask[]> {
    try {
          const auth = getGoogleAuth()
          const gmail = google.gmail({ version: 'v1', auth })

      const tasks: DiscoveredTask[] = []

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

async function analyzeDocument(title: string, content: string) {
    const completion = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            {
                      role: 'system',
                      content: 'You are an AI analyzing documents to identify actionable tasks. Respond in JSON format.',
            },
            {
                      role: 'user',
                      content: `Document: ${title}\n\n${content.substring(0, 500)}`,
            },
                ],
          response_format: { type: 'json_object' },
    })

  return JSON.parse(completion.choices[0].message.content!)
}

async function analyzeEmail(subject: string, from: string, body: string) {
    const completion = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            {
                      role: 'system',
                      content: 'You are an AI analyzing emails. Respond in JSON format with requiresResponse boolean.',
            },
            {
                      role: 'user',
                      content: `From: ${from}\nSubject: ${subject}\n\n${body.substring(0, 500)}`,
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
          const gmailTasks = await scanGmail()

      return NextResponse.json({
              success: true,
              tasksFound: driveTasks.length + gmailTasks.length,
              tasks: [...driveTasks, ...gmailTasks],
              sources: {
                        drive: driveTasks.length,
                        gmail: gmailTasks.length,
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
