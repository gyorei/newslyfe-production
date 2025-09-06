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

  // BENT: A SmartSearchBar komponens használja ezeket a kulcsokat (searchBar.*)
  searchBar: {
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
  // SearchTab component
  searchTab: {
    resultsTitle: "Search Results",
    totalResults: "Total: {{count}} results",
    searching: "Searching...",
    noResults: "No results found.",
    openDetailedView: "Open detailed view"
  },
  // Search hook error messages
  searchErrors: {
    error: {
      general: "An error occurred during search",
      unknown: "Unknown error occurred"
    },
    unknownSource: "Unknown source",
    resultsCount: "{{count}} results",
    detailedView: "Detailed view",
    openDetailedView: "Open detailed view",
    searchPrefix: "🔍"
  },
  // Pagination
  pagination: {
    previous: "Previous",
    next: "Next"
  },
  // Tabs accessibility
  tabs: {
    ariaLabel: "Application tabs",
    tablist: "Tabs",
    selectTab: "Select {{title}} tab",
    closeTab: "Close {{title}} tab",
    closeSymbol: "×"
  },
  
  // Search Filters
  searchFilters: {
    title: "Filter by country",
    deselectAll: "Deselect All",
    selectAll: "Select All"
  },
  
  // Settings Tabs
  settingsTabs: {
    startup: "On startup",
    general: "General",
    appearance: "Appearance",
    content: "Content", 
    location: "Location",
    language: "Language",
    desktop: "Desktop App",
    search: "Search"
  },
  
  // General Settings
  generalSettings: {
    title: "General Settings",
    startupScreen: "Startup Screen:",
    home: "Home",
    favorites: "Favorites",
    latestNews: "Latest News", 
    notifications: "Notifications",
    notificationsPrompts: "Notifications & Prompts",
    locationPrompt: "Show location prompt for local news",
    locationPromptDesc: "Enable or disable the location prompt when clicking on Local news"
  },
  
  // Startup Settings
  startupSettings: {
    title: "On Startup",
    openNewTab: "Open a new tab",
    continueSession: "Continue where you left off",
    openSpecificPages: "Open specific pages",
    pagesLabel: "Pages (URL):",
    emptyState: "No pages added yet. Add some URLs below.",
    removePageTitle: "Remove this page",
    removeButton: "Remove",
    addButton: "Add Page"
  },
  
  // Video Panel  
  videoPanel: {
    loading: "Loading videos...",
    retry: "Retry",
    noVideos: "No videos found.",
    renderError: "Component rendering failed. Please try again."
  },
  
  // Video Card - Time formatting
  videoCard: {
    timeAgo: {
      seconds: "{{count}} second{{count === 1 ? '' : 's'}} ago",
      minutes: "{{count}} minute{{count === 1 ? '' : 's'}} ago",
      hours: "{{count}} hour{{count === 1 ? '' : 's'}} ago", 
      days: "{{count}} day{{count === 1 ? '' : 's'}} ago",
      weeks: "{{count}} week{{count === 1 ? '' : 's'}} ago",
      months: "{{count}} month{{count === 1 ? '' : 's'}} ago",
      years: "{{count}} year{{count === 1 ? '' : 's'}} ago"
    }
  },
  
  // Country names
  country: {
    // Most common countries that appear in search results
    "United States": "United States",
    "Belgium": "Belgium", 
    "Hungary": "Hungary",
    "Finland": "Finland",
    "United Kingdom": "United Kingdom",
    "Germany": "Germany",
    "France": "France",
    "Canada": "Canada",
    "Australia": "Australia",
    "Netherlands": "Netherlands",
    "Italy": "Italy",
    "Spain": "Spain",
    "Poland": "Poland",
    "Sweden": "Sweden",
    "Norway": "Norway",
    "Denmark": "Denmark",
    "Switzerland": "Switzerland",
    "Austria": "Austria",
    "Ireland": "Ireland",
    "Portugal": "Portugal",
    "Greece": "Greece",
    "Czech Republic": "Czech Republic",
    "Slovakia": "Slovakia",
    "Slovenia": "Slovenia",
    "Croatia": "Croatia",
    "Romania": "Romania",
    "Bulgaria": "Bulgaria",
    "Ukraine": "Ukraine",
    "Russia": "Russia",
    "Turkey": "Turkey",
    "Japan": "Japan",
    "South Korea": "South Korea",
    "China": "China",
    "India": "India",
    "Brazil": "Brazil",
    "Argentina": "Argentina",
    "Mexico": "Mexico",
    "Chile": "Chile",
    "South Africa": "South Africa",
    "Egypt": "Egypt",
    "Israel": "Israel",
    "Saudi Arabia": "Saudi Arabia",
    "UAE": "UAE",
    "Thailand": "Thailand",
    "Malaysia": "Malaysia",
    "Singapore": "Singapore",
    "Indonesia": "Indonesia",
    "Philippines": "Philippines",
    "Vietnam": "Vietnam",
    "New Zealand": "New Zealand"
  },
  
  // Favorites
  favorites: {
    title: "Favorite News and Sources",
    emptyMessage: "No favorites yet. You can mark news as favorite by clicking the ⭐ button."
  },
  
  // HistoryList component (utility)
  historyList: {
    title: "Browsing History",
    emptyMessage: "No history yet. Viewed news and applied filters will appear here."
  },
  
  // Legal component
  legal: {
    privacyPolicy: "Privacy Policy",
    termsOfService: "Terms of Service"
  },
  
  // Privacy Policy
  privacy: {
    title: "Privacy Policy",
    sections: {
      introduction: {
        title: "1. Introduction",
        description: "This privacy policy describes how we collect, use and protect your personal data when using the European News Aggregator application."
      },
      dataCollection: {
        title: "2. Data Collection",
        description: "We collect the following data:",
        types: {
          usage: {
            title: "Usage Data:",
            description: "Which news you read, which sources you choose"
          },
          technical: {
            title: "Technical Data:",
            description: "Browser type, IP address, device information"
          },
          preferences: {
            title: "Preferences:",
            description: "Language settings, topic selections"
          }
        }
      },
      googleAdsense: {
        title: "3. Google AdSense",
        ads: {
          title: "Advertisements:",
          description: "The application uses Google AdSense advertisements. Google and its partners may use cookies and similar technologies to display personalized ads."
        },
        dataSharing: {
          title: "Data Sharing:",
          description: "Due to the use of Google AdSense, certain data may be shared with Google for ad personalization."
        }
      },
      cookies: {
        title: "4. Cookies and Similar Technologies",
        description: "The application uses cookies and similar technologies to improve user experience:",
        types: {
          necessary: {
            title: "Necessary Cookies:",
            description: "Required for the application to function"
          },
          analytics: {
            title: "Analytics Cookies:",
            description: "For creating usage statistics"
          },
          advertising: {
            title: "Advertising Cookies:",
            description: "Used by Google AdSense"
          }
        }
      },
      dataRetention: {
        title: "5. Data Retention",
        description: "We retain your data only as long as necessary for the application to function or until you request deletion."
      },
      rights: {
        title: "6. Your Rights",
        description: "You have the right to:",
        list: {
          access: "Access your data",
          rectification: "Request data correction",
          erasure: "Request data deletion",
          restriction: "Restrict data processing",
          portability: "Data portability"
        }
      },
      contact: {
        title: "7. Contact",
        description: "If you have questions about this privacy policy, please contact us:",
        email: {
          label: "Email:",
          address: "privacy@europeannewsaggregator.com"
        },
        lastUpdated: "Last updated:"
      }
    }
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

  locationModal: {
    title: "Location data needed for local news",
    description: "We need your location data to personalize local news content.",
    currentLocation: "Currently set location",
    optionsInfo: "You can choose from the following options:",
    option1: "Manual country selection",
    option2: "GPS-based precise location",
    option3: "Browser language-based detection",
    dontShowAgain: "Don't show this message again",
    continueButton: "Continue with current settings",
    setupButton: "Configure location data",
  },

  // Terms of Service
  terms: {
    title: "Terms of Service",
    sections: {
      general: {
        title: "1. General Terms",
        description: "By using the European News Aggregator application, you accept these terms of service. The application is free to use, but certain restrictions apply."
      },
      serviceDescription: {
        title: "2. Service Description",
        description: "The application provides the following services:",
        services: {
          newsAggregation: {
            title: "News Collection:",
            description: "Aggregating European news from various sources"
          },
          categorization: {
            title: "Categorization:",
            description: "Organizing news by countries and topics"
          },
          search: {
            title: "Search:",
            description: "Special search functions"
          },
          video: {
            title: "Video Content:",
            description: "Displaying video news"
          }
        }
      },
      userResponsibility: {
        title: "3. User Responsibility",
        description: "You are responsible for:",
        responsibilities: {
          legalUse: "Legal use of the application",
          accountSecurity: "Security of account data",
          contentEvaluation: "Proper evaluation of content",
          noMisinformation: "Not spreading false information"
        }
      },
      advertising: {
        title: "4. Advertisements and Third-Party Services",
        adsense: {
          title: "Google AdSense:",
          description: "The application contains Google AdSense advertisements. The content of advertisements does not come from us, and we are not responsible for it."
        },
        thirdPartyLinks: {
          title: "Third-party links:",
          description: "The application contains links to external websites. We are not responsible for their content."
        }
      },
      intellectualProperty: {
        title: "5. Intellectual Property",
        description: "The application and its content (except news from external sources) are our intellectual property. Copying and distributing content without permission is prohibited."
      },
      serviceModification: {
        title: "6. Service Modification",
        description: "We reserve the right to modify or discontinue the service at any time. We will notify users in advance of significant changes."
      },
      limitationOfLiability: {
        title: "7. Limitation of Liability",
        description: "The application is provided \"as is\". We do not assume responsibility for:",
        limitations: {
          newsAccuracy: "Accuracy of news",
          serviceInterruption: "Service interruptions",
          dataLoss: "Data loss",
          indirectDamages: "Indirect damages"
        }
      },
      disputes: {
        title: "8. Legal Disputes",
        description: "Disputes related to these terms shall be resolved before Hungarian courts. Hungarian law applies."
      },
      contact: {
        title: "9. Contact",
        description: "If you have questions about the terms of service:",
        email: {
          label: "Email:",
          address: "legal@europeannewsaggregator.com"
        },
        lastUpdated: "Last updated:"
      }
    }
  },

  // Recovery Panel
  recovery: {
    title: "Restore license key with recovery code",
    recoveryCodeLabel: "Recovery code:",
    placeholder: "e.g. ABCD-1234-EFGH-5678",
    restoreButton: "Restore",
    restoring: "Restoring...",
    success: {
      title: "Success!",
      message: "The restored license key:"
    },
    error: {
      title: "Error:",
      unknown: "Unknown error occurred.",
      network: "Network error or server error."
    }
  },

  // Premium Panel
  premium: {
    title: "Premium Features",
    system: "Premium System",
    checkingStatus: "Checking premium status...",
    licenseKeyLabel: "License key:",
    placeholder: "e.g. PRO-YYYYMM-XXXXXXXXXXXXXXXX",
    buttons: {
      save: "Save",
      validating: "Validating...",
      clear: "Clear",
      export: "Export Data",
      import: "Import Data"
    },
    status: {
      label: "Status:",
      pro: "✔️ Premium activated",
      invalidKey: "❌ Invalid license key",
      expired: "⚠️ Your license key has expired!",
      free: "◌ Free version"
    },
    validUntil: "Valid until:",
    errors: {
      invalidKey: "The provided key is invalid. Please check your key!",
      expired: "⚠️ Your license key has expired. Please purchase a new key for premium features!",
      exportFailed: "An error occurred while exporting data.",
      readFileFailed: "Error: Failed to read the file.",
      importFailed: "Import error. The file is probably corrupted or in an incorrect format."
    },
    benefits: {
      title: "Premium benefits",
      adFree: "Ad-free experience",
      offline: "Offline reading",
      personalized: "Personalized recommendations",
      earlyAccess: "Early access to new features"
    },
    dataSettings: {
      title: "Data & Settings",
      description: "Save all your settings and license key to a file, or restore from a previous backup.",
      importSuccess: "Data imported successfully! You may want to refresh the page to see the changes."
    }
  },

  // Saved News
  savedNews: {
    loading: "Loading...",
    emptyState: {
      noSaved: "You don't have any saved news yet",
      instruction: "Save your favorite articles using the three dots (⋮) menu and selecting \"⭐ Save\" option."
    },
    savedLabel: "Saved:",
    removeButton: "Remove from saved",
    removeIcon: "🗑️",
    removeMenuText: "🗑️ Remove from saved"
  },

  // Appearance Settings
  appearanceSettings: {
    title: "Appearance Settings",
    theme: {
      label: "Theme:",
      light: "☀️ Light",
      dark: "🌙 Dark",
      proBlue: "🟦 Pro Blue"
    },
    fontSize: {
      label: "Font Size:",
      small: "Small",
      medium: "Medium",
      large: "Large"
    },
    scrollbars: {
      label: "Show Scrollbars:"
    },
    themeDescriptions: {
      light: "☀️ Light: Classic light theme",
      dark: "🌙 Dark: Original dark mode",
      proBlue: "🟦 Pro Blue: Modern blue theme"
    }
  },

  // Time Settings
  timeSettings: {
    title: "Maximum News Age",
    description: "Set how old news should be displayed. Older news will be automatically filtered out.",
    customDuration: "Custom Duration",
    hoursUnit: "hours",
    apply: "Apply",
    placeholder: "Number of hours",
    currentSetting: "Current setting:",
    oneDay: "(1 day)",
    errors: {
      saveError: "Error saving time settings:",
      loadError: "Error loading time settings:",
      loadingErrorMessage: "Error occurred while loading settings",
      savingErrorMessage: "Error occurred while saving settings",
      rangeError: "Time value must be between 1 and 24 hours",
      wholeNumberError: "Time value must be a whole number",
      maxHoursWarning: "Maximum 24 hours can be set",
      maxHoursError: "Maximum 24 hours allowed"
    }
  },

  // Content Settings
  contentSettings: {
    title: "Content Settings",
    displayMode: {
      label: "Display mode:",
      grid: "Grid view",
      list: "List view",
      compact: "Compact view"
    },
    sortBy: {
      label: "Sort news by:",
      newest: "Newest first",
      popular: "Most popular",
      relevance: "By relevance"
    },
    newsCount: {
      label: "News count per page:",
      custom: "Custom",
      customPlaceholder: "Enter a value (5-2000)...",
      customHint: "Custom setting",
      apply: "Apply",
      hint: "This setting determines how many news items appear on one page. Lower values load faster, higher values require less page navigation.",
      performanceWarning: {
        title: "Loading a large number of news items",
        message: "Setting a news limit above 500 may cause performance issues, especially on slower devices or with a weak internet connection."
      }
    },
    previews: {
      label: "Show article previews",
      hint: "When enabled, shows images and descriptions in the news list. Turn off for a more compact view."
    },
    featuredBar: {
      label: "Featured news bar at top of panels",
      hint: "When enabled, a horizontally scrollable bar appears with the first few image-free news items at the top of panels. (Primarily optimized for mobile/tablet view)"
    },
    noImageLayout: {
      label: "Layout for news without images:",
      card: "Card format",
      horizontal: "Horizontal scroll",
      hint: "Select how news without images should be displayed."
    },
    newsPerContainer: {
      label: "News per container:",
      hint: "Only active when horizontal scroll is selected. Determines how many news items appear in a row."
    },
    validation: {
      positiveNumber: "Value must be a positive number",
      minimum: "Value must be at least 5",
      maximum: "Value must be at most 2000",
      invalidCustom: "Invalid custom value"
    }
  },

  // Article View Settings
  articleViewSettings: {
    title: "Article Display Mode",
    description: "Choose how you want to display articles when clicking on news cards.",
    loading: "Loading settings...",
    saving: "Saving...",
    viewModes: {
      embedded: {
        label: "Embedded View",
        description: "The article appears in place of the news cards",
        icon: "📰"
      },
      tab: {
        label: "New Tab", 
        description: "The article opens in a new tab within the application",
        icon: "🗂️"
      },
      window: {
        label: "Separate Window",
        description: "The article opens in a new Electron window",
        icon: "🪟"
      }
    },
    recommended: "Recommended",
    messages: {
      saveSuccess: "Settings saved successfully!",
      saveError: "Error saving settings!",
      loadError: "Error loading settings:"
    }
  },

  // Electron Settings
  electronSettings: {
    notice: {
      title: "Desktop Application Settings",
      description: "These settings are only available in the desktop application and may not work in web browsers.",
      icon: "⚡"
    }
  },

  // Window Settings
  windowSettings: {
    title: "Window Style",
    description: "Choose the appearance of article windows",
    loading: "Loading...",
    styles: {
      classic: {
        label: "Classic",
        description: "Traditional window with frame and title bar",
        icon: "🪟"
      },
      modern: {
        label: "Modern",
        description: "Clean design with native close button",
        icon: "✨"
      },
      dark: {
        label: "Dark Theme",
        description: "Dark background with light frame",
        icon: "🌙"
      },
      compact: {
        label: "Compact",
        description: "Smaller window with simple design",
        icon: "📱"
      }
    },
    errors: {
      loadError: "Error loading window style:",
      saveError: "Error saving window style:"
    }
  },

  // Location Settings
  locationSettings: {
    title: "Location Settings",
    locationMethod: {
      title: "Location Method",
      manual: "Manual Selection",
      gps: "GPS Based Location", 
      browser: "Browser Language"
    },
    continentSelector: {
      title: "Select Continent",
      placeholder: "Select continent"
    },
    countrySelector: {
      title: "Select Country",
      placeholder: "Select country"
    },
    citySelector: {
      title: "Enter City (optional)",
      placeholder: "E.g. Budapest"
    },
    gpsSettings: {
      title: "GPS Settings",
      highAccuracy: "High accuracy location:",
      note: "Note: You need to enable location access in your browser for precise location detection."
    },
    dataStorage: {
      title: "Location Data Storage",
      rememberData: "Remember location data after browser close:"
    },
    previousLocations: {
      title: "Previous Locations",
      useButton: "Use",
      clearHistory: "Clear History"
    },
    actions: {
      save: "Save Settings",
      saving: "Saving...",
      success: "Settings saved!",
      error: "Error saving settings!"
    },
    alerts: {
      selectCountry: "Please select a country!",
      unknownCountry: "Unknown country code",
      failedSetLocation: "Failed to set location",
      failedGPS: "Failed to set GPS location",
      failedBrowser: "Failed to set browser language based location"
    }
  },

  // Country Filter
  countryFilter: {
    placeholder: {
      loading: "Loading countries...",
      select: "Select one or more countries..."
    },
    noOptions: {
      loading: "Loading...",
      empty: "No countries available"
    }
  },
};

export default en;