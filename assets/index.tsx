import { ComponentType } from 'react';

// 使用 import.meta.glob 动态导入 SVG 组件
// eager: false 表示懒加载，返回 () => Promise<Module> 的函数
export const yearStats = import.meta.glob<{ ReactComponent: ComponentType<any> }>(
  './year_*.svg',
  { eager: false }
);

export const totalStat = import.meta.glob<{ ReactComponent: ComponentType<any> }>(
  ['./github.svg', './grid.svg'],
  { eager: false }
);
