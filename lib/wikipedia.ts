import axios from 'axios';
import * as cheerio from 'cheerio';

export interface WikiSection {
  title: string;
  content: string;
}

export async function fetchWikipediaPage(url: string): Promise<WikiSection[]> {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    const sections: WikiSection[] = [];
    
    // Get the main content div
    const content = $('#mw-content-text .mw-parser-output');
    
    // Extract introduction (paragraphs before first heading)
    const introParagraphs: string[] = [];
    content.children('p').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 50) {
        introParagraphs.push(text);
      }
    });
    
    if (introParagraphs.length > 0) {
      sections.push({
        title: 'Introduction',
        content: introParagraphs.join('\n\n')
      });
    }
    
    // Extract sections with headings
    content.find('h2, h3').each((_, el) => {
      const heading = $(el).find('.mw-headline').text().trim();
      
      // Skip certain sections
      if (heading.match(/^(References|External links|See also|Notes)$/i)) {
        return;
      }
      
      const paragraphs: string[] = [];
      let current = $(el).next();
      
      while (current.length > 0 && !current.is('h2, h3')) {
        if (current.is('p')) {
          const text = current.text().trim();
          if (text.length > 50) {
            paragraphs.push(text);
          }
        }
        current = current.next();
      }
      
      if (paragraphs.length > 0) {
        sections.push({
          title: heading,
          content: paragraphs.join('\n\n')
        });
      }
    });
    
    return sections;
  } catch (error) {
    console.error('Error fetching Wikipedia page:', error);
    throw new Error('Failed to fetch Wikipedia page');
  }
}

export function chunkText(text: string, maxChunkSize: number = 1000): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }
  
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}