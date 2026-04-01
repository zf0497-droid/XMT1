import React from "react";
import { AlertTriangle, FileX, Clock, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Alert, AlertDescription } from "../../ui/alert";
import { t } from "../../../locales";

interface SRTParseError {
  type: 'validation' | 'format' | 'timing' | 'encoding';
  message: string;
  line?: number;
  details?: string;
}

interface CaptionsErrorDisplayProps {
  errors: SRTParseError[];
  fileName?: string;
  onRetry?: () => void;
}

const getErrorIcon = (type: SRTParseError['type']) => {
  switch (type) {
    case 'validation':
      return <FileX className="w-4 h-4" />;
    case 'format':
      return <AlertTriangle className="w-4 h-4" />;
    case 'timing':
      return <Clock className="w-4 h-4" />;
    case 'encoding':
      return <Info className="w-4 h-4" />;
    default:
      return <AlertTriangle className="w-4 h-4" />;
  }
};



const getErrorTitle = (type: SRTParseError['type']) => {
  switch (type) {
    case 'validation':
      return t.errors.validationError;
    case 'format':
      return t.errors.formatError;
    case 'timing':
      return t.errors.timingError;
    case 'encoding':
      return t.errors.encodingError;
    default:
      return t.common.error;
  }
};

export const CaptionsErrorDisplay: React.FC<CaptionsErrorDisplayProps> = ({
  errors,
  fileName,
  onRetry,
}) => {
  if (!errors || errors.length === 0) {
    return null;
  }

  const errorsByType = errors.reduce((acc, error) => {
    if (!acc[error.type]) {
      acc[error.type] = [];
    }
    acc[error.type].push(error);
    return acc;
  }, {} as Record<string, SRTParseError[]>);

  const hasValidationErrors = errors.some(e => e.type === 'validation');
  const hasFormatErrors = errors.some(e => e.type === 'format');

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="w-5 h-5" />
          {t.errors.srtParsingFailed}
        </CardTitle>
        {fileName && (
          <p className="text-sm text-muted-foreground">
            {t.errors.file}: <span className="font-mono">{fileName}</span>
          </p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Summary */}
        <Alert>
          <AlertDescription>
            {t.errors.foundErrors.replace('{count}', errors.length.toString())}{errors.length !== 1 ? '' : ''}
            {hasValidationErrors || hasFormatErrors
              ? ` ${t.errors.pleaseFixIssues}`
              : ` ${t.errors.someSkipped}`
            }
          </AlertDescription>
        </Alert>

        {/* Error Details by Type */}
        <div className="space-y-3">
          {Object.entries(errorsByType).map(([type, typeErrors]) => (
            <div key={type} className="space-y-2">
              <div className="flex items-center gap-2">
                {getErrorIcon(type as SRTParseError['type'])}
                <h4 className="font-extralight text-sm">
                  {getErrorTitle(type as SRTParseError['type'])}
                </h4>
                <span className="inline-flex items-center px-2 py-1 text-xs font-extralight bg-destructive/10 text-destructive rounded-full">
                  {typeErrors.length}
                </span>
              </div>
              
              <div className="space-y-1 ml-6">
                {typeErrors.map((error, index) => (
                  <div key={index} className="text-sm">
                    <div className="flex items-start gap-2">
                      {error.line && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-mono bg-muted/50 text-muted-foreground border rounded">
                          {t.errors.line} {error.line}
                        </span>
                      )}
                      <span className="text-muted-foreground">{error.message}</span>
                    </div>
                    {error.details && (
                      <div className="mt-1 ml-2 text-xs text-muted-foreground/80 font-mono bg-muted/50 p-2 rounded">
                        {error.details}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Common Solutions */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <h4 className="font-extralight text-sm mb-2">{t.errors.commonSolutions}:</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• {t.errors.solution1}</li>
            <li>• {t.errors.solution2}</li>
            <li>• {t.errors.solution3}</li>
            <li>• {t.errors.solution4}</li>
            <li>• {t.errors.solution5}</li>
          </ul>
        </div>

        {/* Example Format */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <h4 className="font-extralight text-sm mb-2">{t.errors.expectedFormat}:</h4>
          <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">
{`1
00:00:01,000 --> 00:00:03,500
This is the first subtitle

2
00:00:04,000 --> 00:00:06,000
This is the second subtitle`}
          </pre>
        </div>

        {onRetry && (
          <div className="flex justify-end pt-2">
            <button
              onClick={onRetry}
              className="text-sm text-primary hover:text-primary/80 underline"
            >
              {t.errors.tryAnotherFile}
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 