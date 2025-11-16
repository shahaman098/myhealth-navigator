import { supabase } from "@/integrations/supabase/client";
import { TimelineEvent } from "@/components/timeline/TimelineItem";

/**
 * Fetch patient timeline events from Heidi API via Edge Function
 */
export const getPatientTimeline = async (): Promise<TimelineEvent[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('heidi-timeline');
    
    if (error) {
      console.error('Error fetching timeline:', error);
      throw error;
    }

    return data?.timeline || [];
  } catch (error) {
    console.error('Failed to fetch patient timeline:', error);
    // Return empty array on error
    return [];
  }
};

/**
 * Filter timeline events by type
 */
export const getTimelineByType = async (
  type: TimelineEvent["type"]
): Promise<TimelineEvent[]> => {
  const allEvents = await getPatientTimeline();
  return allEvents.filter(event => event.type === type);
};

/**
 * Get a single timeline event by ID
 */
export const getTimelineEventById = async (
  id: string
): Promise<TimelineEvent | undefined> => {
  const allEvents = await getPatientTimeline();
  return allEvents.find(event => event.id === id);
};
