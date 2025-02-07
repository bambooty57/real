export { MANUFACTURERS } from './manufacturers';

export const MAIN_CROPS = {
  foodCrops: {
    label: '식량작물',
    subTypes: [
      { value: 'rice', label: '벼' },
      { value: 'barley', label: '보리' },
      { value: 'wheat', label: '밀' },
      { value: 'corn', label: '옥수수' },
      { value: 'soybean', label: '콩' },
      { value: 'potato', label: '감자' },
      { value: 'sweetPotato', label: '고구마' }
    ]
  },
  facilityHort: {
    label: '시설원예',
    subTypes: [
      { value: 'tomato', label: '토마토' },
      { value: 'strawberry', label: '딸기' },
      { value: 'cucumber', label: '오이' },
      { value: 'pepper', label: '고추' },
      { value: 'watermelon', label: '수박' },
      { value: 'melon', label: '멜론' }
    ]
  },
  fieldVeg: {
    label: '노지채소',
    subTypes: [
      { value: 'cabbage', label: '배추' },
      { value: 'radish', label: '무' },
      { value: 'garlic', label: '마늘' },
      { value: 'onion', label: '양파' },
      { value: 'carrot', label: '당근' }
    ]
  },
  fruits: {
    label: '과수',
    subTypes: [
      { value: 'apple', label: '사과' },
      { value: 'pear', label: '배' },
      { value: 'grape', label: '포도' },
      { value: 'peach', label: '복숭아' },
      { value: 'citrus', label: '감귤' }
    ]
  },
  specialCrops: {
    label: '특용작물',
    subTypes: [
      { value: 'sesame', label: '참깨' },
      { value: 'perilla', label: '들깨' },
      { value: 'ginseng', label: '인삼' },
      { value: 'medicinalHerbs', label: '약용작물' }
    ]
  },
  flowers: {
    label: '화훼',
    subTypes: [
      { value: 'rose', label: '장미' },
      { value: 'chrysanthemum', label: '국화' },
      { value: 'lily', label: '백합' },
      { value: 'orchid', label: '난' }
    ]
  },
  livestock: {
    label: '축산',
    subTypes: [
      { value: 'cattle', label: '한우' },
      { value: 'pig', label: '돼지' },
      { value: 'chicken', label: '닭' },
      { value: 'duck', label: '오리' },
      { value: 'goat', label: '염소' },
      { value: 'dairy', label: '젖소' },
      { value: 'other', label: '기타' }
    ]
  }
}; 