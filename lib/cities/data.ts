export interface CityRecord {
  name: string;
  lat: number;
  lng: number;
  qweatherId?: string; // If known, skips geo lookup when fetching weather
}

// Major Chinese cities with coordinates.
// Used for dynamic "nearby city" search via Haversine distance.
// qweatherId is optional — fetchWeather() falls back to geo lookup when absent.
export const CITIES: CityRecord[] = [
  // 直辖市
  { name: '北京',     lat: 39.9042, lng: 116.4074, qweatherId: '101010100' },
  { name: '上海',     lat: 31.2304, lng: 121.4737, qweatherId: '101020100' },
  { name: '天津',     lat: 39.0842, lng: 117.2008, qweatherId: '101030100' },
  { name: '重庆',     lat: 29.5630, lng: 106.5516, qweatherId: '101040100' },

  // 东北
  { name: '沈阳',     lat: 41.8057, lng: 123.4315, qweatherId: '101070101' },
  { name: '大连',     lat: 38.9140, lng: 121.6147, qweatherId: '101070201' },
  { name: '哈尔滨',   lat: 45.8038, lng: 126.5358, qweatherId: '101050101' },
  { name: '长春',     lat: 43.8868, lng: 125.3245, qweatherId: '101060101' },
  { name: '吉林',     lat: 43.8378, lng: 126.5496, qweatherId: '101060201' },
  { name: '齐齐哈尔', lat: 47.3542, lng: 123.9181, qweatherId: '101050201' },

  // 华北
  { name: '石家庄',   lat: 38.0428, lng: 114.5149, qweatherId: '101090101' },
  { name: '太原',     lat: 37.8706, lng: 112.5489, qweatherId: '101100101' },
  { name: '保定',     lat: 38.8737, lng: 115.4647, qweatherId: '101090201' },
  { name: '唐山',     lat: 39.6307, lng: 118.1802, qweatherId: '101090501' },
  { name: '呼和浩特', lat: 40.8426, lng: 111.7519, qweatherId: '101080101' },
  { name: '包头',     lat: 40.6551, lng: 109.8385, qweatherId: '101080201' },

  // 华东 — 江苏
  { name: '南京',     lat: 32.0603, lng: 118.7969, qweatherId: '101190101' },
  { name: '苏州',     lat: 31.2989, lng: 120.5853, qweatherId: '101190401' },
  { name: '无锡',     lat: 31.4912, lng: 120.3119, qweatherId: '101190201' },
  { name: '常州',     lat: 31.7711, lng: 119.9742, qweatherId: '101191101' },
  { name: '南通',     lat: 32.0245, lng: 120.8947, qweatherId: '101190501' },
  { name: '扬州',     lat: 32.3942, lng: 119.4217, qweatherId: '101190601' },
  { name: '镇江',     lat: 32.1875, lng: 119.4551, qweatherId: '101190301' },
  { name: '泰州',     lat: 32.4901, lng: 119.9001, qweatherId: '101190701' },
  { name: '盐城',     lat: 33.3476, lng: 120.1636, qweatherId: '101190901' },
  { name: '徐州',     lat: 34.2604, lng: 117.1811, qweatherId: '101191201' },

  // 华东 — 浙江
  { name: '杭州',     lat: 30.2741, lng: 120.1551, qweatherId: '101210101' },
  { name: '宁波',     lat: 29.8683, lng: 121.5440, qweatherId: '101210401' },
  { name: '温州',     lat: 28.0000, lng: 120.6723, qweatherId: '101210701' },
  { name: '嘉兴',     lat: 30.7467, lng: 120.7508, qweatherId: '101210301' },
  { name: '绍兴',     lat: 30.0003, lng: 120.5820, qweatherId: '101210507' },
  { name: '舟山',     lat: 29.9852, lng: 122.2074, qweatherId: '101211101' },
  { name: '金华',     lat: 29.0784, lng: 119.6500, qweatherId: '101210901' },
  { name: '台州',     lat: 28.6560, lng: 121.4205, qweatherId: '101210601' },

  // 华东 — 其他
  { name: '合肥',     lat: 31.8206, lng: 117.2272, qweatherId: '101220101' },
  { name: '芜湖',     lat: 31.3526, lng: 118.4330, qweatherId: '101220301' },
  { name: '南昌',     lat: 28.6820, lng: 115.8580, qweatherId: '101240101' },
  { name: '福州',     lat: 26.0753, lng: 119.3062, qweatherId: '101230101' },
  { name: '厦门',     lat: 24.4798, lng: 118.0894, qweatherId: '101230201' },
  { name: '泉州',     lat: 24.8744, lng: 118.6757, qweatherId: '101230501' },
  { name: '济南',     lat: 36.6758, lng: 117.0009, qweatherId: '101120101' },
  { name: '青岛',     lat: 36.0671, lng: 120.3826, qweatherId: '101120201' },
  { name: '烟台',     lat: 37.4638, lng: 121.4479, qweatherId: '101120501' },

  // 华中
  { name: '武汉',     lat: 30.5928, lng: 114.3055, qweatherId: '101200101' },
  { name: '长沙',     lat: 28.2277, lng: 112.9388, qweatherId: '101250101' },
  { name: '郑州',     lat: 34.7466, lng: 113.6254, qweatherId: '101180101' },
  { name: '洛阳',     lat: 34.6197, lng: 112.4541, qweatherId: '101180901' },

  // 华南
  { name: '广州',     lat: 23.1291, lng: 113.2644, qweatherId: '101280101' },
  { name: '深圳',     lat: 22.5431, lng: 114.0579, qweatherId: '101280601' },
  { name: '珠海',     lat: 22.2710, lng: 113.5767, qweatherId: '101280701' },
  { name: '佛山',     lat: 23.0219, lng: 113.1221, qweatherId: '101280800' },
  { name: '东莞',     lat: 23.0207, lng: 113.7518, qweatherId: '101281600' },
  { name: '惠州',     lat: 23.1116, lng: 114.4161, qweatherId: '101280300' },
  { name: '南宁',     lat: 22.8170, lng: 108.3665, qweatherId: '101300101' },
  { name: '桂林',     lat: 25.2736, lng: 110.2990, qweatherId: '101300501' },
  { name: '海口',     lat: 20.0312, lng: 110.3312, qweatherId: '101310101' },
  { name: '三亚',     lat: 18.2529, lng: 109.5122, qweatherId: '101310201' },

  // 西南
  { name: '成都',     lat: 30.5728, lng: 104.0668, qweatherId: '101270101' },
  { name: '贵阳',     lat: 26.6470, lng: 106.6302, qweatherId: '101260101' },
  { name: '昆明',     lat: 25.0406, lng: 102.7123, qweatherId: '101290101' },
  { name: '丽江',     lat: 26.8721, lng: 100.2331, qweatherId: '101290401' },
  { name: '张家界',   lat: 29.1160, lng: 110.4793, qweatherId: '101251101' },

  // 西北
  { name: '西安',     lat: 34.3416, lng: 108.9402, qweatherId: '101110101' },
  { name: '兰州',     lat: 36.0611, lng: 103.7923, qweatherId: '101160101' },
  { name: '银川',     lat: 38.4663, lng: 106.2782, qweatherId: '101170101' },
  { name: '西宁',     lat: 36.6171, lng: 101.7782, qweatherId: '101150101' },
  { name: '乌鲁木齐', lat: 43.7928, lng: 87.6177,  qweatherId: '101130101' },

  // 其他
  { name: '拉萨',     lat: 29.6500, lng: 91.1409,  qweatherId: '101140101' },
];
