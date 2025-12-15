import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface TaskExecutionRequest {
  taskId: string
  title: string
  category: string
  description?: string
}

interface TaskStep {
  step: number
  action: string
  status: 'pending' | 'completed' | 'failed'
  result?: string
}

export async function POST(request: Request) {
  try {
    const { taskId, title, category, description } = await request.json() as TaskExecutionRequest
    
    console.log(`Executing task ${taskId}: ${title}`)
    
    // Enhanced system prompt for task execution
    const systemPrompt = `You are an advanced AI task execution agent for MAB AI Strategies.

Your role is to:
1. Analyze the given task thoroughly
2. Break it down into clear, actionable steps
3. Execute each step with detailed planning
4. Provide specific, actionable deliverables
5. Consider best practices for ${category} tasks

Format your response as a structured execution plan with:
- Step-by-step breakdown
- Specific actions to take
- Expected outcomes
- Key deliverables
- Next steps or recommendations`

    const userPrompt = `Task: ${title}
Category: ${category}${description ? `\nDescription: ${description}` : ''}

Please create a comprehensive execution plan and provide detailed recommendations for completing this task effectively.`

    // Call OpenAI to generate task execution plan
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    })

    const executionPlan = completion.choices[0].message.content
    
    // Simulate step-by-step execution
    const steps: TaskStep[] = [
      { step: 1, action: 'Task analysis and planning', status: 'completed', result: 'Task analyzed successfully' },
      { step: 2, action: 'Resource gathering and research', status: 'completed', result: 'Resources identified' },
      { step: 3, action: 'Execution strategy development', status: 'completed', result: 'Strategy outlined' },
      { step: 4, action: 'Implementation and delivery', status: 'completed', result: 'Deliverables prepared' },
    ]

    return NextResponse.json({
      success: true,
      taskId,
      title,
      category,
      executionPlan,
      steps,
      timestamp: new Date().toISOString(),
      status: 'completed'
    })
  } catch (error) {
    console.error('Agent execution error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to execute task',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
