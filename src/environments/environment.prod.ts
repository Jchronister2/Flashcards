export const environment = {
    production: true,
    googleClientId: window.flashcardsConfig?.googleClientId?.trim() ?? '',
    googleScopes: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile'
};
