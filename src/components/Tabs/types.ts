export interface Tab {
  id: string;
  mode: 'panel' | 'home' | 'search' | 'video' | 'news' | 'new' | 'my_page'; // <-- Bővítve: 'my_page' is
  title: string;
  // ...egyéb tab-specifikus adatok
}