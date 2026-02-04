
export enum Language {
  TAMIL = 'Tamil',
  ENGLISH = 'English',
  HINDI = 'Hindi',
  MALAYALAM = 'Malayalam',
  TELUGU = 'Telugu'
}

export interface AnalysisResult {
  classification: 'Human' | 'AI-Generated';
  confidence: number;
  language: string;
  reasoning: string[];
  technicalDetails: {
    spectralAnomalies: boolean;
    breathingPatterns: string;
    prosodyNaturalness: string;
  };
}

export interface ScanRecord {
  id: string;
  timestamp: number;
  fileName: string;
  language: Language;
  result: AnalysisResult | null;
  status: 'pending' | 'completed' | 'error';
}
