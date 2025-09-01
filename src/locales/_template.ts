import { LocaleResource } from './types';

// Másold át ezt a fájlt új nyelvhez (pl. de.ts, es.ts) és töltsd ki a szövegeket.
const template: LocaleResource = {
  card: {
    searchResult: '',
    status: {
      scraped: '',
      invalid: '',
      unavailable: '',
    },
    rss: '',
    showSourceNews: '',
  },
  country: {
    // "Afghanistan": "",
  },
  continent: {
    title: '',
    africa: '',
    asia: '',
    oceania: '',
    europe: '',
    northamerica: '',
    southamerica: '',
  },
  "country.title": '',
  sideHeader: {
    filter: '',
    filterTitle: '',
    local: '',
    newNews: '',
    newNewsTitle: '',
  },
  contentType: {
    title: '',
    text: '',
    video: '',
    both: '',
    textTitle: '',
    videoTitle: '',
    bothTitle: '',
  },
  searchMode: {
    title: '',
    country: '',
    source: '',
    channel: '',
    countryTitle: '',
    sourceTitle: '',
    channelTitle: '',
  },
  settings: {
    languageTitle: '',
    selectLanguage: '',
    languageInfo: '',
  },
  startPage: {
    welcomeTitle: '',
    welcomeText: '',
    mainFeatures: '',
    localNews: { title: '', desc: '' },
    continent: { title: '', desc: '' },
    search: { title: '', desc: '' },
    hideButton: '',
  },
};

export default template;



