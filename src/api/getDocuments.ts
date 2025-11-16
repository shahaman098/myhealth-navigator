import { supabase } from "@/integrations/supabase/client";
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
 * Fetch patient documents from Heidi API via Edge Function
 */
export const getDocuments = async (): Promise<Document[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('heidi-documents');
    
    if (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }

    return data?.documents || [];
  } catch (error) {
    console.error('Failed to fetch documents:', error);
    return [];
  }
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
