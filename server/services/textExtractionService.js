const { PDFParse } = require("pdf-parse");
const mammoth = require("mammoth");
const Tesseract = require("tesseract.js");

class TextExtractionService {
  /**
   * Extract text from PDF file
   * @param {Buffer} fileBuffer - PDF file buffer
   * @returns {Promise<string>} Extracted text
   */
  async extractFromPDF(fileBuffer) {
    try {
      const parser = new PDFParse({ data: fileBuffer });
      const result = await parser.getText();
      await parser.destroy(); // Clean up resources
      return result.text;
    } catch (error) {
      throw new Error(`PDF extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract text from DOCX file
   * @param {Buffer} fileBuffer - DOCX file buffer
   * @returns {Promise<string>} Extracted text
   */
  async extractFromDOCX(fileBuffer) {
    try {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      return result.value;
    } catch (error) {
      throw new Error(`DOCX extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract text from image using OCR
   * @param {Buffer} fileBuffer - Image file buffer
   * @returns {Promise<string>} Extracted text
   */
  async extractFromImage(fileBuffer) {
    try {
      const {
        data: { text },
      } = await Tesseract.recognize(fileBuffer, "eng", {
        logger: () => {}, // Suppress logs
      });
      return text;
    } catch (error) {
      throw new Error(`Image OCR extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract text from file based on mime type
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} mimetype - File mime type
   * @returns {Promise<string>} Extracted text
   */
  async extractText(fileBuffer, mimetype) {
    try {
      let extractedText = "";

      switch (mimetype) {
        case "application/pdf":
          extractedText = await this.extractFromPDF(fileBuffer);
          break;

        case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        case "application/msword":
          extractedText = await this.extractFromDOCX(fileBuffer);
          break;

        case "image/png":
        case "image/jpeg":
        case "image/jpg":
        case "image/gif":
        case "image/bmp":
        case "image/tiff":
          extractedText = await this.extractFromImage(fileBuffer);
          break;

        default:
          throw new Error(`Unsupported file type: ${mimetype}`);
      }

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error("No text could be extracted from the file");
      }

      return extractedText.trim();
    } catch (error) {
      throw new Error(`Text extraction failed: ${error.message}`);
    }
  }
}

module.exports = new TextExtractionService();
