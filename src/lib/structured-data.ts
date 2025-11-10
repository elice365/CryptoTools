import type { Locale } from "@/i18n";
import type { ToolId } from "./tool-config";
import { getSiteUrl } from "./seo";

/**
 * Generate JSON-LD structured data for the website
 */
export function generateWebAppStructuredData(locale: Locale) {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "CryptoTools",
    applicationCategory: "SecurityApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    url: `${siteUrl}/${locale}`,
    description: getLocalizedDescription(locale),
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "127",
    },
    inLanguage: getLanguageCode(locale),
    author: {
      "@type": "Organization",
      name: "CryptoTools",
      url: siteUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "CryptoTools",
      url: siteUrl,
    },
  };
}

/**
 * Generate Organization structured data
 */
export function generateOrganizationStructuredData() {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "CryptoTools",
    url: siteUrl,
    logo: `${siteUrl}/opengraph-image`,
    description: "Professional browser-based cryptographic toolkit with 18+ encryption tools including quantum-safe algorithms",
    sameAs: [
      `${siteUrl}/ko`,
      `${siteUrl}/en`,
      `${siteUrl}/ja`,
      `${siteUrl}/zh`,
      `${siteUrl}/ru`,
      `${siteUrl}/id`,
    ],
  };
}

/**
 * Generate Website structured data
 */
export function generateWebsiteStructuredData(locale: Locale) {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "CryptoTools",
    url: `${siteUrl}/${locale}`,
    description: getLocalizedDescription(locale),
    inLanguage: getLanguageCode(locale),
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/${locale}?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Generate BreadcrumbList structured data for navigation
 */
export function generateBreadcrumbStructuredData(locale: Locale, toolId?: ToolId, toolTitle?: string) {
  const siteUrl = getSiteUrl();
  const homeText = locale === 'ko' ? '홈' : locale === 'ja' ? 'ホーム' : locale === 'zh' ? '首页' : locale === 'ru' ? 'Главная' : locale === 'id' ? 'Beranda' : 'Home';

  const items = [
    {
      "@type": "ListItem",
      position: 1,
      name: homeText,
      item: `${siteUrl}/${locale}`,
    },
  ];

  if (toolId && toolTitle) {
    items.push({
      "@type": "ListItem",
      position: 2,
      name: toolTitle,
      item: `${siteUrl}/${locale}/${toolId}`,
    });
  }

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  };
}

/**
 * Generate FAQ structured data for common questions
 */
export function generateFAQStructuredData(locale: Locale) {
  const faqs: Record<Locale, Array<{ question: string; answer: string }>> = {
    ko: [
      {
        question: "CryptoTools는 안전한가요?",
        answer: "네, CryptoTools는 100% 브라우저 기반으로 동작하며 모든 암호화 작업이 사용자의 컴퓨터에서만 이루어집니다. 데이터는 서버로 전송되지 않습니다.",
      },
      {
        question: "어떤 암호화 알고리즘을 지원하나요?",
        answer: "AES, RSA, ECC, Kyber, Dilithium 등 18가지 이상의 암호화 알고리즘을 지원합니다. 양자 내성 암호화(PQC)도 포함되어 있습니다.",
      },
      {
        question: "무료로 사용할 수 있나요?",
        answer: "네, CryptoTools의 모든 기능은 완전히 무료로 제공됩니다. 가입이나 설치 없이 바로 사용할 수 있습니다.",
      },
      {
        question: "어떤 파일 형식을 지원하나요?",
        answer: "텍스트, 이미지, 문서 등 모든 파일 형식을 암호화할 수 있습니다. 파일 크기 제한 없이 브라우저에서 직접 처리됩니다.",
      },
    ],
    en: [
      {
        question: "Is CryptoTools secure?",
        answer: "Yes, CryptoTools is 100% browser-based and all encryption operations are performed only on your computer. No data is sent to any server.",
      },
      {
        question: "What encryption algorithms are supported?",
        answer: "We support 18+ encryption algorithms including AES, RSA, ECC, Kyber, Dilithium, and post-quantum cryptography (PQC).",
      },
      {
        question: "Is it free to use?",
        answer: "Yes, all features of CryptoTools are completely free. You can use it immediately without registration or installation.",
      },
      {
        question: "What file formats are supported?",
        answer: "You can encrypt all file formats including text, images, and documents. Files are processed directly in the browser without size limitations.",
      },
    ],
    ja: [
      {
        question: "CryptoToolsは安全ですか？",
        answer: "はい、CryptoToolsは100%ブラウザベースで動作し、すべての暗号化操作はユーザーのコンピュータ上でのみ実行されます。データはサーバーに送信されません。",
      },
      {
        question: "どの暗号化アルゴリズムをサポートしていますか？",
        answer: "AES、RSA、ECC、Kyber、Dilithiumなど18種類以上の暗号化アルゴリズムをサポートしています。耐量子暗号(PQC)も含まれています。",
      },
      {
        question: "無料で使用できますか？",
        answer: "はい、CryptoToolsのすべての機能は完全に無料で提供されています。登録やインストールなしで今すぐ使用できます。",
      },
      {
        question: "どのファイル形式をサポートしていますか？",
        answer: "テキスト、画像、文書など、すべてのファイル形式を暗号化できます。ファイルサイズの制限なくブラウザで直接処理されます。",
      },
    ],
    zh: [
      {
        question: "CryptoTools安全吗？",
        answer: "是的，CryptoTools是100%基于浏览器的，所有加密操作仅在您的计算机上执行。数据不会发送到任何服务器。",
      },
      {
        question: "支持哪些加密算法？",
        answer: "我们支持18种以上的加密算法，包括AES、RSA、ECC、Kyber、Dilithium和后量子密码学(PQC)。",
      },
      {
        question: "可以免费使用吗？",
        answer: "是的，CryptoTools的所有功能完全免费。无需注册或安装即可立即使用。",
      },
      {
        question: "支持哪些文件格式？",
        answer: "您可以加密包括文本、图像和文档在内的所有文件格式。文件直接在浏览器中处理，没有大小限制。",
      },
    ],
    ru: [
      {
        question: "Безопасен ли CryptoTools?",
        answer: "Да, CryptoTools работает на 100% в браузере, и все операции шифрования выполняются только на вашем компьютере. Данные не отправляются на сервер.",
      },
      {
        question: "Какие алгоритмы шифрования поддерживаются?",
        answer: "Мы поддерживаем более 18 алгоритмов шифрования, включая AES, RSA, ECC, Kyber, Dilithium и постквантовую криптографию (PQC).",
      },
      {
        question: "Это бесплатно?",
        answer: "Да, все функции CryptoTools полностью бесплатны. Вы можете использовать их сразу без регистрации или установки.",
      },
      {
        question: "Какие форматы файлов поддерживаются?",
        answer: "Вы можете зашифровать все форматы файлов, включая текст, изображения и документы. Файлы обрабатываются непосредственно в браузере без ограничений по размеру.",
      },
    ],
    id: [
      {
        question: "Apakah CryptoTools aman?",
        answer: "Ya, CryptoTools 100% berbasis browser dan semua operasi enkripsi hanya dilakukan di komputer Anda. Data tidak dikirim ke server manapun.",
      },
      {
        question: "Algoritma enkripsi apa yang didukung?",
        answer: "Kami mendukung 18+ algoritma enkripsi termasuk AES, RSA, ECC, Kyber, Dilithium, dan kriptografi pasca-kuantum (PQC).",
      },
      {
        question: "Apakah gratis untuk digunakan?",
        answer: "Ya, semua fitur CryptoTools sepenuhnya gratis. Anda dapat menggunakannya langsung tanpa registrasi atau instalasi.",
      },
      {
        question: "Format file apa yang didukung?",
        answer: "Anda dapat mengenkripsi semua format file termasuk teks, gambar, dan dokumen. File diproses langsung di browser tanpa batasan ukuran.",
      },
    ],
  };

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs[locale].map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate JSON-LD structured data for a specific tool
 */
export function generateToolStructuredData(
  toolId: ToolId,
  locale: Locale,
  title: string,
  description: string
) {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: title,
    applicationCategory: "SecurityApplication",
    applicationSubCategory: getToolCategory(toolId),
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    url: `${siteUrl}/${locale}/${toolId}`,
    description,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: getToolFeatures(toolId, locale),
    softwareVersion: "1.0",
    inLanguage: getLanguageCode(locale),
    screenshot: `${siteUrl}/opengraph-image`,
  };
}

/**
 * Generate JSON-LD HowTo structured data for tools
 */
export function generateHowToStructuredData(
  toolId: ToolId,
  locale: Locale,
  title: string
) {
  const siteUrl = getSiteUrl();
  const steps = getToolHowToSteps(toolId, locale);

  if (!steps) return null;

  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to use ${title}`,
    description: `Step-by-step guide to use ${title} for secure encryption`,
    step: steps,
    totalTime: "PT2M",
    url: `${siteUrl}/${locale}/${toolId}`,
    inLanguage: getLanguageCode(locale),
  };
}

/**
 * Get localized site description
 */
function getLocalizedDescription(locale: Locale): string {
  const descriptions: Record<Locale, string> = {
    ko: "브라우저에서 바로 사용할 수 있는 무료 암호화 도구 모음. AES, RSA, 해시, Base64 등 다양한 암호화 기능을 제공합니다.",
    en: "Free browser-based cryptographic tools. Provides AES, RSA, hash, Base64, and various encryption features.",
    ja: "ブラウザで直接使用できる無料の暗号化ツール集。AES、RSA、ハッシュ、Base64など様々な暗号化機能を提供します。",
    ru: "Бесплатные инструменты шифрования для браузера. Предоставляет AES, RSA, хэш, Base64 и различные функции шифрования.",
    id: "Alat enkripsi gratis berbasis browser. Menyediakan AES, RSA, hash, Base64, dan berbagai fitur enkripsi.",
    zh: "基于浏览器的免费加密工具集。提供AES、RSA、哈希、Base64等各种加密功能。",
  };

  return descriptions[locale];
}

/**
 * Get language code for Schema.org
 */
function getLanguageCode(locale: Locale): string {
  const codes: Record<Locale, string> = {
    ko: "ko-KR",
    en: "en-US",
    ja: "ja-JP",
    ru: "ru-RU",
    id: "id-ID",
    zh: "zh-CN",
  };

  return codes[locale];
}

/**
 * Get tool category for structured data
 */
function getToolCategory(toolId: ToolId): string {
  const categories: Record<ToolId, string> = {
    base64: "Encoding",
    hash: "Hashing",
    symmetric: "Encryption",
    asymmetric: "Encryption",
    encoding: "Encoding",
    files: "Encryption",
    bgv: "Advanced Encryption",
    elgamal: "Encryption",
    paillier: "Encryption",
    pqc: "Post-Quantum Cryptography",
    stream: "Encryption",
    des: "Encryption",
    tripledes: "Encryption",
    rc4: "Encryption",
    rabbit: "Encryption",
    sha3: "Hashing",
    blake2: "Hashing",
    ecies: "Encryption",
  };

  return categories[toolId];
}

/**
 * Get tool features for structured data
 */
function getToolFeatures(toolId: ToolId, locale: Locale): string[] {
  const features: Record<Locale, Record<ToolId, string[]>> = {
    ko: {
      base64: ["텍스트 인코딩", "이미지 변환", "실시간 처리"],
      hash: ["SHA-256", "SHA-512", "파일 해시"],
      symmetric: ["AES-256 암호화", "복호화", "키 생성"],
      asymmetric: ["RSA 암호화", "ECC 암호화", "키 쌍 생성"],
      encoding: ["URL 인코딩", "Hex 변환", "바이너리 변환"],
      files: ["대용량 파일", "스트리밍", "진행률 표시"],
      bgv: ["동형 암호화", "암호화된 연산", "개인정보 보호"],
      elgamal: ["공개키 암호화", "디지털 서명", "키 교환"],
      paillier: ["확률적 암호화", "덧셈 동형성", "안전한 연산"],
      pqc: ["Kyber 키 교환", "Dilithium 서명", "양자 내성"],
      stream: ["ChaCha20", "고속 암호화", "실시간 처리"],
      des: ["DES 암호화", "블록 암호", "레거시 지원"],
      tripledes: ["3중 암호화", "향상된 보안", "호환성"],
      rc4: ["스트림 암호", "빠른 처리", "경량"],
      rabbit: ["고성능", "128비트 보안", "낮은 메모리"],
      sha3: ["Keccak 해시", "SHA-3-256", "최신 표준"],
      blake2: ["빠른 해싱", "보안 해시", "효율적"],
      ecies: ["타원곡선", "통합 암호화", "효율적 키 교환"],
    },
    en: {
      base64: ["Text encoding", "Image conversion", "Real-time processing"],
      hash: ["SHA-256", "SHA-512", "File hashing"],
      symmetric: ["AES-256 encryption", "Decryption", "Key generation"],
      asymmetric: ["RSA encryption", "ECC encryption", "Key pair generation"],
      encoding: ["URL encoding", "Hex conversion", "Binary conversion"],
      files: ["Large files", "Streaming", "Progress tracking"],
      bgv: ["Homomorphic encryption", "Encrypted computation", "Privacy-preserving"],
      elgamal: ["Public key encryption", "Digital signatures", "Key exchange"],
      paillier: ["Probabilistic encryption", "Additive homomorphism", "Secure computation"],
      pqc: ["Kyber key exchange", "Dilithium signatures", "Quantum-resistant"],
      stream: ["ChaCha20", "High-speed encryption", "Real-time processing"],
      des: ["DES encryption", "Block cipher", "Legacy support"],
      tripledes: ["Triple encryption", "Enhanced security", "Compatibility"],
      rc4: ["Stream cipher", "Fast processing", "Lightweight"],
      rabbit: ["High performance", "128-bit security", "Low memory"],
      sha3: ["Keccak hash", "SHA-3-256", "Modern standard"],
      blake2: ["Fast hashing", "Secure hash", "Efficient"],
      ecies: ["Elliptic curve", "Integrated encryption", "Efficient key exchange"],
    },
    ja: {
      base64: ["テキストエンコード", "画像変換", "リアルタイム処理"],
      hash: ["SHA-256", "SHA-512", "ファイルハッシュ"],
      symmetric: ["AES-256暗号化", "復号化", "キー生成"],
      asymmetric: ["RSA暗号化", "ECC暗号化", "鍵ペア生成"],
      encoding: ["URLエンコード", "16進数変換", "バイナリ変換"],
      files: ["大容量ファイル", "ストリーミング", "進捗表示"],
      bgv: ["準同型暗号", "暗号化演算", "プライバシー保護"],
      elgamal: ["公開鍵暗号", "デジタル署名", "鍵交換"],
      paillier: ["確率的暗号", "加法準同型性", "安全な演算"],
      pqc: ["Kyber鍵交換", "Dilithium署名", "耐量子性"],
      stream: ["ChaCha20", "高速暗号化", "リアルタイム処理"],
      des: ["DES暗号化", "ブロック暗号", "レガシーサポート"],
      tripledes: ["3重暗号化", "強化セキュリティ", "互換性"],
      rc4: ["ストリーム暗号", "高速処理", "軽量"],
      rabbit: ["高性能", "128ビットセキュリティ", "低メモリ"],
      sha3: ["Keccakハッシュ", "SHA-3-256", "最新標準"],
      blake2: ["高速ハッシュ", "セキュアハッシュ", "効率的"],
      ecies: ["楕円曲線", "統合暗号化", "効率的鍵交換"],
    },
    ru: {
      base64: ["Кодирование текста", "Конвертация изображений", "Обработка в реальном времени"],
      hash: ["SHA-256", "SHA-512", "Хэширование файлов"],
      symmetric: ["Шифрование AES-256", "Расшифровка", "Генерация ключей"],
      asymmetric: ["Шифрование RSA", "Шифрование ECC", "Генерация пары ключей"],
      encoding: ["Кодирование URL", "Преобразование в Hex", "Бинарное преобразование"],
      files: ["Большие файлы", "Потоковая передача", "Отслеживание прогресса"],
      bgv: ["Гомоморфное шифрование", "Зашифрованные вычисления", "Конфиденциальность"],
      elgamal: ["Шифрование с открытым ключом", "Цифровые подписи", "Обмен ключами"],
      paillier: ["Вероятностное шифрование", "Аддитивный гомоморфизм", "Безопасные вычисления"],
      pqc: ["Обмен ключами Kyber", "Подписи Dilithium", "Квантовая устойчивость"],
      stream: ["ChaCha20", "Высокоскоростное шифрование", "Обработка в реальном времени"],
      des: ["Шифрование DES", "Блочный шифр", "Поддержка устаревших"],
      tripledes: ["Тройное шифрование", "Усиленная безопасность", "Совместимость"],
      rc4: ["Потоковый шифр", "Быстрая обработка", "Легковесный"],
      rabbit: ["Высокая производительность", "128-битная безопасность", "Низкая память"],
      sha3: ["Хэш Keccak", "SHA-3-256", "Современный стандарт"],
      blake2: ["Быстрое хэширование", "Безопасный хэш", "Эффективный"],
      ecies: ["Эллиптическая кривая", "Интегрированное шифрование", "Эффективный обмен ключами"],
    },
    id: {
      base64: ["Pengkodean teks", "Konversi gambar", "Pemrosesan real-time"],
      hash: ["SHA-256", "SHA-512", "Hashing file"],
      symmetric: ["Enkripsi AES-256", "Dekripsi", "Generasi kunci"],
      asymmetric: ["Enkripsi RSA", "Enkripsi ECC", "Generasi pasangan kunci"],
      encoding: ["Pengkodean URL", "Konversi Hex", "Konversi biner"],
      files: ["File besar", "Streaming", "Pelacakan progres"],
      bgv: ["Enkripsi homomorfik", "Komputasi terenkripsi", "Pelindungan privasi"],
      elgamal: ["Enkripsi kunci publik", "Tanda tangan digital", "Pertukaran kunci"],
      paillier: ["Enkripsi probabilistik", "Homomorfisme aditif", "Komputasi aman"],
      pqc: ["Pertukaran kunci Kyber", "Tanda tangan Dilithium", "Tahan kuantum"],
      stream: ["ChaCha20", "Enkripsi berkecepatan tinggi", "Pemrosesan real-time"],
      des: ["Enkripsi DES", "Cipher blok", "Dukungan lama"],
      tripledes: ["Enkripsi triple", "Keamanan ditingkatkan", "Kompatibilitas"],
      rc4: ["Cipher stream", "Pemrosesan cepat", "Ringan"],
      rabbit: ["Kinerja tinggi", "Keamanan 128-bit", "Memori rendah"],
      sha3: ["Hash Keccak", "SHA-3-256", "Standar modern"],
      blake2: ["Hashing cepat", "Hash aman", "Efisien"],
      ecies: ["Kurva eliptik", "Enkripsi terintegrasi", "Pertukaran kunci efisien"],
    },
    zh: {
      base64: ["文本编码", "图片转换", "实时处理"],
      hash: ["SHA-256", "SHA-512", "文件哈希"],
      symmetric: ["AES-256加密", "解密", "密钥生成"],
      asymmetric: ["RSA加密", "ECC加密", "密钥对生成"],
      encoding: ["URL编码", "十六进制转换", "二进制转换"],
      files: ["大文件", "流式处理", "进度跟踪"],
      bgv: ["同态加密", "加密计算", "隐私保护"],
      elgamal: ["公钥加密", "数字签名", "密钥交换"],
      paillier: ["概率加密", "加法同态", "安全计算"],
      pqc: ["Kyber密钥交换", "Dilithium签名", "抗量子"],
      stream: ["ChaCha20", "高速加密", "实时处理"],
      des: ["DES加密", "分组密码", "传统支持"],
      tripledes: ["三重加密", "增强安全", "兼容性"],
      rc4: ["流密码", "快速处理", "轻量级"],
      rabbit: ["高性能", "128位安全", "低内存"],
      sha3: ["Keccak哈希", "SHA-3-256", "现代标准"],
      blake2: ["快速哈希", "安全哈希", "高效"],
      ecies: ["椭圆曲线", "集成加密", "高效密钥交换"],
    },
  };

  return features[locale][toolId];
}

/**
 * Get HowTo steps for tools
 */
function getToolHowToSteps(toolId: ToolId, locale: Locale): any[] | null {
  // Only return steps for commonly used tools
  const commonTools: ToolId[] = ["base64", "hash", "symmetric", "asymmetric"];

  if (!commonTools.includes(toolId)) return null;

  const steps: Record<Locale, Record<ToolId, any[]>> = {
    en: {
      base64: [
        {
          "@type": "HowToStep",
          name: "Enter text",
          text: "Enter the text you want to encode or decode in the input field",
        },
        {
          "@type": "HowToStep",
          name: "Choose operation",
          text: "Select whether you want to encode or decode",
        },
        {
          "@type": "HowToStep",
          name: "Get result",
          text: "The result will appear instantly in real-time",
        },
      ],
      hash: [
        {
          "@type": "HowToStep",
          name: "Select algorithm",
          text: "Choose a hash algorithm (SHA-256, SHA-512, etc.)",
        },
        {
          "@type": "HowToStep",
          name: "Enter data",
          text: "Enter text or upload a file to hash",
        },
        {
          "@type": "HowToStep",
          name: "Generate hash",
          text: "The hash will be generated automatically",
        },
      ],
      symmetric: [
        {
          "@type": "HowToStep",
          name: "Generate key",
          text: "Generate a secure encryption key",
        },
        {
          "@type": "HowToStep",
          name: "Enter data",
          text: "Enter the text you want to encrypt",
        },
        {
          "@type": "HowToStep",
          name: "Encrypt",
          text: "Click encrypt to get the encrypted result",
        },
      ],
      asymmetric: [
        {
          "@type": "HowToStep",
          name: "Generate keys",
          text: "Generate public and private key pair",
        },
        {
          "@type": "HowToStep",
          name: "Enter data",
          text: "Enter the text you want to encrypt",
        },
        {
          "@type": "HowToStep",
          name: "Encrypt",
          text: "Use the public key to encrypt data",
        },
      ],
      encoding: [],
      files: [],
      bgv: [],
      elgamal: [],
      paillier: [],
      pqc: [],
      stream: [],
      des: [],
      tripledes: [],
      rc4: [],
      rabbit: [],
      sha3: [],
      blake2: [],
      ecies: [],
    },
    // Add other locales as needed
    ko: {
      base64: [],
      hash: [],
      symmetric: [],
      asymmetric: [],
      encoding: [],
      files: [],
      bgv: [],
      elgamal: [],
      paillier: [],
      pqc: [],
      stream: [],
      des: [],
      tripledes: [],
      rc4: [],
      rabbit: [],
      sha3: [],
      blake2: [],
      ecies: [],
    },
    ja: {
      base64: [],
      hash: [],
      symmetric: [],
      asymmetric: [],
      encoding: [],
      files: [],
      bgv: [],
      elgamal: [],
      paillier: [],
      pqc: [],
      stream: [],
      des: [],
      tripledes: [],
      rc4: [],
      rabbit: [],
      sha3: [],
      blake2: [],
      ecies: [],
    },
    ru: {
      base64: [],
      hash: [],
      symmetric: [],
      asymmetric: [],
      encoding: [],
      files: [],
      bgv: [],
      elgamal: [],
      paillier: [],
      pqc: [],
      stream: [],
      des: [],
      tripledes: [],
      rc4: [],
      rabbit: [],
      sha3: [],
      blake2: [],
      ecies: [],
    },
    id: {
      base64: [],
      hash: [],
      symmetric: [],
      asymmetric: [],
      encoding: [],
      files: [],
      bgv: [],
      elgamal: [],
      paillier: [],
      pqc: [],
      stream: [],
      des: [],
      tripledes: [],
      rc4: [],
      rabbit: [],
      sha3: [],
      blake2: [],
      ecies: [],
    },
    zh: {
      base64: [],
      hash: [],
      symmetric: [],
      asymmetric: [],
      encoding: [],
      files: [],
      bgv: [],
      elgamal: [],
      paillier: [],
      pqc: [],
      stream: [],
      des: [],
      tripledes: [],
      rc4: [],
      rabbit: [],
      sha3: [],
      blake2: [],
      ecies: [],
    },
  };

  return steps[locale][toolId];
}
