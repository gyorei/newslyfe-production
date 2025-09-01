export type TranslationMap = {
  card: {
    searchResult: string;
    status: {
      scraped: string;
      invalid: string;
      unavailable: string;
    };
    rss: string;
    showSourceNews?: string;
  };
  country?: Record<string, string>;
  continent?: {
    title: string;
    africa: string;
    asia: string;
    oceania: string;
    europe: string;
    northamerica: string;
    southamerica: string;
  };
  "country.title"?: string;
  sideHeader: {
    filter: string;
    filterTitle: string;
    local: string;
    newNews: string;
    newNewsTitle: string;
  };
  contentType: {
    title: string;
    text: string;
    video: string;
    both: string;
    textTitle: string;
    videoTitle: string;
    bothTitle: string;
  };
  searchMode: {
    title: string;
    country: string;
    source: string;
    channel: string;
    countryTitle: string;
    sourceTitle: string;
    channelTitle: string;
  };
  settings?: {
    languageTitle: string;
    selectLanguage: string;
    languageInfo: string;
  };
  startPage?: {
    welcomeTitle: string;
    welcomeText: string;
    mainFeatures: string;
    localNews: { title: string; desc: string };
    continent: { title: string; desc: string };
    search: { title: string; desc: string };
    hideButton: string;
  };
  alert?: {
    close: string;
    type: {
      success: string;
      error: string;
      warning: string;
      info: string;
    };
    message?: {
      saved?: string;
      deleted?: string;
      updated?: string;
      errorGeneric?: string;
    };
  };
};

export type LocaleResource = TranslationMap;


