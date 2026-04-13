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

  // 江苏 - 补充
  { name: '昆山',     lat: 31.3784, lng: 120.9776, qweatherId: '101190405' },
  { name: '太仓',     lat: 31.4500, lng: 121.1267, qweatherId: '101190406' },
  { name: '常熟',     lat: 31.6540, lng: 120.7527, qweatherId: '101190404' },
  { name: '张家港',   lat: 31.8746, lng: 120.5526, qweatherId: '101190403' },
  { name: '宜兴',     lat: 31.3408, lng: 119.8232, qweatherId: '101190204' },
  { name: '江阴',     lat: 31.9117, lng: 120.2852, qweatherId: '101190203' },
  { name: '溧阳',     lat: 31.4272, lng: 119.4892, qweatherId: '101191104' },
  { name: '海门',     lat: 31.8994, lng: 121.1756, qweatherId: '101190506' },
  { name: '东台',     lat: 32.8526, lng: 120.3296, qweatherId: '101190904' },
  { name: '启东',     lat: 31.8117, lng: 121.6669, qweatherId: '101190507' },

  // 浙江 - 补充
  { name: '湖州',     lat: 30.8703, lng: 120.0936, qweatherId: '101210201' },
  { name: '衢州',     lat: 28.9568, lng: 118.8756, qweatherId: '101211201' },
  { name: '丽水',     lat: 28.4512, lng: 119.9219, qweatherId: '101211001' },
  { name: '义乌',     lat: 29.3069, lng: 120.0756, qweatherId: '101210909' },
  { name: '东阳',     lat: 29.2656, lng: 120.2323, qweatherId: '101210907' },
  { name: '慈溪',     lat: 30.1696, lng: 121.2456, qweatherId: '101210403' },
  { name: '余姚',     lat: 30.0471, lng: 121.1578, qweatherId: '101210402' },
  { name: '海宁',     lat: 30.5351, lng: 120.6926, qweatherId: '101210303' },
  { name: '桐乡',     lat: 30.6295, lng: 120.5527, qweatherId: '101210304' },
  { name: '临安',     lat: 30.2302, lng: 119.7237, qweatherId: '101210109' },
  { name: '建德',     lat: 29.4769, lng: 119.2777, qweatherId: '101210110' },
  { name: '乐清',     lat: 28.1289, lng: 120.9512, qweatherId: '101210705' },
  { name: '瑞安',     lat: 27.7803, lng: 120.6374, qweatherId: '101210704' },
  { name: '温岭',     lat: 28.3669, lng: 121.3656, qweatherId: '101210604' },
  { name: '玉环',     lat: 28.1336, lng: 121.2323, qweatherId: '101210607' },

  // 广东 - 补充
  { name: '中山',     lat: 22.5173, lng: 113.3927, qweatherId: '101281700' },
  { name: '江门',     lat: 22.5789, lng: 113.0815, qweatherId: '101281100' },
  { name: '肇庆',     lat: 23.0470, lng: 112.4653, qweatherId: '101280400' },
  { name: '清远',     lat: 23.6817, lng: 113.0560, qweatherId: '101281400' },
  { name: '韶关',     lat: 24.8101, lng: 113.5974, qweatherId: '101280201' },
  { name: '梅州',     lat: 24.2888, lng: 116.1177, qweatherId: '101281200' },
  { name: '汕尾',     lat: 22.7864, lng: 115.3747, qweatherId: '101281800' },
  { name: '阳江',     lat: 21.8578, lng: 111.9829, qweatherId: '101281000' },
  { name: '汕头',     lat: 23.3540, lng: 116.6824, qweatherId: '101281300' },
  { name: '潮州',     lat: 23.6697, lng: 116.6226, qweatherId: '101281500' },
  { name: '揭阳',     lat: 23.5418, lng: 116.3729, qweatherId: '101281900' },
  { name: '湛江',     lat: 21.2707, lng: 110.3594, qweatherId: '101280900' },
  { name: '茂名',     lat: 21.6629, lng: 110.9253, qweatherId: '101282000' },
  { name: '云浮',     lat: 22.9150, lng: 112.0442, qweatherId: '101282100' },
  { name: '河源',     lat: 23.7463, lng: 114.6975, qweatherId: '101280500' },
  { name: '顺德',     lat: 22.8426, lng: 113.2927, qweatherId: '101280803' },
  { name: '南海',     lat: 23.0328, lng: 113.1457, qweatherId: '101280802' },
  { name: '番禺',     lat: 22.9392, lng: 113.3847, qweatherId: '101280107' },

  // 四川 - 补充
  { name: '绵阳',     lat: 31.4677, lng: 104.6794, qweatherId: '101270201' },
  { name: '德阳',     lat: 31.1270, lng: 104.3986, qweatherId: '101270301' },
  { name: '乐山',     lat: 29.5820, lng: 103.7657, qweatherId: '101270501' },
  { name: '宜宾',     lat: 28.7603, lng: 104.6433, qweatherId: '101270601' },
  { name: '泸州',     lat: 28.8720, lng: 105.4433, qweatherId: '101270701' },
  { name: '南充',     lat: 30.7991, lng: 106.0784, qweatherId: '101271101' },
  { name: '达州',     lat: 31.2094, lng: 107.5023, qweatherId: '101271301' },
  { name: '自贡',     lat: 29.3528, lng: 104.7784, qweatherId: '101270801' },
  { name: '内江',     lat: 29.5802, lng: 105.0584, qweatherId: '101270901' },
  { name: '遂宁',     lat: 30.5331, lng: 105.5711, qweatherId: '101271001' },
  { name: '眉山',     lat: 30.0764, lng: 103.8312, qweatherId: '101271501' },
  { name: '攀枝花', lat: 26.5804, lng: 101.7183, qweatherId: '101271401' },
  { name: '广元',     lat: 32.4353, lng: 105.8236, qweatherId: '101270401' },
  { name: '广安',     lat: 30.4564, lng: 106.6333, qweatherId: '101271701' },
  { name: '雅安',     lat: 29.9877, lng: 103.0134, qweatherId: '101271601' },

  // 湖北 - 补充
  { name: '宜昌',     lat: 30.6917, lng: 111.2862, qweatherId: '101200201' },
  { name: '襄阳',     lat: 32.0092, lng: 112.1228, qweatherId: '101200301' },
  { name: '荆州',     lat: 30.3269, lng: 112.2391, qweatherId: '101200401' },
  { name: '十堰',     lat: 32.6478, lng: 110.7783, qweatherId: '101200501' },
  { name: '孝感',     lat: 30.9269, lng: 113.9175, qweatherId: '101200601' },
  { name: '黄冈',     lat: 30.4469, lng: 114.8725, qweatherId: '101200701' },
  { name: '咸宁',     lat: 29.8417, lng: 114.3220, qweatherId: '101200801' },
  { name: '黄石',     lat: 30.2000, lng: 115.0778, qweatherId: '101200901' },
  { name: '恩施',     lat: 30.2719, lng: 109.4875, qweatherId: '101201101' },
  { name: '随州',     lat: 31.6917, lng: 113.3828, qweatherId: '101201201' },
  { name: '荆门',     lat: 31.0354, lng: 112.2047, qweatherId: '101201001' },
  { name: '鄂州',     lat: 30.3969, lng: 114.8925, qweatherId: '101201301' },

  // 山东 - 补充
  { name: '潍坊',     lat: 36.7067, lng: 119.1619, qweatherId: '101120301' },
  { name: '威海',     lat: 37.5131, lng: 122.1201, qweatherId: '101121301' },
  { name: '日照',     lat: 35.4164, lng: 119.5267, qweatherId: '101121401' },
  { name: '临沂',     lat: 35.1041, lng: 118.3564, qweatherId: '101121101' },
  { name: '济宁',     lat: 35.4151, lng: 116.5874, qweatherId: '101120801' },
  { name: '泰安',     lat: 36.2000, lng: 117.1200, qweatherId: '101120901' },
  { name: '德州',     lat: 37.4513, lng: 116.3594, qweatherId: '101121001' },
  { name: '聊城',     lat: 36.4569, lng: 115.9856, qweatherId: '101121201' },
  { name: '滨州',     lat: 37.3836, lng: 118.0169, qweatherId: '101121501' },
  { name: '菏泽',     lat: 35.2333, lng: 115.4411, qweatherId: '101121601' },
  { name: '东营',     lat: 37.4336, lng: 118.4947, qweatherId: '101120701' },
  { name: '枣庄',     lat: 34.8647, lng: 117.5542, qweatherId: '101120601' },
  { name: '莱芜',     lat: 36.2136, lng: 117.6778, qweatherId: '101121701' },
  { name: '曲阜',     lat: 35.5936, lng: 116.9897, qweatherId: '101120804' },

  // 河南 - 补充
  { name: '开封',     lat: 34.7975, lng: 114.3075, qweatherId: '101180201' },
  { name: '安阳',     lat: 36.0986, lng: 114.3928, qweatherId: '101180301' },
  { name: '新乡',     lat: 35.3031, lng: 113.9269, qweatherId: '101180401' },
  { name: '许昌',     lat: 34.0356, lng: 113.8275, qweatherId: '101180501' },
  { name: '平顶山', lat: 33.7353, lng: 113.3072, qweatherId: '101180601' },
  { name: '南阳',     lat: 33.0031, lng: 112.5286, qweatherId: '101180701' },
  { name: '信阳',     lat: 32.1264, lng: 114.0675, qweatherId: '101180801' },
  { name: '周口',     lat: 33.6250, lng: 114.6419, qweatherId: '101181001' },
  { name: '驻马店', lat: 32.9778, lng: 114.0253, qweatherId: '101181101' },
  { name: '商丘',     lat: 34.4147, lng: 115.6506, qweatherId: '101181201' },
  { name: '焦作',     lat: 35.2156, lng: 113.2417, qweatherId: '101181301' },
  { name: '濮阳',     lat: 35.7611, lng: 115.0289, qweatherId: '101181401' },
  { name: '漯河',     lat: 33.5717, lng: 114.0461, qweatherId: '101181501' },
  { name: '三门峡', lat: 34.7733, lng: 111.1942, qweatherId: '101181601' },
  { name: '鹤壁',     lat: 35.7475, lng: 114.2975, qweatherId: '101181701' },
  { name: '济源',     lat: 35.0903, lng: 112.5900, qweatherId: '101181801' },

  // 旅游城市
  { name: '大理',     lat: 25.6065, lng: 100.2677, qweatherId: '101290801' },
  { name: '香格里拉', lat: 27.8269, lng: 99.7072, qweatherId: '101291201' },
  { name: '西双版纳', lat: 22.0017, lng: 100.7975, qweatherId: '101291301' },
  { name: '黄山',     lat: 29.7153, lng: 118.3367, qweatherId: '101220401' },
  { name: '峨眉山', lat: 29.5800, lng: 103.4833, qweatherId: '101270504' },
  { name: '武夷山', lat: 27.7578, lng: 118.0303, qweatherId: '101230901' },
  { name: '九寨沟', lat: 33.2600, lng: 103.9200, qweatherId: '101271801' },
  { name: '阳朔',     lat: 24.7769, lng: 110.4944, qweatherId: '101300503' },
  { name: '凤凰古城', lat: 27.9475, lng: 109.6028, qweatherId: '101251104' },
  { name: '乌镇',     lat: 30.7317, lng: 120.4956, qweatherId: '101210305' },
  { name: '周庄',     lat: 31.1156, lng: 120.8456, qweatherId: '101190407' },
  { name: '西塘',     lat: 30.9478, lng: 120.8956, qweatherId: '101210306' },
  { name: '同里',     lat: 31.1583, lng: 120.7178, qweatherId: '101190408' },
  { name: '南浔',     lat: 30.8719, lng: 120.4303, qweatherId: '101210204' },
  { name: '普陀山', lat: 29.9833, lng: 122.3833, qweatherId: '101211103' },
  { name: '千岛湖', lat: 29.6067, lng: 119.0333, qweatherId: '101210111' },
  { name: '泰山',     lat: 36.2572, lng: 117.1156, qweatherId: '101120903' },
  { name: '华山',     lat: 34.4775, lng: 110.0839, qweatherId: '101110501' },
  { name: '嵩山',     lat: 34.5156, lng: 113.0061, qweatherId: '101180504' },
  { name: '庐山',     lat: 29.5578, lng: 115.9925, qweatherId: '101240501' },
  { name: '武当山', lat: 32.3956, lng: 111.0303, qweatherId: '101200504' },
  { name: '青城山', lat: 30.9069, lng: 103.5631, qweatherId: '101270104' },
  { name: '莫高窟', lat: 40.0406, lng: 94.8031, qweatherId: '101160601' },
];
