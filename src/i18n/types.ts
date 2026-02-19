export type Locale = 'tr' | 'en' | 'es' | 'fr' | 'de' | 'ar' | 'it' | 'pt' | 'ru' | 'zh'

export type Dict = {
  app: {
    name: string
    tagline: string
  }
  nav: {
    language: string
    theme: string
    github: string
    studio: string
    login: string
    logout: string
    account: string
    plan: string
  }
  sidebar: {
    projects: string
    newProject: string
    rename: string
    delete: string
    sync: string
    synced: string
    notSynced: string
  }
  editor: {
    placeholder: string
    focus: string
    exitFocus: string
    wordCount: string
    conceptCount: string
    density: string
    analyze: string
    analyzing: string
    autosaved: string
    importTxt: string
    demoText: string
    studio: string
  }
  results: {
    tabs: {
      summary: string
      keywords: string
      graph: string
      report: string
      insights: string
    }
    empty: string
  }
  auth: {
    title: string
    signin: string
    signup: string
    forgot: string
    email: string
    password: string
    password2: string
    continue: string
    create: string
    reset: string
    back: string
    hint: string
  }
  billing: {
    title: string
    subtitle: string
    free: string
    plus: string
    ultra: string
    perMonth: string
    comingSoon: string
    current: string
    choose: string
    features: {
      unlimited: string
      export: string
      advancedInsights: string
      graphExport: string
      cloudSync: string
    }
  }
  common: {
    close: string
    cancel: string
    save: string
    ok: string
    error: string
  }
  onboarding: {
    title: string
    subtitle: string
    privacyTitle: string
    privacyBody: string
    analysisTitle: string
    analysisBody: string
    toolsTitle: string
    toolsBody: string
    start: string
    loadDemoTR: string
    loadDemoEN: string
  }
}
