export interface AdminContent {
  panel: {
    title: string
    logout: string
  }
  nav: {
    posts: string
    settings: string
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
  editor: {
    newPostHeading: string
    editPostHeading: string
    titleLabel: string
    slugLabel: string
    excerptLabel: string
    contentLabel: string
    markdownPlaceholder: string
    publishedLabel: string
    save: string
    saving: string
    cancel: string
    loadError: string
    saveError: string
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
  }
  common: {
    loading: string
  }
}
