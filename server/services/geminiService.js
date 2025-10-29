const dotenv = require("dotenv");
dotenv.config();

const { GoogleGenerativeAI } = require("@google/generative-ai");

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
    });
  }

  /**
   * Parse extracted text into structured room data
   * @param {string} extractedText - Raw text extracted from file
   * @returns {Promise<Array>} Array of room objects
   */
  async parseRoomDataFromText(extractedText) {
    try {
      const prompt = `You are a data extraction specialist. Analyze the following text and extract room/classroom scheduling information.

Extract and format the data into a JSON array of room objects. Each room object should have:
- roomNumber: string (e.g., "R101", "A205", "300")
- day: string (MUST be one of: "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")
- duration: string (MUST be EXACTLY one of these formats: "9:00-10:00", "10:00-11:00", "11:30-12:30", "12:30-1:30", "2:30-3:30", "3:30-4:30")
- status: string ("Vacant" or "Occupied")

CRITICAL DURATION RULES:
- ONLY use these exact time slots: "9:00-10:00", "10:00-11:00", "11:30-12:30", "12:30-1:30", "2:30-3:30", "3:30-4:30"
- If you see "9-10" or "9:00-10:00 AM" or "09:00-10:00", convert it to "9:00-10:00"
- If you see "10-11" or "10:00-11:00 AM", convert it to "10:00-11:00"
- If you see "11:30-12:30" or "11.30-12.30", convert it to "11:30-12:30"
- If you see "12:30-1:30" or "12:30-13:30" or "12.30-1.30 PM", convert it to "12:30-1:30"
- If you see "2:30-3:30" or "14:30-15:30" or "2.30-3.30 PM", convert it to "2:30-3:30"
- If you see "3:30-4:30" or "15:30-16:30" or "3.30-4.30 PM", convert it to "3:30-4:30"
- If a time slot doesn't match ANY of these, SKIP that entry completely

IMPORTANT RULES:
1. Extract ONLY room scheduling information
2. Duration MUST match EXACTLY one of the six predefined slots above
3. Day MUST match exactly one of the seven days listed above (capitalize first letter)
4. Room numbers should be uppercase and trimmed
5. If multiple time slots exist for the same room on the same day, create separate entries
6. If status is not specified, default to "Vacant"
7. Be highly accurate - no mismatches allowed
8. If time slot doesn't match the six predefined slots, skip that entry

Text to parse:
${extractedText}

Return ONLY a valid JSON array, no additional text or explanation. If no valid room data is found, return an empty array [].

Example format:
[
  {
    "roomNumber": "R101",
    "day": "Monday",
    "duration": "9:00-10:00",
    "status": "Vacant"
  },
  {
    "roomNumber": "R101",
    "day": "Monday",
    "duration": "2:30-3:30",
    "status": "Occupied"
  }
]`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Clean up the response - remove markdown code blocks if present
      let cleanedText = text.trim();
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "");
      } else if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.replace(/```\n?/g, "");
      }

      // Parse JSON
      const roomData = JSON.parse(cleanedText);

      // Validate the data
      if (!Array.isArray(roomData)) {
        throw new Error("Gemini response is not an array");
      }

      // Predefined valid time slots
      const validTimeSlots = [
        "9:00-10:00",
        "10:00-11:00",
        "11:30-12:30",
        "12:30-1:30",
        "2:30-3:30",
        "3:30-4:30",
      ];

      // Validate each room entry
      const validDays = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ];
      const validStatuses = ["Vacant", "Occupied"];

      /**
       * Normalize duration to match one of the predefined slots
       * @param {string} duration - Duration string to normalize
       * @returns {string|null} Normalized duration or null if no match
       */
      const normalizeDuration = (duration) => {
        if (!duration) return null;

        // Remove spaces and convert to lowercase for comparison
        const cleaned = duration.trim().toLowerCase().replace(/\s+/g, "");

        // Direct match
        if (validTimeSlots.includes(duration.trim())) {
          return duration.trim();
        }

        // Try to match patterns
        // Pattern: 9-10, 09-10, 9:00-10:00, etc.
        if (/^0?9[:\.]?0?0?-0?10[:\.]?0?0?$/.test(cleaned)) return "9:00-10:00";
        if (/^0?10[:\.]?0?0?-0?11[:\.]?0?0?$/.test(cleaned))
          return "10:00-11:00";
        if (/^0?11[:\.]?30-0?12[:\.]?30$/.test(cleaned)) return "11:30-12:30";
        if (
          /^0?12[:\.]?30-0?1[:\.]?30$/.test(cleaned) ||
          /^0?12[:\.]?30-0?13[:\.]?30$/.test(cleaned)
        )
          return "12:30-1:30";
        if (
          /^0?2[:\.]?30-0?3[:\.]?30$/.test(cleaned) ||
          /^0?14[:\.]?30-0?15[:\.]?30$/.test(cleaned)
        )
          return "2:30-3:30";
        if (
          /^0?3[:\.]?30-0?4[:\.]?30$/.test(cleaned) ||
          /^0?15[:\.]?30-0?16[:\.]?30$/.test(cleaned)
        )
          return "3:30-4:30";

        // If no match found, return null
        return null;
      };

      const validatedRooms = roomData.filter((room) => {
        if (!room.roomNumber || typeof room.roomNumber !== "string")
          return false;
        if (!room.day || !validDays.includes(room.day)) return false;

        // Normalize and validate duration
        const normalizedDuration = normalizeDuration(room.duration);
        if (!normalizedDuration) return false;

        // Update room duration with normalized value
        room.duration = normalizedDuration;

        if (!room.status || !validStatuses.includes(room.status)) {
          room.status = "Vacant"; // Default to Vacant if invalid
        }
        return true;
      });

      // Normalize the data
      const normalizedRooms = validatedRooms.map((room) => ({
        roomNumber: room.roomNumber.trim().toUpperCase(),
        day: room.day.trim(),
        duration: room.duration.trim(),
        status: room.status,
      }));

      return normalizedRooms;
    } catch (error) {
      console.error("Gemini parsing error:", error);
      throw new Error(
        `Failed to parse room data with Gemini: ${error.message}`
      );
    }
  }
}

module.exports = new GeminiService();
