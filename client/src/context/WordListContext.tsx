import { createContext, useContext, useEffect, useState } from 'react';

const WordListContext = createContext(new Set(['error']));

export function WordListProvider({ children }: { children: React.ReactNode }) {
  const [validWords, setValidWords] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchValidWords = async () => {
      try {
        const response = await fetch('word-list.txt');
        const data = await response.text();
        setValidWords(new Set(data.split('\n').map((entry) => entry.trim())));
      } catch (error) {
        console.error('Error fetching valid words:', error);
      }
    };

    fetchValidWords();
  }, []);

  return <WordListContext.Provider value={validWords}>{children}</WordListContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWordList() {
  return useContext(WordListContext);
}
