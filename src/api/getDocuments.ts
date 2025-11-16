import { DocumentType } from "@/components/documents/DocumentCard";

export interface Document {
  id: string;
  title: string;
  type: DocumentType;
  date: string;
  provider?: string;
  fileSize?: string;
}

/**
 * Mock API function to fetch patient documents
 * In a real application, this would make an HTTP request to your backend
 */
export const getDocuments = async (): Promise<Document[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return [
    {
      id: "1",
      title: "Complete Metabolic Panel Results",
      type: "lab",
      date: "2024-02-20",
      provider: "LabCorp",
      fileSize: "245 KB",
    },
    {
      id: "2",
      title: "Cardiology Consultation Summary",
      type: "letter",
      date: "2024-02-28",
      provider: "Dr. Michael Chen, MD",
      fileSize: "180 KB",
    },
    {
      id: "3",
      title: "Chest X-Ray Report",
      type: "imaging",
      date: "2024-01-15",
      provider: "Radiology Associates",
      fileSize: "2.1 MB",
    },
    {
      id: "4",
      title: "Lisinopril Prescription",
      type: "prescription",
      date: "2024-03-10",
      provider: "Dr. Michael Chen, MD",
      fileSize: "120 KB",
    },
    {
      id: "5",
      title: "Annual Physical Examination Report",
      type: "report",
      date: "2024-03-15",
      provider: "Dr. Sarah Johnson, MD",
      fileSize: "320 KB",
    },
    {
      id: "6",
      title: "Lipid Panel - Follow-up",
      type: "lab",
      date: "2024-01-10",
      provider: "Quest Diagnostics",
      fileSize: "198 KB",
    },
    {
      id: "7",
      title: "Referral Letter to Cardiologist",
      type: "letter",
      date: "2024-02-15",
      provider: "Dr. Sarah Johnson, MD",
      fileSize: "150 KB",
    },
    {
      id: "8",
      title: "Echocardiogram Results",
      type: "imaging",
      date: "2024-03-01",
      provider: "Heart Health Center",
      fileSize: "1.8 MB",
    },
  ];
};

/**
 * Mock API function to filter documents by type
 */
export const getDocumentsByType = async (
  type: DocumentType
): Promise<Document[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const allDocuments = await getDocuments();
  return allDocuments.filter(doc => doc.type === type);
};

/**
 * Mock API function to download a document
 */
export const downloadDocument = async (documentId: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log(`Downloading document ${documentId}`);
  // In a real app, this would trigger a file download
};
