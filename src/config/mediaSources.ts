import { MediaSource, MediaBias } from '@/types';

/**
 * 언론사 분류 설정
 * 
 * 이 파일에서 진보/보수 언론사를 직접 추가/수정할 수 있습니다.
 * bias: 'progressive' - 진보 성향
 * bias: 'conservative' - 보수 성향
 */

// 진보 성향 언론사 목록
export const PROGRESSIVE_MEDIA: MediaSource[] = [
  { name: '한겨레', bias: 'progressive', domain: 'hani.co.kr' },
  { name: '경향신문', bias: 'progressive', domain: 'khan.co.kr' },
  { name: '오마이뉴스', bias: 'progressive', domain: 'ohmynews.com' },
  { name: '프레시안', bias: 'progressive', domain: 'pressian.com' },
  { name: 'JTBC', bias: 'progressive', domain: 'jtbc.co.kr' },
  { name: '뉴스타파', bias: 'progressive', domain: 'newstapa.org' },
  { name: '미디어오늘', bias: 'progressive', domain: 'mediatoday.co.kr' },
  // 여기에 진보 성향 언론사를 추가하세요
];

// 보수 성향 언론사 목록
export const CONSERVATIVE_MEDIA: MediaSource[] = [
  { name: '조선일보', bias: 'conservative', domain: 'chosun.com' },
  { name: '중앙일보', bias: 'conservative', domain: 'joongang.co.kr' },
  { name: '동아일보', bias: 'conservative', domain: 'donga.com' },
  { name: '문화일보', bias: 'conservative', domain: 'munhwa.com' },
  { name: 'TV조선', bias: 'conservative', domain: 'tvchosun.com' },
  { name: '채널A', bias: 'conservative', domain: 'ichannela.com' },
  { name: '매일경제', bias: 'conservative', domain: 'mk.co.kr' },
  { name: '한국경제', bias: 'conservative', domain: 'hankyung.com' },
  // 여기에 보수 성향 언론사를 추가하세요
];

// 전체 언론사 목록
export const ALL_MEDIA_SOURCES: MediaSource[] = [
  ...PROGRESSIVE_MEDIA,
  ...CONSERVATIVE_MEDIA,
];

/**
 * 언론사 이름이나 도메인으로 성향을 찾는 함수
 */
export function getMediaBias(sourceNameOrDomain: string): MediaBias | null {
  const normalizedInput = sourceNameOrDomain.toLowerCase();
  
  // 진보 언론사 확인
  for (const media of PROGRESSIVE_MEDIA) {
    if (
      media.name.toLowerCase().includes(normalizedInput) ||
      normalizedInput.includes(media.name.toLowerCase()) ||
      (media.domain && normalizedInput.includes(media.domain))
    ) {
      return 'progressive';
    }
  }
  
  // 보수 언론사 확인
  for (const media of CONSERVATIVE_MEDIA) {
    if (
      media.name.toLowerCase().includes(normalizedInput) ||
      normalizedInput.includes(media.name.toLowerCase()) ||
      (media.domain && normalizedInput.includes(media.domain))
    ) {
      return 'conservative';
    }
  }
  
  return null;
}

/**
 * 성향별 언론사 이름 목록 반환
 */
export function getMediaNamesByBias(bias: MediaBias): string[] {
  const sources = bias === 'progressive' ? PROGRESSIVE_MEDIA : CONSERVATIVE_MEDIA;
  return sources.map(s => s.name);
}

