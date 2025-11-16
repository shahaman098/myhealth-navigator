import { mockTimelineData } from "@/data/mockTimeline";
import { TimelineEvent } from "@/components/timeline/TimelineItem";

/**
 * Mock API function to fetch patient timeline events
 * In a real application, this would make an HTTP request to your backend
 */
export const getPatientTimeline = async (): Promise<TimelineEvent[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Return mock data sorted by date (newest first)
  return mockTimelineData.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};

/**
 * Mock API function to filter timeline events by type
 */
export const getTimelineByType = async (
  type: TimelineEvent["type"]
): Promise<TimelineEvent[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return mockTimelineData.filter(event => event.type === type);
};

/**
 * Mock API function to get a single timeline event by ID
 */
export const getTimelineEventById = async (
  id: string
): Promise<TimelineEvent | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  return mockTimelineData.find(event => event.id === id);
};
