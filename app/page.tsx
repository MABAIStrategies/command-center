'use client'

import { useState } from 'react'

interface Task {
  id: string
  title: string
  category: string
  status: 'pending' | 'in_progress' | 'completed'
}

export default function CommandCenter() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Research competitor analysis for MAB AI', category: 'Marketing', status: 'pending' },
    { id: '2', title: 'Draft weekly newsletter content', category: 'Content', status: 'pending' },
    { id: '3', title: 'Execute social media automation setup', category: 'Automation', status: 'pending' },
        { id: '4', title: 'Task Executioner - Auto-execute pending tasks', category: 'Automation', status: 'pending' },
      ])

      const [autoExecuting, setAutoExecuting] = useState(false)

  const autoExecuteTasks = async () => {
    setAutoExecuting(true)
    const pendingTasks = tasks.filter(t => t.status === 'pending' && t.id !== '4')
    
    console.log(`Task Executioner: Found ${pendingTasks.length} pending tasks`)
    
    for (const task of pendingTasks) {
      console.log(`Task Executioner: Executing ${task.title}...`)
      await executeTask(task.id)
      // Wait 2 seconds between tasks
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    setAutoExecuting(false)
    console.log('Task Executioner: All pending tasks completed!')
  }
  ])
  const [loading, setLoading] = useState<string | null>(null)

  const executeTask = async (taskId: string) => {
    setLoading(taskId)
        const task = tasks.find(t => t.id === taskId)
    if (!task) {
      console.error('Task not found')
      return
    }
    try {
      const response = await fetch('/api/agents/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          taskId: task.id,
          title: task.title,
          category: task.category
        }),      })
      const data = await response.json()
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: 'completed' } : t))
    } catch (error) {
      console.error('Task execution failed:', error)
    } finally {
      setLoading(null)
    }
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Command Center</h1>
        <p className="text-command-text/70 mb-8">MAB AI Strategies - Agentic Task Execution</p>
        
        <div className="grid gap-4">
          {tasks.map(task => (
            <div key={task.id} className="bg-command-surface border border-command-border rounded-lg p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold mb-2">{task.title}</h3>
                  <span className="text-sm text-command-accent">{task.category}</span>
                </div>
                <button
                  onClick={() => executeTask(task.id)}
            onClick={() => task.id === '4' ? autoExecuteTasks() : executeTask(task.id)}
            disabled={task.id === '4' ? autoExecuting : loading === task.id}                  className="px-4 py-2 bg-command-accent text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                >
            {task.id === '4' ? (autoExecuting ? 'Auto-Executing All...' : 'Start Auto-Execute') : (loading === task.id ? 'Executing...' : 'Execute')}                </button>
              </div>
              <div className="mt-4">
                <span className={`text-sm px-2 py-1 rounded ${
                  task.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                  task.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {task.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
