const en = {
  startPage: {
    welcomeTitle: "Welcome to the News Reader!",
    welcomeText: "Discover the latest news from around the world. Use the menu on the left to browse local stories, explore by country or continent, or search for specific topics. This welcome screen can be hidden anytime.",
    mainFeatures: "Main Features",
    localNews: {
      title: "Local News",
      desc: "View top events happening near you. Click to continue.",
    },
    continent: {
      title: "Countries and Continents",
      desc: "Browse news by regions and countries. Click to continue.",
    },
    search: {
      title: "Search",
      desc: "Quickly find topics and articles that interest you. Click to continue.",
    },
    hideButton: "Don't show this page again (Continue to the app)",
  },
  settings: {
    languageTitle: "Language Settings",
    selectLanguage: "Select language:",
    languageInfo: "The app interface will use the selected language.",
  },

  // BENT: A NavigationBar modul használja ezeket a kulcsokat (navigation.*)
  navigation: {
    aria: 'Main navigation bar',
    openLeftPanel: 'Open left panel',
    closeLeftPanel: 'Close left panel',
    openRightPanel: 'Open right panel',
    closeRightPanel: 'Close right panel',
    refreshing: 'Refreshing news...',
    updated: '{{count}} news updated!',
    noNew: 'No new news or error occurred.',
    refreshFailed: 'Refresh failed! Please try again.',
    settings: 'Open settings',
    information: 'Information',
    informationWithUnread: 'Information, {{count}} unread',
    controls: 'Navigation controls',
    back: 'Back',
    forward: 'Forward',
    refresh: 'Refresh',
    loading: 'Loading...',
  },

  // BENT: A SmartSearchBar komponens használja ezeket a kulcsokat (search.*)
  search: {
    placeholder: 'Search news or filter by source/category...',
    unknownSource: 'Unknown source',
    searching: 'Searching...',
    startSearch: 'Start search',
    inputAria: 'Search field',
    clear: 'Clear search field',
    suggestionsAria: 'Search suggestions',
    suggestion: {
      history: 'History',
      bookmark: 'Source',
      suggestion: 'Suggestion',
    },
  },

  // BENT: A FrontLocal modul használja ezeket a kulcsokat (localnews.*)
  localnews: {
    untitled: 'Untitled news',
    noDescription: 'No description',
    unknownSource: 'Unknown source',
  },

  // BENT: A History komponensek használják ezeket a kulcsokat (history.*)
  history: {
    title: 'History',
    table: {
      time: 'Time',
      title: 'Title',
      source: 'Source',
      empty: 'No history',
    },
    item: {
      timeLabel: 'Time',
      titleLabel: 'Title',
      urlLabel: 'URL',
      openInNewTab: 'Open in new tab',
    },
    day: {
      open: 'Open',
      close: 'Close',
    },
    actions: {
      toggle: 'Expand/Collapse',
    },
  },

  contentType: {
    title: "Content",
    text: "Text",
    video: "Video", 
    both: "Both",
    textTitle: "Text news only",
    videoTitle: "Video content only",
    bothTitle: "Text and video content together",
    comingSoon: "Coming Soon!",
    comingSoonTitle: "This feature is coming soon"
  },
  
  // Home
  home: {
    nav: {
      home: "Home",
      dashboard: "Dashboard", 
      bookmarks: "Bookmarks",
      history: "History",
      my: "My",
    },
    search: {
      placeholder: "Search news...",
      settingsTitle: "Search settings",
      searching: "🔍 Searching worldwide...",
    },
  },
};

export default en;