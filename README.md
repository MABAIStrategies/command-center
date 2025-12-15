# Command Center - MAB AI Strategies

AI-powered personal command center with agentic task execution.

## Features

- ✅ Task management with AI agent execution
- ✅ OpenAI GPT-4 integration for intelligent task processing
- ✅ Real-time task status updates
- ✅ Dark mode UI with Tailwind CSS
- ✅ Serverless architecture on Vercel

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (serverless)
- **AI**: OpenAI GPT-4
- **Deployment**: Vercel
- **Database**: Notion (coming soon)

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/MABAIStrategies/command-center.git
cd command-center
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy `.env.example` to `.env.local` and add your API keys:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```
OPENAI_API_KEY=your_openai_api_key_here
NOTION_API_KEY=your_notion_api_key_here (optional)
NOTION_DATABASE_ID=your_notion_database_id_here (optional)
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your command center.

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/MABAIStrategies/command-center)

1. Click the button above or go to [Vercel](https://vercel.com)
2. Import your GitHub repository
3. Add environment variables in Vercel dashboard:
   - `OPENAI_API_KEY`
   - `NOTION_API_KEY` (optional)
   - `NOTION_DATABASE_ID` (optional)
4. Deploy!

## Project Structure

```
command-center/
├── app/
│   ├── api/
│   │   └── agents/
│   │       └── execute/
│   │           └── route.ts      # Task execution agent
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Main command center UI
├── lib/                         # Utility functions (coming soon)
├── components/                  # React components (coming soon)
├── public/                      # Static assets
├── .env.example                 # Environment variables template
├── next.config.js              # Next.js configuration
├── tailwind.config.js          # Tailwind CSS configuration
└── tsconfig.json               # TypeScript configuration
```

## How It Works

1. **Task Creation**: Add tasks through the UI
2. **Agent Execution**: Click "Execute" to trigger the AI agent
3. **OpenAI Processing**: The agent uses GPT-4 to break down and execute tasks
4. **Results**: View execution results and status updates

## Roadmap

- [ ] Notion database integration
- [ ] Gmail and Google Drive connectors
- [ ] Research agent
- [ ] Newsletter automation agent
- [ ] Task scheduling
- [ ] Multi-agent orchestration
- [ ] Voice input support

## Contributing

This is a personal project for MAB AI Strategies. Feel free to fork and adapt for your own use.

## License

MIT License - feel free to use this for your own projects!

## Support

For issues or questions, open an issue on GitHub.

---

Built with ❤️ by MAB AI Strategies
