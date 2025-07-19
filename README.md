# FinSarthi - Your AI Financial Coach

FinSarthi is a Next.js application that provides AI-powered financial guidance. It features a conversational interface for financial advice, personalized financial plans, and an interactive dashboard to track your progress.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (with React)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with [ShadCN UI](https://ui.shadcn.com/) components
- **AI/Generative**: [Groq](https://groq.com/) (with Llama 3 via OpenAI SDK) and [Genkit](https://firebase.google.com/docs/genkit) for flow management.
- **Language**: [TypeScript](https://www.typescriptlang.org/)

## Local Development Setup

Follow these steps to get the FinSarthi application running on your local machine.

### 1. Prerequisites

Make sure you have [Node.js](https://nodejs.org/) version 18 or later installed on your system.

### 2. Get the Code

Clone the repository to your local machine:

```bash
git clone <your-repository-url>
cd finsarthi
```

### 3. Install Dependencies

Install the necessary `npm` packages by running the following command in the project's root directory:

```bash
npm install
```

### 4. Set Up Environment Variables

The application uses Groq to power its generative AI features, which requires an API key.

1.  Create a new file named `.env` in the root of your project directory.
2.  Get your API key from the [Groq Console](https://console.groq.com/keys).
3.  Add the following line to your `.env` file, replacing `YOUR_API_KEY` with your actual key:

```
GROQ_API_KEY=YOUR_API_KEY
```

### 5. Run the Development Servers

This application requires two separate processes to be running at the same time for local development: one for the Next.js frontend and one for the Genkit AI services.

**Terminal 1: Start the Next.js App**

This command starts the main web application.

```bash
npm run dev
```

The application will be accessible at [http://localhost:9002](http://localhost:9002).

**Terminal 2: Start the Genkit AI Services**

This command starts the local Genkit development server, which runs the AI flows that power the application's intelligent features.

```bash
npm run genkit:dev
```

This will open the Genkit Developer UI, where you can inspect and test your AI flows.

---

With both servers running, you can now open your browser to `http://localhost:9002` and use the full application.
