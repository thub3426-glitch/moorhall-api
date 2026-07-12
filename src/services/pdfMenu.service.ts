import * as pdfParseNs from 'pdf-parse';
import OpenAI from 'openai';
import * as cloudinaryGateway from '../gateways/cloudinary.gateway.js';
import ApiError from '../utils/apiError.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type PdfParse = (data: Buffer) => Promise<{ text?: string }>;
const pdf = pdfParseNs as unknown as PdfParse;

export interface ExtractedMenuItem {
  name: string;
  price: number;
  description?: string;
  category: string;
}

export interface ExtractedImage {
  secure_url: string;
  public_id: string;
}

export interface PdfMenuResult {
  items: ExtractedMenuItem[];
  images: ExtractedImage[];
  rawImageCount: number;
}

function extractRawImages(buffer: Buffer, minSize = 16384): Buffer[] {
  const images: Buffer[] = [];

  for (let i = 0; i < buffer.length - 3; i++) {
    if (buffer[i] === 0xff && buffer[i + 1] === 0xd8 && buffer[i + 2] === 0xff) {
      let end = -1;
      for (let j = i + 3; j < buffer.length - 1; j++) {
        if (buffer[j] === 0xff && buffer[j + 1] === 0xd9) {
          end = j + 2;
          break;
        }
      }
      if (end !== -1 && end - i >= minSize) {
        images.push(buffer.slice(i, end));
        i = end;
      }
    }
  }

  for (let i = 0; i < buffer.length - 7; i++) {
    if (
      buffer[i] === 0x89 &&
      buffer[i + 1] === 0x50 &&
      buffer[i + 2] === 0x4e &&
      buffer[i + 3] === 0x47 &&
      buffer[i + 4] === 0x0a &&
      buffer[i + 5] === 0x1a &&
      buffer[i + 6] === 0x0a
    ) {
      let end = -1;
      for (let j = i + 4; j < buffer.length - 3; j++) {
        if (
          buffer[j] === 0x49 &&
          buffer[j + 1] === 0x45 &&
          buffer[j + 2] === 0x4e &&
          buffer[j + 3] === 0x44
        ) {
          end = j + 8;
          break;
        }
      }
      if (end !== -1 && end - i >= minSize) {
        images.push(buffer.slice(i, end));
        i = end;
      }
    }
  }

  return images;
}

export async function processMenuPdf(pdfBuffer: Buffer): Promise<PdfMenuResult> {
  let data: { text?: string };
  try {
    data = await pdf(pdfBuffer);
  } catch (err) {
    console.error('[pdfMenu] pdf-parse failed:', err);
    throw ApiError.badRequest('Unable to read PDF file. Please ensure it is a valid PDF.');
  }

  const fullText = data.text || '';

  if (!fullText || fullText.trim().length < 10) {
    throw ApiError.badRequest(
      'Could not extract readable text from PDF. Please upload a text-based PDF menu.'
    );
  }

  const rawImages = extractRawImages(pdfBuffer);
  let cloudinaryImages: ExtractedImage[] = [];

  if (rawImages.length > 0) {
    try {
      const uploadResults = await cloudinaryGateway.uploadMultipleImages(
        rawImages,
        'moorhall/menu-items/pdf-extracted'
      );
      cloudinaryImages = uploadResults.map((r) => ({
        secure_url: r.secure_url,
        public_id: r.public_id,
      }));
    } catch (uploadError) {
      console.error('[pdfMenu] Cloudinary image upload failed:', uploadError);
    }
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a restaurant menu parser. Extract menu items from the provided menu text.
Return ONLY valid JSON matching this exact schema:
{ "items": [ { "name": "Item Name", "price": 12.50, "description": "Optional description", "category": "food|drink|coffee|bakery|special" } ] }

Rules:
- Only include items with a clear name and numeric price.
- Convert prices to numbers.
- Infer category as one of: food, drink, coffee, bakery, special.
- If category is ambiguous or unknown, use "food".
- Do not include headings, section markers, or non-item text.`,
      },
      {
        role: 'user',
        content: `Extract menu items from this restaurant menu:\n\n${fullText}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0,
  });

  let parsed: { items?: any[] };
  try {
    parsed = JSON.parse(completion.choices[0].message.content || '{"items":[]}');
  } catch (parseError) {
    console.error('[pdfMenu] Failed to parse AI response:', parseError);
    throw ApiError.internal('Failed to parse extracted menu data');
  }

  const items: ExtractedMenuItem[] = (parsed.items || [])
    .map((item: any) => ({
      name: String(item.name || '').trim(),
      price: Number(item.price) || 0,
      description: item.description ? String(item.description).trim() : undefined,
      category: item.category ? String(item.category).trim().toLowerCase() : 'food',
    }))
    .filter((item) => item.name.length > 0 && item.price > 0);

  if (items.length === 0) {
    throw ApiError.badRequest('Could not extract valid menu items from PDF text.');
  }

  return {
    items,
    images: cloudinaryImages,
    rawImageCount: rawImages.length,
  };
}
