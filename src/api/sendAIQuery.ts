/**
 * Mock AI query response for demonstration
 * In a real application, this would call your AI backend (edge function)
 */
export interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Mock function to send a query to the AI Health Guide
 * This simulates streaming responses for a more realistic experience
 */
export const sendAIQuery = async (
  messages: AIMessage[],
  onChunk?: (chunk: string) => void
): Promise<string> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const lastUserMessage = messages[messages.length - 1]?.content.toLowerCase() || "";
  
  let response = "";
  
  // Generate contextual responses based on keywords
  if (lastUserMessage.includes("blood pressure") || lastUserMessage.includes("hypertension")) {
    response = "Blood pressure is the force of blood pushing against the walls of your arteries. Think of it like water pressure in a garden hose. When we measure blood pressure, we get two numbers:\n\n• The top number (systolic) measures the pressure when your heart beats and pushes blood out.\n• The bottom number (diastolic) measures the pressure when your heart rests between beats.\n\nA reading of 128/82 is slightly elevated but not dangerously high. It's like having the water pressure in your home a little higher than ideal - not an emergency, but something to keep an eye on. That's why your doctor prescribed medication and recommended lifestyle changes to help bring it down to a healthier range.";
  } else if (lastUserMessage.includes("lisinopril") || lastUserMessage.includes("medication")) {
    response = "Lisinopril is a medication that helps relax and widen your blood vessels, making it easier for your heart to pump blood. Think of it like opening a door wider - it reduces the resistance and makes everything flow more smoothly.\n\nYou're taking 10mg once daily, which is a common starting dose. It's important to take it at the same time each day, usually in the morning. The medication works best when it maintains a steady level in your body.\n\nSome people experience mild dizziness when they first start, especially when standing up quickly. This usually improves after a few weeks as your body adjusts. If you experience severe dizziness, swelling, or difficulty breathing, contact your doctor right away.";
  } else if (lastUserMessage.includes("lab") || lastUserMessage.includes("test") || lastUserMessage.includes("results")) {
    response = "Your lab results look great! Let me break down what they mean:\n\n• Blood sugar (glucose): 94 - This is excellent. Normal range is 70-100, so you're right in the healthy zone.\n\n• Kidney function (BUN, Creatinine, eGFR): All normal - Your kidneys are doing their job of filtering waste from your blood properly.\n\n• Liver function (ALT, AST): All normal - Your liver is healthy and functioning well.\n\nBasically, these tests are like a report card for your body's major systems, and you're getting good grades across the board! The fact that everything is in the normal range means your organs are working as they should.";
  } else if (lastUserMessage.includes("next") || lastUserMessage.includes("expect")) {
    response = "Based on your recent care, here's what you can expect:\n\n1. **In the next few weeks**: Your doctor will want to check how well the blood pressure medication is working. You might have a follow-up appointment or be asked to monitor your blood pressure at home.\n\n2. **Lifestyle changes**: Your doctor recommended reducing salt, exercising regularly, and managing stress. These aren't just suggestions - they can actually be as effective as medication in managing blood pressure!\n\n3. **Monitoring**: Keep track of how you feel, especially if you notice any side effects from the medication.\n\n4. **Follow-up**: You have an appointment scheduled with Dr. Chen in April. This will be a good time to review your progress and adjust your treatment plan if needed.\n\nRemember, managing blood pressure is usually a long-term process, not a quick fix. You're on the right track!";
  } else {
    response = "I'm here to help you understand your health information in plain language. I can explain things like:\n\n• What your diagnoses mean and how they affect you\n• How your medications work and why they were prescribed\n• What your test results indicate about your health\n• What to expect from treatments or procedures\n• What your next steps should be\n\nFeel free to ask me about anything in your medical records or health timeline. I'll do my best to explain it in simple, everyday terms!";
  }
  
  // Simulate streaming by sending chunks
  if (onChunk) {
    const words = response.split(" ");
    for (let i = 0; i < words.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 50));
      onChunk(words[i] + " ");
    }
  }
  
  return response;
};
