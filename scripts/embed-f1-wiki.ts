import axios from 'axios';
import * as cheerio from 'cheerio';

export interface WikiSection {
  title: string;
  content: string;
}

// Use Wikipedia API for better reliability
export async function fetchWikipediaPageAPI(title: string): Promise<WikiSection[]> {
  try {
    const apiUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=sections|text&format=json&origin=*`;

    const response = await axios.get(apiUrl, {
      headers: {
        'User-Agent': 'RAG-Bot/1.0 (Educational Purpose)'
      }
    });

    const data = response.data;
    if (data.error) {
      throw new Error(data.error.info);
    }

    const $ = cheerio.load(data.parse.text['*']);
    const sections: WikiSection[] = [];

    // Extract introduction
    const introParagraphs: string[] = [];
    $('p').each((i, el) => {
      if (i > 10) return false; // Only first few paragraphs for intro
      const text = $(el).text().trim();
      if (text.length > 50 && !$(el).parents('.infobox').length) {
        introParagraphs.push(text);
      }
    });

    if (introParagraphs.length > 0) {
      sections.push({
        title: 'Introduction',
        content: introParagraphs.join('\n\n')
      });
    }

    // Extract sections from API
    if (data.parse.sections) {
      for (const section of data.parse.sections) {
        if (section.toclevel === 1 && !section.line.match(/^(References|External links|See also|Notes)/i)) {
          const sectionContent = await fetchWikipediaSection(title, section.index);
          if (sectionContent && sectionContent.length > 100) {
            sections.push({
              title: section.line,
              content: sectionContent
            });
          }
        }
      }
    }

    return sections;
  } catch (error) {
    console.error('Error fetching Wikipedia page via API:', error);
    throw new Error('Failed to fetch Wikipedia page');
  }
}

async function fetchWikipediaSection(title: string, sectionIndex: string): Promise<string> {
  try {
    const apiUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=text&section=${sectionIndex}&format=json&origin=*`;

    const response = await axios.get(apiUrl, {
      headers: {
        'User-Agent': 'RAG-Bot/1.0 (Educational Purpose)'
      }
    });

    const $ = cheerio.load(response.data.parse.text['*']);
    const paragraphs: string[] = [];

    $('p').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 50) {
        paragraphs.push(text);
      }
    });

    return paragraphs.join('\n\n');
  } catch (error) {
    return '';
  }
}

// Original scraper with User-Agent (fallback)
export async function fetchWikipediaPage(url: string): Promise<WikiSection[]> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });
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

import { addDocument } from '../lib/rag';

const F1_WIKI_TITLE = 'Formula One';
const F1_WIKI_URL = 'https://en.wikipedia.org/wiki/Formula_One';

async function embedF1Wikipedia() {
  console.log('Fetching F1 Wikipedia page...');

  try {
    // Try API first, then fallback to scraping
    let sections: WikiSection[] = [];
    try {
      console.log('Attempting to fetch via API...');
      sections = await fetchWikipediaPageAPI(F1_WIKI_TITLE);
    } catch (e) {
      console.log('API fetch failed, falling back to scraper...', e);
      sections = await fetchWikipediaPage(F1_WIKI_URL);
    }

    console.log(`Found ${sections.length} sections`);

    let totalChunks = 0;

    for (const section of sections) {
      console.log(`\nProcessing section: ${section.title}`);

      // Chunk the content if it's too long
      const chunks = chunkText(section.content, 800);
      console.log(`  Split into ${chunks.length} chunks`);

      for (let i = 0; i < chunks.length; i++) {
        const chunkId = `f1-wiki-${section.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-chunk-${i}`;

        try {
          await addDocument({
            id: chunkId,
            text: chunks[i],
            metadata: {
              source: 'Wikipedia',
              url: F1_WIKI_URL,
              section: section.title,
              chunkIndex: i,
              totalChunks: chunks.length,
              addedAt: new Date().toISOString()
            }
          });

          totalChunks++;
          console.log(`  ✓ Embedded chunk ${i + 1}/${chunks.length}`);
        } catch (error) {
          console.error(`  ✗ Failed to embed chunk ${i + 1}:`, error);
        }

        // Small delay to avoid overwhelming DB/LLM
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`\n✅ Successfully embedded ${totalChunks} chunks from F1 Wikipedia page!`);
  } catch (error) {
    console.error('Error embedding F1 Wikipedia:', error);
    process.exit(1);
  }
}

embedF1Wikipedia();