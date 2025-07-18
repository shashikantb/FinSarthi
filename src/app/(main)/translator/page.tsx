import { TranslatorForm } from "@/components/translator-form";

export default function TranslatorPage() {
  return (
    <div className="space-y-4">
       <div className="space-y-1">
        <h1 className="text-2xl font-headline font-bold md:text-3xl">Financial Term Translator</h1>
        <p className="text-muted-foreground">
          Demystify complex financial jargon with simple, clear explanations.
        </p>
      </div>
      <div className="mt-6">
        <TranslatorForm />
      </div>
    </div>
  );
}
