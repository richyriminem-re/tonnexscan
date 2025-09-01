/**
 * Compression utilities for scan data to optimize storage
 */
export class CompressionService {
  /**
   * Compress scan data using simple encoding
   */
  static compressScans(scans: any[]): string {
    try {
      const jsonString = JSON.stringify(scans);
      
      // Simple compression using LZ-like algorithm
      const compressed = this.simpleCompress(jsonString);
      return compressed;
    } catch (error) {
      console.error('Compression failed:', error);
      return JSON.stringify(scans);
    }
  }

  /**
   * Decompress scan data
   */
  static decompressScans(compressedData: string): any[] {
    try {
      // Try to decompress first
      const decompressed = this.simpleDecompress(compressedData);
      return JSON.parse(decompressed);
    } catch (error) {
      try {
        // Fallback to direct parse if not compressed
        return JSON.parse(compressedData);
      } catch (parseError) {
        console.error('Decompression failed:', error);
        return [];
      }
    }
  }

  /**
   * Simple compression algorithm
   */
  private static simpleCompress(str: string): string {
    const dict: { [key: string]: number } = {};
    const data = str.split('');
    const out = [];
    let currChar;
    let phrase = data[0];
    let code = 256;
    
    for (let i = 1; i < data.length; i++) {
      currChar = data[i];
      if (dict[phrase + currChar] != null) {
        phrase += currChar;
      } else {
        out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
        dict[phrase + currChar] = code;
        code++;
        phrase = currChar;
      }
    }
    out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
    
    return out.map(n => String.fromCharCode(n)).join('');
  }

  /**
   * Simple decompression algorithm
   */
  private static simpleDecompress(str: string): string {
    const dict: { [key: number]: string } = {};
    const data = str.split('').map(c => c.charCodeAt(0));
    let currChar = String.fromCharCode(data[0]);
    let oldPhrase = currChar;
    const out = [currChar];
    let code = 256;
    let phrase;
    
    for (let i = 1; i < data.length; i++) {
      const currCode = data[i];
      if (currCode < 256) {
        phrase = String.fromCharCode(currCode);
      } else {
        phrase = dict[currCode] ? dict[currCode] : oldPhrase + currChar;
      }
      out.push(phrase);
      currChar = phrase.charAt(0);
      dict[code] = oldPhrase + currChar;
      code++;
      oldPhrase = phrase;
    }
    
    return out.join('');
  }

  /**
   * Calculate compression ratio
   */
  static getCompressionRatio(original: string, compressed: string): number {
    return compressed.length / original.length;
  }

  /**
   * Estimate storage savings
   */
  static estimateSavings(originalSize: number, compressedSize: number): {
    savedBytes: number;
    savedPercentage: number;
  } {
    const savedBytes = originalSize - compressedSize;
    const savedPercentage = (savedBytes / originalSize) * 100;
    
    return {
      savedBytes,
      savedPercentage: Math.round(savedPercentage * 100) / 100
    };
  }
}