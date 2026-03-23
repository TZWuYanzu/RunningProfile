import { ComponentType } from 'react';

type SvgModule = {
  ReactComponent: ComponentType<any>;
};

type SvgComponent = {
  default: ComponentType<any>;
};

const FailedLoadSvg = () => <div>Failed to load SVG</div>;

export const loadSvgComponent = async (
  stats: Record<string, () => Promise<SvgModule>>,
  path: string
): Promise<SvgComponent> => {
  try {
    // 检查 path 是否存在于 stats 中
    if (!stats[path] || typeof stats[path] !== 'function') {
      console.warn(`SVG not found: ${path}. Available paths:`, Object.keys(stats));
      return { default: FailedLoadSvg };
    }
    const module = await stats[path]();
    // 从模块中提取 ReactComponent
    return { default: module.ReactComponent };
  } catch (error) {
    console.error('Failed to load SVG:', path, error);
    return { default: FailedLoadSvg };
  }
};
