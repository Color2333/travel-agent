import type { City } from '@/types';

export const CITY_DATABASE: Record<string, City & { nearby: City[] }> = {
  '上海': {
    name: '上海',
    lat: 31.2304,
    lng: 121.4737,
    nearby: [
      { name: '杭州', lat: 30.2741, lng: 120.1551, distance: 175, trainTime: '45 分钟', driveTime: '2.5 小时' },
      { name: '苏州', lat: 31.2989, lng: 120.5853, distance: 84, trainTime: '25 分钟', driveTime: '1.5 小时' },
      { name: '无锡', lat: 31.4912, lng: 120.3119, distance: 128, trainTime: '40 分钟', driveTime: '2 小时' },
      { name: '嘉兴', lat: 30.7467, lng: 120.7508, distance: 95, trainTime: '30 分钟', driveTime: '1.5 小时' },
      { name: '宁波', lat: 29.8683, lng: 121.5440, distance: 215, trainTime: '1.5 小时', driveTime: '2.5 小时' },
      { name: '南京', lat: 32.0603, lng: 118.7969, distance: 300, trainTime: '1 小时', driveTime: '4 小时' },
      { name: '扬州', lat: 32.3942, lng: 119.4217, distance: 230, trainTime: '1.5 小时', driveTime: '3 小时' },
      { name: '绍兴', lat: 30.0003, lng: 120.5820, distance: 200, trainTime: '1 小时', driveTime: '2.5 小时' },
      { name: '舟山', lat: 29.9852, lng: 122.2074, distance: 260, trainTime: '2 小时', driveTime: '3.5 小时' },
    ],
  },
};
