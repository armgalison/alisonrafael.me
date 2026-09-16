export interface AdminContent {
  panel: {
    title: string
    logout: string
  }
  nav: {
    posts: string
    comments: string
    settings: string
    tools: string
  }
  login: {
    title: string
    subtitle: string
    emailLabel: string
    passwordLabel: string
    submit: string
    submitting: string
    invalidCredentials: string
    genericError: string
  }
  postList: {
    heading: string
    newPost: string
    loadError: string
    loading: string
    empty: string
    published: string
    draft: string
    updatedAtPrefix: string
    edit: string
    delete: string
    deleteConfirm: (title: string) => string
  }
  trends: {
    heading: string
    subtitle: string
    backToTools: string
    lastSearchedPrefix: string
    noSearchYet: string
    searchNow: string
    newSearch: string
    discovering: string
    liveOutputHeading: string
    discoverError: string
    empty: string
    relevancePrefix: string
    selectedCount: (count: number) => string
    createPosts: string
    creating: string
    created: string
    failed: string
    viewPost: string
  }
  editor: {
    newPostHeading: string
    editPostHeading: string
    titleLabel: string
    slugLabel: string
    excerptLabel: string
    contentLabel: string
    markdownPlaceholder: string
    coverImageLabel: string
    coverImageUpload: string
    coverImageReplace: string
    coverImageRemove: string
    coverImageUploading: string
    coverImageError: string
    publishedLabel: string
    save: string
    saving: string
    cancel: string
    loadError: string
    saveError: string
  }
  comments: {
    heading: string
    subtitle: string
    filterAll: string
    filterPending: string
    filterApproved: string
    filterRejected: string
    loading: string
    loadError: string
    empty: string
    emptyPending: string
    emailNote: string
    replyTag: string
    onPostPrefix: string
    approve: string
    unapprove: string
    reject: string
    delete: string
    deleteConfirm: (name: string) => string
    actionError: string
  }
  settings: {
    heading: string
    subtitle: string
    currentPasswordLabel: string
    newPasswordLabel: string
    incorrectPassword: string
    changeError: string
    success: string
    submit: string
    submitting: string
    resumeProfileHeading: string
    resumeProfileSubtitle: string
    resumeProfileLoading: string
    resumeProfileLoadError: string
    resumeProfileInvalidJson: string
    resumeProfileSaveError: string
    resumeProfileSuccess: string
    resumeProfileSave: string
    resumeProfileSaving: string
  }
  tools: {
    heading: string
    subtitle: string
    coverLetterName: string
    coverLetterDescription: string
    trendsName: string
    trendsDescription: string
    atsResumeName: string
    atsResumeDescription: string
  }
  toolsCoverLetter: {
    heading: string
    subtitle: string
    backToTools: string
    jobDescriptionLabel: string
    jobDescriptionPlaceholder: string
    generate: string
    generating: string
    generateError: string
    resultHeading: string
    copy: string
    copied: string
    downloadPdf: string
    empty: string
  }
  toolsAtsResume: {
    heading: string
    subtitle: string
    backToTools: string
    jobDescriptionLabel: string
    jobDescriptionPlaceholder: string
    generate: string
    generating: string
    regenerate: string
    generateError: string
    contentLabel: string
    approve: string
    approving: string
    approveError: string
    approvedPrefix: string
    viewLive: string
    empty: string
  }
  common: {
    loading: string
  }
}
