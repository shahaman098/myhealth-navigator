import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { FileText, ChevronDown, Sparkles, Activity, Pill, Calendar } from "lucide-react";
import type { TranscriptSummary as TranscriptSummaryType } from "@/api/getTranscriptSummary";

interface TranscriptSummaryProps {
  summary: TranscriptSummaryType;
  onExplainMore?: () => void;
}

const TranscriptSummary = ({ summary, onExplainMore }: TranscriptSummaryProps) => {
  const [showTranscript, setShowTranscript] = useState(false);
  const [showRawResponse, setShowRawResponse] = useState(false);

  return (
    <div className="space-y-4">
      {/* Quick Summary Card */}
      <Card className="border-primary/20 shadow-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">AI Summary</CardTitle>
              <CardDescription>Your health information at a glance</CardDescription>
            </div>
            <Badge variant="secondary" className="ml-auto">
              <Activity className="h-3 w-3 mr-1" />
              Generated
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-foreground leading-relaxed">{summary.summary}</p>
          </div>
        </CardContent>
      </Card>

      {/* Current Condition */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Current Condition</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">{summary.condition}</p>
        </CardContent>
      </Card>

      {/* Key Clinical Issues */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Key Clinical Issues</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {summary.keyIssues.map((issue, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span className="text-foreground flex-1">{issue}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Treatments & Medications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Treatments & Medications</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {summary.treatments.map((treatment, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span className="text-foreground flex-1">{treatment}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="border-accent/30 bg-accent/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">What to Expect Next</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {summary.nextSteps.map((step, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span className="text-foreground flex-1">{step}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Separator />

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {onExplainMore && (
          <Button onClick={onExplainMore} variant="default" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Explain More
          </Button>
        )}

        <Collapsible open={showRawResponse} onOpenChange={setShowRawResponse}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              Full AI Response
              <ChevronDown className={`h-4 w-4 transition-transform ${showRawResponse ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <Card>
              <CardContent className="pt-6">
                <pre className="whitespace-pre-wrap text-sm text-muted-foreground">{summary.raw}</pre>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {summary.transcript && (
          <Collapsible open={showTranscript} onOpenChange={setShowTranscript}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="gap-2">
                <FileText className="h-4 w-4" />
                View Transcript
                <ChevronDown className={`h-4 w-4 transition-transform ${showTranscript ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Full Session Transcript</CardTitle>
                  <CardDescription>Complete medical record for this session</CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-sm text-muted-foreground max-h-96 overflow-y-auto">
                    {summary.transcript}
                  </pre>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  );
};

export default TranscriptSummary;
