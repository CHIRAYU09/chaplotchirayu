export interface Source {
  title: string;
  url: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  isLoading?: boolean;
}

export interface ChatApiRequest {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  portfolio: string[];
}

export interface ChatApiResponse {
  message: string;
  sources: Source[];
  extractedPortfolio: string[] | null;
}
