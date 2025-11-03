/**
 * Test script to verify Gemini 1.5 Flash integration
 * This script tests the direct file processing capability
 * 
 * Usage: 
 *   From server directory: node scripts/test-gemini.js
 *   From scripts directory: node test-gemini.js
 */

const path = require("path");
// Load .env from parent directory (server/)
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const geminiService = require("../services/geminiService");
const fs = require("fs");


async function testGeminiIntegration() {
  console.log("=".repeat(60));
  console.log("Testing Gemini 1.5 Flash Integration");
  console.log("=".repeat(60));
  console.log();

  // Check if API key is set
  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ ERROR: GEMINI_API_KEY is not set in .env file");
    process.exit(1);
  }

  console.log("✅ GEMINI_API_KEY is set");
  console.log(`   Key starts with: ${process.env.GEMINI_API_KEY.substring(0, 10)}...`);
  console.log();

  // Test with a sample timetable (you'll need to provide a real file)
  console.log("📝 To test with an actual file:");
  console.log("   1. Place a timetable PDF or PNG in the server directory");
  console.log("   2. Update the file path in this script");
  console.log("   3. Run: node scripts/test-gemini.js");
  console.log();

  // Example test with a file (uncomment and update path when ready)
  /*
  const testFilePath = path.join(__dirname, "../timetable.pdf");
  
  if (fs.existsSync(testFilePath)) {
    console.log(`📄 Testing with file: ${testFilePath}`);
    
    const fileBuffer = fs.readFileSync(testFilePath);
    const mimetype = "application/pdf"; // or "image/png"
    
    console.log("   File size:", fileBuffer.length, "bytes");
    console.log("   Sending to Gemini...");
    console.log();
    
    try {
      const startTime = Date.now();
      const roomsData = await geminiService.parseRoomDataFromFile(fileBuffer, mimetype);
      const endTime = Date.now();
      
      console.log("✅ SUCCESS!");
      console.log(`   Processing time: ${(endTime - startTime) / 1000}s`);
      console.log(`   Rooms extracted: ${roomsData.length}`);
      console.log();
      
      if (roomsData.length > 0) {
        console.log("📊 Sample extracted data (first 5 entries):");
        roomsData.slice(0, 5).forEach((room, index) => {
          console.log(`   ${index + 1}. Room: ${room.roomNumber} | Day: ${room.day} | Time: ${room.duration} | Status: ${room.status}`);
        });
        
        if (roomsData.length > 5) {
          console.log(`   ... and ${roomsData.length - 5} more entries`);
        }
      } else {
        console.log("⚠️  No room data extracted. Check your file content.");
      }
      
      console.log();
      console.log("Full extracted data:");
      console.log(JSON.stringify(roomsData, null, 2));
      
    } catch (error) {
      console.error("❌ ERROR during processing:");
      console.error("   ", error.message);
      console.error();
      console.error("Stack trace:");
      console.error(error.stack);
    }
  } else {
    console.log(`⚠️  Test file not found: ${testFilePath}`);
    console.log("   Create a test file to run the full test.");
  }
  */

  console.log();
  console.log("=".repeat(60));
  console.log("Test completed!");
  console.log("=".repeat(60));
}

// Run the test
testGeminiIntegration().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
