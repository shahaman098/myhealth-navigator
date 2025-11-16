import { supabase } from "@/integrations/supabase/client";

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
 * Fetch patient profile from Heidi API via Edge Function
 */
export const getPatientProfile = async (): Promise<PatientProfile> => {
  try {
    const { data, error } = await supabase.functions.invoke('heidi-profile');
    
    if (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }

    return data?.profile;
  } catch (error) {
    console.error('Failed to fetch patient profile:', error);
    // Return fallback profile
    return {
      name: "Patient",
      age: 0,
      dateOfBirth: "",
      bloodType: "Unknown",
      allergies: [],
      primaryPhysician: "",
      email: "",
      phone: "",
      address: "",
    };
  }
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
