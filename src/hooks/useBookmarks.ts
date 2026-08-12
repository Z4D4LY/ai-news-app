import { useState, useCallback } from 'react';

function loadBookmarks(): string[] {
  try {
    return JSON.parse(localStorage.getItem('bookmarks') || '[]');
  } catch {
    return [];
  }
}

function saveBookmarks(ids: string[]) {
  localStorage.setItem('bookmarks', JSON.stringify(ids));
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<string[]>(loadBookmarks);

  const toggleBookmark = useCallback((id: string) => {
    setBookmarks((prev) => {
      const next = prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id];
      saveBookmarks(next);
      return next;
    });
  }, []);

  const isBookmarked = useCallback(
    (id: string) => bookmarks.includes(id),
    [bookmarks]
  );

  return { bookmarks, toggleBookmark, isBookmarked };
}