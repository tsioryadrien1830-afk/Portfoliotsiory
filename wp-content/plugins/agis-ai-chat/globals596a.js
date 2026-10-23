serverUrl = 'https://jason5-dev.agis.ai:6081/'
iconUrl = 'https://jason5-dev.agis.ai/'
isWordpress = 1
// Plugin assets URL (set via wp_localize_script; fallback when not in WordPress)
if (typeof agisConfig === 'undefined') { agisConfig = {}; }
assetsUrl = (agisConfig.assetsUrl) ? agisConfig.assetsUrl.replace(/\/?$/, '/') : (iconUrl + '/admin/')
console.log('AI Chat By AGIS - Globals Loaded');
