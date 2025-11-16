import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  FlaskConical, 
  Mail, 
  Scan,
  Pill,
  Upload,
  Filter,
  Search,
  FolderOpen
} from "lucide-react";
import { Input } from "@/components/ui/input";
import DocumentCard, { DocumentType } from "@/components/documents/DocumentCard";
import { useToast } from "@/hooks/use-toast";

const Documents = () => {
  const [selectedCategory, setSelectedCategory] = useState<DocumentType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const documents = [
    {
      id: "1",
      title: "Complete Metabolic Panel Results",
      type: "lab" as DocumentType,
      date: "2024-02-20",
      provider: "LabCorp",
      fileSize: "245 KB",
      icon: FlaskConical,
    },
    {
      id: "2",
      title: "Cardiology Consultation Summary",
      type: "letter" as DocumentType,
      date: "2024-02-28",
      provider: "Dr. Michael Chen, MD",
      fileSize: "180 KB",
      icon: Mail,
    },
    {
      id: "3",
      title: "Chest X-Ray Report",
      type: "imaging" as DocumentType,
      date: "2024-01-15",
      provider: "Radiology Associates",
      fileSize: "2.1 MB",
      icon: Scan,
    },
    {
      id: "4",
      title: "Lisinopril Prescription",
      type: "prescription" as DocumentType,
      date: "2024-03-10",
      provider: "Dr. Michael Chen, MD",
      fileSize: "120 KB",
      icon: Pill,
    },
    {
      id: "5",
      title: "Annual Physical Examination Report",
      type: "report" as DocumentType,
      date: "2024-03-15",
      provider: "Dr. Sarah Johnson, MD",
      fileSize: "320 KB",
      icon: FileText,
    },
    {
      id: "6",
      title: "Lipid Panel - Follow-up",
      type: "lab" as DocumentType,
      date: "2024-01-10",
      provider: "Quest Diagnostics",
      fileSize: "198 KB",
      icon: FlaskConical,
    },
    {
      id: "7",
      title: "Referral Letter to Cardiologist",
      type: "letter" as DocumentType,
      date: "2024-02-15",
      provider: "Dr. Sarah Johnson, MD",
      fileSize: "150 KB",
      icon: Mail,
    },
    {
      id: "8",
      title: "Echocardiogram Results",
      type: "imaging" as DocumentType,
      date: "2024-03-01",
      provider: "Heart Health Center",
      fileSize: "1.8 MB",
      icon: Scan,
    },
  ];

  const categories = [
    { value: "all" as const, label: "All Documents", icon: FolderOpen, count: documents.length },
    { 
      value: "lab" as DocumentType, 
      label: "Lab Results", 
      icon: FlaskConical,
      count: documents.filter(d => d.type === "lab").length
    },
    { 
      value: "letter" as DocumentType, 
      label: "Letters", 
      icon: Mail,
      count: documents.filter(d => d.type === "letter").length
    },
    { 
      value: "imaging" as DocumentType, 
      label: "Imaging", 
      icon: Scan,
      count: documents.filter(d => d.type === "imaging").length
    },
    { 
      value: "prescription" as DocumentType, 
      label: "Prescriptions", 
      icon: Pill,
      count: documents.filter(d => d.type === "prescription").length
    },
    { 
      value: "report" as DocumentType, 
      label: "Reports", 
      icon: FileText,
      count: documents.filter(d => d.type === "report").length
    },
  ];

  const filteredDocuments = documents.filter(doc => {
    const matchesCategory = selectedCategory === "all" || doc.type === selectedCategory;
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.provider?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleDownload = (documentTitle: string) => {
    toast({
      title: "Download Started",
      description: `Downloading ${documentTitle}...`,
    });
  };

  const handleView = (documentTitle: string) => {
    toast({
      title: "Opening Document",
      description: `Opening ${documentTitle}...`,
    });
  };

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Medical Documents</h1>
          <p className="text-lg text-muted-foreground">
            Access and manage all your health records in one place
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Categories
              </h3>
              <div className="space-y-2">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const isSelected = selectedCategory === category.value;
                  
                  return (
                    <button
                      key={category.value}
                      onClick={() => setSelectedCategory(category.value)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{category.label}</span>
                      </div>
                      <Badge 
                        variant={isSelected ? "secondary" : "outline"}
                        className="text-xs"
                      >
                        {category.count}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Upload Action */}
            <Card className="p-4 bg-gradient-card border-primary/10">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground mb-2">Upload Document</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Add your medical records and documents
                </p>
                <Button className="w-full" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </Button>
              </div>
            </Card>
          </div>

          {/* Documents List */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search and Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredDocuments.length} {filteredDocuments.length === 1 ? 'document' : 'documents'}
              </p>
              {selectedCategory !== "all" && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedCategory("all")}
                >
                  Clear Filter
                </Button>
              )}
            </div>

            {/* Documents Grid */}
            {filteredDocuments.length > 0 ? (
              <div className="space-y-4">
                {filteredDocuments.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    {...doc}
                    onDownload={() => handleDownload(doc.title)}
                    onView={() => handleView(doc.title)}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No documents found
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? "Try adjusting your search terms" 
                    : "No documents in this category yet"}
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documents;
