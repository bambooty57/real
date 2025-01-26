export function getFarmingTypeDisplay(type: string): string {
  const displayMap: { [key: string]: string } = {
    waterPaddy: '수도작',
    fieldFarming: '밭농사',
    orchard: '과수원',
    livestock: '축산업',
    forageCrop: '사료작물'
  };
  return displayMap[type] || type;
}

export function getMainCropDisplay(type: string): string {
  const displayMap: { [key: string]: string } = {
    foodCrops: '식량작물',
    facilityHort: '시설원예',
    fieldVeg: '노지채소',
    fruits: '과수',
    specialCrops: '특용작물',
    flowers: '화훼',
    livestock: '축산'
  };
  return displayMap[type] || type;
} 