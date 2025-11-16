export interface PatientProfile {
  name: string;
  age: number;
  dateOfBirth: string;
  bloodType: string;
  allergies: string[];
  primaryPhysician: string;
  email: string;
  phone: string;
  address: string;
}

/**
 * Mock API function to fetch patient profile information
 * In a real application, this would make an HTTP request to your backend
 */
export const getPatientProfile = async (): Promise<PatientProfile> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 400));
  
  return {
    name: "Sarah Johnson",
    age: 42,
    dateOfBirth: "1982-03-15",
    bloodType: "A+",
    allergies: ["Penicillin", "Shellfish"],
    primaryPhysician: "Dr. Michael Chen, MD",
    email: "sarah.johnson@email.com",
    phone: "(555) 123-4567",
    address: "123 Health Street, Medical City, MC 12345",
  };
};

/**
 * Mock API function to update patient profile
 */
export const updatePatientProfile = async (
  profile: Partial<PatientProfile>
): Promise<PatientProfile> => {
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const currentProfile = await getPatientProfile();
  return { ...currentProfile, ...profile };
};
