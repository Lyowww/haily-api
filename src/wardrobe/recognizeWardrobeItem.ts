import OpenAI from 'openai';
import {
  WardrobeCategory,
  ColorFamily,
  StyleTag,
  SeasonTag,
  FitTag,
  CATEGORY_SYNONYMS,
  COLOR_SYNONYMS,
} from './enums';

export interface RecognitionInput {
  imageUrl: string;
  categoryHint?: string;
  notes?: string;
}

export interface RecognizedItem {
  category: string;
  colorFamily: string;
  colorHex?: string;
  styleTags: string[];
  seasonTags: string[];
  fitTag: string;
  extraTags: string[];
  confidence: {
    category: number;
    color: number;
    style: number;
  };
  notes: string;
}

export class WardrobeRecognitionService {
  constructor(private openai: OpenAI) {}

  async recognizeWardrobeItem(input: RecognitionInput): Promise<RecognizedItem> {
    const { imageUrl, categoryHint, notes } = input;

    // Build the recognition prompt
    const prompt = this.buildRecognitionPrompt(categoryHint, notes);

    try {
      // Check if it's a local URL and convert to base64
      let imageData: string;
      
      if (imageUrl.startsWith('http://localhost') || imageUrl.startsWith('http://127.0.0.1')) {
        // Fetch the image from local server and convert to base64
        const fs = require('fs');
        const path = require('path');
        
        // Extract filename from URL
        const filename = imageUrl.split('/').pop();
        const filepath = path.join(process.cwd(), 'uploads', filename);
        
        console.log('📷 Converting local image to base64:', filepath);
        
        // Read file and convert to base64
        const imageBuffer = fs.readFileSync(filepath);
        if (!imageBuffer || imageBuffer.length === 0) {
          throw new Error(`Local upload is empty (0 bytes): ${filepath}`);
        }
        const base64Image = imageBuffer.toString('base64');
        imageData = `data:image/jpeg;base64,${base64Image}`;
        
        console.log('✓ Image converted to base64 (length:', base64Image.length, 'chars)');
      } else {
        // Use URL directly for public URLs
        imageData = imageUrl;
      }

      // Call OpenAI Vision API
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o', // Latest vision model
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageData,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.3, // Lower temperature for more consistent classification
      });

      const rawResponse = response.choices[0]?.message?.content || '';
      
      // Parse JSON from response
      const parsedData = this.parseAIResponse(rawResponse);
      
      // Normalize to valid enums
      const normalized = this.normalizeToEnums(parsedData, categoryHint);
      
      return {
        ...normalized,
        notes: notes || '',
      };
    } catch (error) {
      console.error('Error recognizing wardrobe item:', error);
      
      // Fallback to unknown values
      return {
        category: categoryHint ? this.normalizeCategory(categoryHint) : WardrobeCategory.ACCESSORY,
        colorFamily: ColorFamily.UNKNOWN,
        styleTags: [],
        seasonTags: [SeasonTag.ALL_SEASON],
        fitTag: FitTag.UNKNOWN,
        extraTags: [],
        confidence: {
          category: 0.1,
          color: 0.1,
          style: 0.1,
        },
        notes: `Recognition failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  private buildRecognitionPrompt(categoryHint?: string, userNotes?: string): string {
    const hintContext = categoryHint
      ? `The user indicated this might be a: ${categoryHint}. Use this as a hint if the image is ambiguous.`
      : '';
    
    const notesContext = userNotes
      ? `User notes: ${userNotes}`
      : '';

    return `You are a fashion classification AI. Analyze this clothing/accessory image and return ONLY a valid JSON object with the following structure:

{
  "category": "one of: top, bottom, outerwear, shoes, bag, hat, accessory",
  "color_family": "one of: black, white, gray, navy, blue, green, olive, beige, brown, red, orange, yellow, purple, pink, multicolor, unknown",
  "color_hex": "optional hex code like #FF5733",
  "style_tags": ["array of: casual, smart_casual, streetwear, formal, sporty, luxury, minimal, business, party, travel, outdoor"],
  "season_tags": ["array of: summer, winter, spring_fall, all_season"],
  "fit_tag": "one of: slim, regular, relaxed, oversized, unknown",
  "extra_tags": ["array of descriptive strings like 'v-neck', 'button-down', 'leather', etc."],
  "confidence": {
    "category": 0.0-1.0,
    "color": 0.0-1.0,
    "style": 0.0-1.0
  }
}

RULES:
- If multiple items are visible, focus on the PRIMARY/MAIN item and lower confidence scores
- All enum values must be lowercase with underscores
- Return ONLY valid JSON, no markdown or explanation
- If uncertain, use "unknown" or "accessory" for category
- For confidence: 1.0 = certain, 0.5 = moderate, 0.2 = guessing
- Reject explicit/inappropriate images by returning category: "accessory", confidence: 0.0

${hintContext}
${notesContext}`;
  }

  private parseAIResponse(rawResponse: string): any {
    try {
      // Remove markdown code blocks if present
      const cleaned = rawResponse
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      return JSON.parse(cleaned);
    } catch (error) {
      console.error('Failed to parse AI response:', rawResponse);
      throw new Error('Invalid JSON response from AI');
    }
  }

  private normalizeToEnums(data: any, categoryHint?: string): Omit<RecognizedItem, 'notes'> {
    // Normalize category
    let category = this.normalizeCategory(data.category, categoryHint);
    const categoryConfidence = data.confidence?.category || 0.5;
    
    // If confidence is low and hint is provided, prefer the hint
    if (categoryHint && categoryConfidence < 0.6) {
      const hintCategory = this.normalizeCategory(categoryHint);
      if (hintCategory !== WardrobeCategory.ACCESSORY) {
        category = hintCategory;
      }
    }

    // Normalize color
    const colorFamily = this.normalizeColor(data.color_family);
    
    // Normalize style tags
    const styleTags = Array.isArray(data.style_tags)
      ? data.style_tags
          .map((tag: string) => this.normalizeStyleTag(tag))
          .filter((tag: string | null) => tag !== null)
      : [];
    
    // Normalize season tags
    const seasonTags = Array.isArray(data.season_tags)
      ? data.season_tags
          .map((tag: string) => this.normalizeSeasonTag(tag))
          .filter((tag: string | null) => tag !== null)
      : [SeasonTag.ALL_SEASON];
    
    // Normalize fit tag
    const fitTag = this.normalizeFitTag(data.fit_tag);
    
    // Extra tags - keep as strings, just lowercase and trim
    const extraTags = Array.isArray(data.extra_tags)
      ? data.extra_tags.map((tag: string) => String(tag).toLowerCase().trim())
      : [];

    return {
      category,
      colorFamily,
      colorHex: data.color_hex || undefined,
      styleTags,
      seasonTags,
      fitTag,
      extraTags,
      confidence: {
        category: Math.max(0, Math.min(1, data.confidence?.category || 0.5)),
        color: Math.max(0, Math.min(1, data.confidence?.color || 0.5)),
        style: Math.max(0, Math.min(1, data.confidence?.style || 0.5)),
      },
    };
  }

  private normalizeCategory(value: string, _hint?: string): string {
    if (!value) return WardrobeCategory.ACCESSORY;
    
    const normalized = value.toLowerCase().trim();
    
    // Check if it's already a valid enum
    if (Object.values(WardrobeCategory).includes(normalized as WardrobeCategory)) {
      return normalized;
    }
    
    // Check synonyms
    if (CATEGORY_SYNONYMS[normalized]) {
      return CATEGORY_SYNONYMS[normalized];
    }
    
    // Default to accessory
    return WardrobeCategory.ACCESSORY;
  }

  private normalizeColor(value: string): string {
    if (!value) return ColorFamily.UNKNOWN;
    
    const normalized = value.toLowerCase().trim();
    
    // Check if it's already a valid enum
    if (Object.values(ColorFamily).includes(normalized as ColorFamily)) {
      return normalized;
    }
    
    // Check synonyms
    if (COLOR_SYNONYMS[normalized]) {
      return COLOR_SYNONYMS[normalized];
    }
    
    // Default to unknown
    return ColorFamily.UNKNOWN;
  }

  private normalizeStyleTag(value: string): string | null {
    if (!value) return null;
    
    const normalized = value.toLowerCase().trim().replace(/[-\s]/g, '_');
    
    // Check if it's a valid enum
    if (Object.values(StyleTag).includes(normalized as StyleTag)) {
      return normalized;
    }
    
    return null;
  }

  private normalizeSeasonTag(value: string): string | null {
    if (!value) return null;
    
    const normalized = value.toLowerCase().trim().replace(/[-\s]/g, '_');
    
    // Check if it's a valid enum
    if (Object.values(SeasonTag).includes(normalized as SeasonTag)) {
      return normalized;
    }
    
    // Handle common variations
    if (normalized.includes('spring') || normalized.includes('fall') || normalized.includes('autumn')) {
      return SeasonTag.SPRING_FALL;
    }
    
    return null;
  }

  private normalizeFitTag(value: string): string {
    if (!value) return FitTag.UNKNOWN;
    
    const normalized = value.toLowerCase().trim();
    
    // Check if it's a valid enum
    if (Object.values(FitTag).includes(normalized as FitTag)) {
      return normalized;
    }
    
    // Handle common variations
    if (normalized.includes('tight') || normalized.includes('fitted')) {
      return FitTag.SLIM;
    }
    if (normalized.includes('loose') || normalized.includes('baggy')) {
      return FitTag.RELAXED;
    }
    if (normalized.includes('oversized') || normalized.includes('over-sized')) {
      return FitTag.OVERSIZED;
    }
    
    return FitTag.UNKNOWN;
  }
}

// Standalone function for easy import
export async function recognizeWardrobeItem(
  imageUrl: string,
  categoryHint?: string,
  notes?: string
): Promise<RecognizedItem & { rawAiJson?: string }> {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    console.error('⚠️ OPENAI_API_KEY not configured - using fallback metadata');
    // Return fallback metadata without calling API
    return {
      category: categoryHint || 'accessory',
      colorFamily: 'unknown',
      styleTags: [],
      seasonTags: ['all_season'],
      fitTag: 'unknown',
      extraTags: [],
      confidence: { category: 0, color: 0, style: 0 },
      notes: 'Recognition skipped - API key not configured',
    };
  }

  const openai = new OpenAI({ apiKey: openaiApiKey });
  const service = new WardrobeRecognitionService(openai);
  
  return service.recognizeWardrobeItem({ imageUrl, categoryHint, notes });
}

