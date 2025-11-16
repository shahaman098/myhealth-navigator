import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Download, Eye, FileText } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type DocumentType = "lab" | "letter" | "imaging" | "prescription" | "report";

interface DocumentCardProps {
  id: string;
  title: string;
  type: DocumentType;
  date: string;
  provider?: string;
  fileSize?: string;
  icon: LucideIcon;
  onDownload?: () => void;
  onView?: () => void;
}

const DocumentCard = ({
  title,
  type,
  date,
  provider,
  fileSize,
  icon: Icon,
  onDownload,
  onView,
}: DocumentCardProps) => {
  const getTypeColor = (type: DocumentType) => {
    switch (type) {
      case "lab":
        return "bg-primary/10 text-primary border-primary/20";
      case "letter":
        return "bg-secondary/10 text-secondary border-secondary/20";
      case "imaging":
        return "bg-accent/10 text-accent border-accent/20";
      case "prescription":
        return "bg-primary/10 text-primary border-primary/20";
      case "report":
        return "bg-secondary/10 text-secondary border-secondary/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className="p-5 hover:shadow-md transition-smooth group border-border/50">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={cn(
          "p-3 rounded-lg flex-shrink-0 transition-colors",
          getTypeColor(type)
        )}>
          <Icon className="h-6 w-6" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                {title}
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(date)}
                </span>
                {provider && (
                  <>
                    <span>•</span>
                    <span>{provider}</span>
                  </>
                )}
                {fileSize && (
                  <>
                    <span>•</span>
                    <span>{fileSize}</span>
                  </>
                )}
              </div>
            </div>
            
            <Badge 
              variant="outline" 
              className={cn("capitalize flex-shrink-0", getTypeColor(type))}
            >
              {type}
            </Badge>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onView}
              className="flex-1 sm:flex-none"
            >
              <Eye className="h-4 w-4 mr-2" />
              View
            </Button>
            <Button 
              variant="default" 
              size="sm"
              onClick={onDownload}
              className="flex-1 sm:flex-none"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DocumentCard;
