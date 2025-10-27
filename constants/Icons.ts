// Centralized registry of local icon assets
// Export both a keyed map and a flat array for preloading

export const ICONS = {
  // PNG icons
  icon: require('@/assets/icons/icon.png'),
  cameraPng: require('@/assets/icons/camera_p.png'),
  planning: require('@/assets/icons/planning.png'),
  calendar: require('@/assets/icons/calendar.png'),
  manifolder: require('@/assets/icons/manifolder.png'),
  declaration: require('@/assets/icons/declaration_anomalie.png'),
  auditZone: require('@/assets/icons/audit_zone.png'),
  prelevementEchantillon: require('@/assets/icons/prelevement_echantillon.png'),
  inventaireArticle: require('@/assets/icons/inventaire_article.png'),
  reception: require('@/assets/icons/reception.png'),
  actionCorrective: require('@/assets/icons/action_corrective.png'),
  map: require('@/assets/icons/map.png'),
  pdf: require('@/assets/icons/pdf.png'),
  // GIF icons
  cameraGif: require('@/assets/icons/camera.gif'),
  constructionGif: require('@/assets/icons/construction.gif'),
  signature: require('@/assets/icons/sign.png'),
  chatgpt: require('@/assets/icons/chatgpt.png'),
  folder: require('@/assets/icons/folder.png'),
} as const;

export const ICONS_ASSETS = Object.values(ICONS);


