export const localesMap = [
  // 东亚语言
  { code: 'zh-CN', alias: ['zh_CN', 'zh', 'zh-Hans', 'zh_Hans', 'zho'], flag: '🇨🇳', name: '中文(简体)' },
  { code: 'zh-HK', alias: ['zh_HK', 'zh_HK-Hant', 'zh-HK-Hant'], flag: '🇭🇰', name: '中文(香港)' },
  { code: 'zh-TW', alias: ['zh_TW', 'zh_TW-Hant', 'zh-TW-Hant'], flag: '🇹🇼', name: '中文(台湾)' },
  { code: 'ja-JP', alias: ['ja', 'ja_JP', 'jpn'], flag: '🇯🇵', name: '日语' },
  { code: 'ko-KR', alias: ['ko', 'ko_KR', 'kor'], flag: '🇰🇷', name: '韩语' },

  // 英语变体
  { code: 'en-US', alias: ['en', 'en_US', 'eng'], flag: '🇺🇸', name: '英语(美国)' },
  { code: 'en-GB', alias: ['en_GB'], flag: '🇬🇧', name: '英语(英国)' },
  { code: 'en-AU', alias: ['en_AU'], flag: '🇦🇺', name: '英语(澳大利亚)' },
  { code: 'en-CA', alias: ['en_CA'], flag: '🇨🇦', name: '英语(加拿大)' },

  // 欧洲语言
  { code: 'fr-FR', alias: ['fr', 'fr_FR', 'fra'], flag: '🇫🇷', name: '法语' },
  { code: 'de-DE', alias: ['de', 'de_DE', 'deu'], flag: '🇩🇪', name: '德语' },
  { code: 'es-ES', alias: ['es', 'es_ES', 'spa'], flag: '🇪🇸', name: '西班牙语' },
  { code: 'it-IT', alias: ['it', 'it_IT', 'ita'], flag: '🇮🇹', name: '意大利语' },
  { code: 'pt-PT', alias: ['pt', 'pt_PT', 'por'], flag: '🇵🇹', name: '葡萄牙语' },
  { code: 'pt-BR', alias: ['pt_BR'], flag: '🇧🇷', name: '葡萄牙语(巴西)' },
  { code: 'ru-RU', alias: ['ru', 'ru_RU', 'rus'], flag: '🇷🇺', name: '俄语' },
  { code: 'nl-NL', alias: ['nl', 'nl_NL', 'nld'], flag: '🇳🇱', name: '荷兰语' },
  { code: 'sv-SE', alias: ['sv', 'sv_SE', 'swe'], flag: '🇸🇪', name: '瑞典语' },
  { code: 'pl-PL', alias: ['pl', 'pl_PL', 'pol'], flag: '🇵🇱', name: '波兰语' },
  { code: 'tr-TR', alias: ['tr', 'tr_TR', 'tur'], flag: '🇹🇷', name: '土耳其语' },

  // 其他主要语言
  { code: 'ar-SA', alias: ['ar', 'ar_SA', 'ara'], flag: '🇸🇦', name: '阿拉伯语' },
  { code: 'hi-IN', alias: ['hi', 'hi_IN', 'hin'], flag: '🇮🇳', name: '印地语' },
  { code: 'th-TH', alias: ['th', 'th_TH', 'tha'], flag: '🇹🇭', name: '泰语' },
  { code: 'vi-VN', alias: ['vi', 'vi_VN', 'vie'], flag: '🇻🇳', name: '越南语' },
  { code: 'id-ID', alias: ['id', 'id_ID', 'ind'], flag: '🇮🇩', name: '印尼语' },
  { code: 'ms-MY', alias: ['ms', 'ms_MY', 'msa'], flag: '🇲🇾', name: '马来语' },
  { code: 'km-KH', alias: ['km', 'km_KH', 'khm'], flag: '🇰🇭', name: '高棉语' },

  // 北欧语言
  { code: 'fi-FI', alias: ['fi', 'fi_FI', 'fin'], flag: '🇫🇮', name: '芬兰语' },
  { code: 'da-DK', alias: ['da', 'da_DK', 'dan'], flag: '🇩🇰', name: '丹麦语' },
  { code: 'nb-NO', alias: ['nb', 'nb_NO', 'no', 'no-NO', 'no_NO', 'nor'], flag: '🇳🇴', name: '挪威语' },

  // 东欧语言
  { code: 'cs-CZ', alias: ['cs', 'cs_CZ', 'ces'], flag: '🇨🇿', name: '捷克语' },
  { code: 'hu-HU', alias: ['hu', 'hu_HU', 'hun'], flag: '🇭🇺', name: '匈牙利语' },
  { code: 'ro-RO', alias: ['ro', 'ro_RO', 'ron'], flag: '🇷🇴', name: '罗马尼亚语' },
  { code: 'uk-UA', alias: ['uk', 'uk_UA', 'ukr'], flag: '🇺🇦', name: '乌克兰语' },

  // 其他欧洲语言
  { code: 'el-GR', alias: ['el', 'el_GR', 'ell'], flag: '🇬🇷', name: '希腊语' },
  { code: 'bg-BG', alias: ['bg', 'bg_BG', 'bul'], flag: '🇧🇬', name: '保加利亚语' },

  // 中东和中亚语言
  { code: 'he-IL', alias: ['he', 'he_IL', 'iw', 'iw-IL', 'iw_IL', 'heb'], flag: '🇮🇱', name: '希伯来语' },
  { code: 'fa-IR', alias: ['fa', 'fa_IR', 'fas'], flag: '🇮🇷', name: '波斯语' },

  // 南亚语言
  { code: 'bn-BD', alias: ['bn', 'bn_BD', 'bn-IN', 'bn_IN', 'ben'], flag: '🇧🇩', name: '孟加拉语' },
  { code: 'ta-IN', alias: ['ta', 'ta_IN', 'tam'], flag: '🇮🇳', name: '泰米尔语' },
  { code: 'ur-PK', alias: ['ur', 'ur_PK', 'urd'], flag: '🇵🇰', name: '乌尔都语' },
]
