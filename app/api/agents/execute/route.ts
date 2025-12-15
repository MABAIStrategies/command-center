import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const { taskId } = await request.json()
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an AI agent that executes tasks for MAB AI Strategies. Break down the task into steps and execute them.'
        },
        {
          role: 'user',
          content: `Execute task ID: ${taskId}. Provide a detailed execution plan and results.`
        }
      ],
      temperature: 0.7,
    })

    const result = completion.choices[0].message.content

    return NextResponse.json({
      success: true,
      taskId,
      result,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Agent execution error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to execute task' },
      { status: 500 }
    )
  }
}
