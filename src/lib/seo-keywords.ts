import type { Locale } from "@/i18n";
import type { ToolId } from "./tool-config";

/**
 * SEO keywords for each locale and tool
 */
export const SEO_KEYWORDS: Record<Locale, {
  common: string[];
  toolSpecific: Record<ToolId, string[]>;
}> = {
  ko: {
    common: [
      "온라인 암호화",
      "무료 암호화 도구",
      "브라우저 암호화",
      "개인정보 보호",
      "데이터 보안",
      "암호화 툴",
      "보안 도구",
      "웹 암호화",
      "클라이언트 암호화",
      "안전한 암호화",
    ],
    toolSpecific: {
      base64: ["Base64 인코딩", "Base64 디코딩", "Base64 변환기", "이미지 Base64"],
      hash: ["해시 생성기", "해시 함수", "체크섬", "파일 해시", "데이터 무결성"],
      symmetric: ["대칭키 암호화", "AES 암호화", "대칭 암호", "블록 암호"],
      asymmetric: ["비대칭키 암호화", "공개키 암호", "RSA 암호화", "ECC 암호화"],
      encoding: ["문자 인코딩", "URL 인코딩", "Hex 인코딩", "바이너리 변환"],
      files: ["파일 암호화", "대용량 파일", "스트리밍 암호화", "파일 보안"],
      bgv: ["동형 암호", "BGV 암호화", "양자 암호", "고급 암호"],
      elgamal: ["ElGamal 암호화", "비대칭 암호", "공개키 시스템"],
      paillier: ["Paillier 암호화", "확률적 암호", "덧셈 동형성"],
      pqc: ["양자내성 암호", "포스트 양자 암호", "Kyber", "Dilithium", "양자 컴퓨터 대응"],
      stream: ["스트림 암호", "ChaCha20", "Salsa20", "고속 암호화"],
      des: ["DES 암호화", "레거시 암호", "블록 암호", "대칭키"],
      tripledes: ["3DES 암호화", "Triple DES", "다중 암호화"],
      rc4: ["RC4 암호화", "스트림 암호", "고속 암호"],
      rabbit: ["Rabbit 암호화", "경량 암호", "고성능 암호"],
      sha3: ["SHA-3 해시", "Keccak", "최신 해시 알고리즘"],
      blake2: ["BLAKE2 해시", "고속 해시", "암호화 해시 함수"],
      ecies: ["ECIES 암호화", "타원곡선 암호", "통합 암호화 방식"],
    },
  },
  en: {
    common: [
      "online encryption",
      "free cryptography tools",
      "browser-based encryption",
      "privacy protection",
      "data security",
      "encryption tools",
      "security utilities",
      "web cryptography",
      "client-side encryption",
      "secure encryption",
    ],
    toolSpecific: {
      base64: ["Base64 encoding", "Base64 decoding", "Base64 converter", "image to Base64"],
      hash: ["hash generator", "hash function", "checksum", "file hash", "data integrity"],
      symmetric: ["symmetric encryption", "AES encryption", "symmetric cipher", "block cipher"],
      asymmetric: ["asymmetric encryption", "public key cryptography", "RSA encryption", "ECC encryption"],
      encoding: ["character encoding", "URL encoding", "Hex encoding", "binary conversion"],
      files: ["file encryption", "large files", "streaming encryption", "file security"],
      bgv: ["homomorphic encryption", "BGV cipher", "quantum cryptography", "advanced encryption"],
      elgamal: ["ElGamal encryption", "asymmetric cipher", "public key system"],
      paillier: ["Paillier encryption", "probabilistic encryption", "additive homomorphism"],
      pqc: ["post-quantum cryptography", "quantum-resistant", "Kyber", "Dilithium", "quantum-safe"],
      stream: ["stream cipher", "ChaCha20", "Salsa20", "high-speed encryption"],
      des: ["DES encryption", "legacy cipher", "block cipher", "symmetric key"],
      tripledes: ["3DES encryption", "Triple DES", "multiple encryption"],
      rc4: ["RC4 encryption", "stream cipher", "fast encryption"],
      rabbit: ["Rabbit encryption", "lightweight cipher", "high-performance encryption"],
      sha3: ["SHA-3 hash", "Keccak", "modern hash algorithm"],
      blake2: ["BLAKE2 hash", "fast hashing", "cryptographic hash function"],
      ecies: ["ECIES encryption", "elliptic curve", "integrated encryption scheme"],
    },
  },
  ja: {
    common: [
      "オンライン暗号化",
      "無料暗号化ツール",
      "ブラウザ暗号化",
      "プライバシー保護",
      "データセキュリティ",
      "暗号化ツール",
      "セキュリティツール",
      "ウェブ暗号化",
      "クライアント側暗号化",
      "安全な暗号化",
    ],
    toolSpecific: {
      base64: ["Base64エンコード", "Base64デコード", "Base64変換", "画像Base64"],
      hash: ["ハッシュ生成", "ハッシュ関数", "チェックサム", "ファイルハッシュ", "データ整合性"],
      symmetric: ["共通鍵暗号", "AES暗号化", "対称暗号", "ブロック暗号"],
      asymmetric: ["公開鍵暗号", "非対称暗号", "RSA暗号化", "ECC暗号化"],
      encoding: ["文字エンコーディング", "URLエンコード", "16進数エンコード", "バイナリ変換"],
      files: ["ファイル暗号化", "大容量ファイル", "ストリーミング暗号化", "ファイルセキュリティ"],
      bgv: ["準同型暗号", "BGV暗号", "量子暗号", "高度な暗号化"],
      elgamal: ["ElGamal暗号", "非対称暗号", "公開鍵システム"],
      paillier: ["Paillier暗号", "確率的暗号", "加法準同型性"],
      pqc: ["耐量子暗号", "ポスト量子暗号", "Kyber", "Dilithium", "量子コンピュータ対策"],
      stream: ["ストリーム暗号", "ChaCha20", "Salsa20", "高速暗号化"],
      des: ["DES暗号", "レガシー暗号", "ブロック暗号", "共通鍵"],
      tripledes: ["3DES暗号", "トリプルDES", "多重暗号化"],
      rc4: ["RC4暗号", "ストリーム暗号", "高速暗号"],
      rabbit: ["Rabbit暗号", "軽量暗号", "高性能暗号"],
      sha3: ["SHA-3ハッシュ", "Keccak", "最新ハッシュアルゴリズム"],
      blake2: ["BLAKE2ハッシュ", "高速ハッシュ", "暗号学的ハッシュ関数"],
      ecies: ["ECIES暗号", "楕円曲線暗号", "統合暗号化方式"],
    },
  },
  ru: {
    common: [
      "онлайн шифрование",
      "бесплатные инструменты шифрования",
      "шифрование в браузере",
      "защита конфиденциальности",
      "безопасность данных",
      "инструменты шифрования",
      "утилиты безопасности",
      "веб-криптография",
      "клиентское шифрование",
      "безопасное шифрование",
    ],
    toolSpecific: {
      base64: ["кодирование Base64", "декодирование Base64", "конвертер Base64", "изображение в Base64"],
      hash: ["генератор хэша", "хэш-функция", "контрольная сумма", "хэш файла", "целостность данных"],
      symmetric: ["симметричное шифрование", "шифрование AES", "симметричный шифр", "блочный шифр"],
      asymmetric: ["асимметричное шифрование", "криптография с открытым ключом", "шифрование RSA", "шифрование ECC"],
      encoding: ["кодировка символов", "кодирование URL", "кодирование Hex", "бинарное преобразование"],
      files: ["шифрование файлов", "большие файлы", "потоковое шифрование", "безопасность файлов"],
      bgv: ["гомоморфное шифрование", "шифр BGV", "квантовая криптография", "продвинутое шифрование"],
      elgamal: ["шифрование ElGamal", "асимметричный шифр", "система с открытым ключом"],
      paillier: ["шифрование Paillier", "вероятностное шифрование", "аддитивный гомоморфизм"],
      pqc: ["постквантовая криптография", "квантово-устойчивый", "Kyber", "Dilithium", "квантово-безопасный"],
      stream: ["потоковый шифр", "ChaCha20", "Salsa20", "высокоскоростное шифрование"],
      des: ["шифрование DES", "устаревший шифр", "блочный шифр", "симметричный ключ"],
      tripledes: ["шифрование 3DES", "тройной DES", "множественное шифрование"],
      rc4: ["шифрование RC4", "потоковый шифр", "быстрое шифрование"],
      rabbit: ["шифрование Rabbit", "легкий шифр", "высокопроизводительное шифрование"],
      sha3: ["хэш SHA-3", "Keccak", "современный алгоритм хэширования"],
      blake2: ["хэш BLAKE2", "быстрое хэширование", "криптографическая хэш-функция"],
      ecies: ["шифрование ECIES", "эллиптическая кривая", "интегрированная схема шифрования"],
    },
  },
  id: {
    common: [
      "enkripsi online",
      "alat enkripsi gratis",
      "enkripsi browser",
      "perlindungan privasi",
      "keamanan data",
      "alat enkripsi",
      "utilitas keamanan",
      "kriptografi web",
      "enkripsi sisi klien",
      "enkripsi aman",
    ],
    toolSpecific: {
      base64: ["pengkodean Base64", "dekode Base64", "konverter Base64", "gambar ke Base64"],
      hash: ["generator hash", "fungsi hash", "checksum", "hash file", "integritas data"],
      symmetric: ["enkripsi simetris", "enkripsi AES", "cipher simetris", "cipher blok"],
      asymmetric: ["enkripsi asimetris", "kriptografi kunci publik", "enkripsi RSA", "enkripsi ECC"],
      encoding: ["pengkodean karakter", "pengkodean URL", "pengkodean Hex", "konversi biner"],
      files: ["enkripsi file", "file besar", "enkripsi streaming", "keamanan file"],
      bgv: ["enkripsi homomorfik", "cipher BGV", "kriptografi kuantum", "enkripsi lanjutan"],
      elgamal: ["enkripsi ElGamal", "cipher asimetris", "sistem kunci publik"],
      paillier: ["enkripsi Paillier", "enkripsi probabilistik", "homomorfisme aditif"],
      pqc: ["kriptografi pasca-kuantum", "tahan kuantum", "Kyber", "Dilithium", "aman kuantum"],
      stream: ["cipher stream", "ChaCha20", "Salsa20", "enkripsi berkecepatan tinggi"],
      des: ["enkripsi DES", "cipher lama", "cipher blok", "kunci simetris"],
      tripledes: ["enkripsi 3DES", "Triple DES", "enkripsi ganda"],
      rc4: ["enkripsi RC4", "cipher stream", "enkripsi cepat"],
      rabbit: ["enkripsi Rabbit", "cipher ringan", "enkripsi berkinerja tinggi"],
      sha3: ["hash SHA-3", "Keccak", "algoritma hash modern"],
      blake2: ["hash BLAKE2", "hash cepat", "fungsi hash kriptografi"],
      ecies: ["enkripsi ECIES", "kurva eliptik", "skema enkripsi terintegrasi"],
    },
  },
  zh: {
    common: [
      "在线加密",
      "免费加密工具",
      "浏览器加密",
      "隐私保护",
      "数据安全",
      "加密工具",
      "安全工具",
      "网络加密",
      "客户端加密",
      "安全加密",
    ],
    toolSpecific: {
      base64: ["Base64编码", "Base64解码", "Base64转换器", "图片转Base64"],
      hash: ["哈希生成器", "哈希函数", "校验和", "文件哈希", "数据完整性"],
      symmetric: ["对称加密", "AES加密", "对称密码", "分组密码"],
      asymmetric: ["非对称加密", "公钥加密", "RSA加密", "ECC加密"],
      encoding: ["字符编码", "URL编码", "十六进制编码", "二进制转换"],
      files: ["文件加密", "大文件", "流式加密", "文件安全"],
      bgv: ["同态加密", "BGV密码", "量子密码", "高级加密"],
      elgamal: ["ElGamal加密", "非对称密码", "公钥系统"],
      paillier: ["Paillier加密", "概率加密", "加法同态"],
      pqc: ["后量子密码", "抗量子", "Kyber", "Dilithium", "量子安全"],
      stream: ["流密码", "ChaCha20", "Salsa20", "高速加密"],
      des: ["DES加密", "传统密码", "分组密码", "对称密钥"],
      tripledes: ["3DES加密", "三重DES", "多重加密"],
      rc4: ["RC4加密", "流密码", "快速加密"],
      rabbit: ["Rabbit加密", "轻量级密码", "高性能加密"],
      sha3: ["SHA-3哈希", "Keccak", "现代哈希算法"],
      blake2: ["BLAKE2哈希", "快速哈希", "密码哈希函数"],
      ecies: ["ECIES加密", "椭圆曲线", "集成加密方案"],
    },
  },
};

/**
 * Get combined SEO keywords for a specific tool and locale
 */
export function getSEOKeywords(toolId: ToolId, locale: Locale): string[] {
  const localeKeywords = SEO_KEYWORDS[locale];
  return [
    ...localeKeywords.common,
    ...localeKeywords.toolSpecific[toolId],
  ];
}

/**
 * Get SEO-optimized description for a tool
 */
export function getSEODescription(
  toolId: ToolId,
  locale: Locale,
  baseDescription: string
): string {
  const keywords = getSEOKeywords(toolId, locale).slice(0, 3).join(", ");
  return `${baseDescription} ${keywords}`;
}
