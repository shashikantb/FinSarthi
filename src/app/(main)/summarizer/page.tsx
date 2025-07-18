import { SummarizerForm } from "@/components/summarizer-form";

export default function SummarizerPage() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-headline font-bold md:text-3xl">Financial News Summarizer</h1>
        <p className="text-muted-foreground">
          Paste any financial news article to get a quick, easy-to-read summary.
        </p>
      </div>
       <div className="mt-6">
        <SummarizerForm />
      </div>
    </div>
  );
}
