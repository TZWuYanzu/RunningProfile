import { useRef, useState, useEffect, useCallback } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';
import {
  LINE_OPACITY,
  MAP_HEIGHT,
  PRIVACY_MODE,
  AMAP_KEY,
} from '@/utils/const';
import { Coordinate, IViewState } from '@/utils/utils';
import RunMapButtons from './RunMapButtons';
import styles from './style.module.css';
import { FeatureCollection } from 'geojson';
import { RPGeometry } from '@/static/run_countries';

interface IRunMapProps {
  title: string;
  viewState: IViewState;
  setViewState: (_viewState: IViewState) => void;
  changeYear: (_year: string) => void;
  geoData: FeatureCollection<RPGeometry>;
  thisYear: string;
}

// 高德地图官方主题样式
// dark: 暗黑色  darkblue: 深蓝色  fresh: 清新绿  grey: 浅灰  macaron: 马卡龙  normal: 标准
const AMAP_DARK_STYLE = 'amap://styles/darkblue';  // 使用深蓝色，更适合深色主题
const AMAP_LIGHT_STYLE = 'amap://styles/normal';

const AMapView = ({
  title,
  viewState,
  setViewState,
  changeYear,
  geoData,
  thisYear,
}: IRunMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const polylinesRef = useRef<any[]>([]);
  const markersRef = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  // 默认使用深色主题，与页面风格一致
  const [lights, setLights] = useState(false);
  const [AMapInstance, setAMapInstance] = useState<any>(null);

  const polylines = geoData.features
    .filter((f) => f.geometry && f.geometry.coordinates && f.geometry.coordinates.length > 0)
    .map((f) => ({
      path: f.geometry.coordinates as Coordinate[],
      color: (f.properties as any)?.color || '#ff0000',
    }));

  const isSingleRun = polylines.length === 1 && polylines[0].path.length > 0;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    AMapLoader.load({
      key: AMAP_KEY,
      version: '2.0',
      plugins: ['AMap.Scale', 'AMap.ToolBar'],
    })
      .then((AMap) => {
        setAMapInstance(AMap);
        const map = new AMap.Map(mapContainerRef.current, {
          zoom: viewState.zoom || 11,
          center: viewState.longitude && viewState.latitude
            ? [viewState.longitude, viewState.latitude]
            : [116.397428, 39.90923],
          mapStyle: lights ? AMAP_LIGHT_STYLE : AMAP_DARK_STYLE,
          resizeEnable: true,
          viewMode: '2D',
        });

        map.addControl(new AMap.Scale());
        map.addControl(new AMap.ToolBar({ position: 'RB' }));

        mapInstanceRef.current = map;
        setMapLoaded(true);

        map.on('moveend', () => {
          const center = map.getCenter();
          const zoom = map.getZoom();
          setViewState({
            ...viewState,
            longitude: center.getLng(),
            latitude: center.getLat(),
            zoom: zoom,
          });
        });
      })
      .catch((e) => {
        console.error('AMap load failed:', e);
      });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setMapStyle(lights ? AMAP_LIGHT_STYLE : AMAP_DARK_STYLE);
    }
  }, [lights]);

  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !AMapInstance) return;

    const map = mapInstanceRef.current;

    polylinesRef.current.forEach((pl) => map.remove(pl));
    polylinesRef.current = [];

    markersRef.current.forEach((m) => map.remove(m));
    markersRef.current = [];

    if (polylines.length === 0) return;

    polylines.forEach(({ path, color }) => {
      if (path.length === 0) return;

      const pathLngLat = path.map((coord) => new AMapInstance.LngLat(coord[0], coord[1]));

      const pl = new AMapInstance.Polyline({
        path: pathLngLat,
        strokeColor: color,
        strokeWeight: isSingleRun ? 4 : 2,
        strokeOpacity: isSingleRun ? 1 : LINE_OPACITY,
        lineJoin: 'round',
        lineCap: 'round',
      });

      map.add(pl);
      polylinesRef.current.push(pl);
    });

    if (isSingleRun && polylines[0].path.length > 0) {
      const first = polylines[0].path[0];
      const last = polylines[0].path[polylines[0].path.length - 1];

      const startMarker = new AMapInstance.Marker({
        position: new AMapInstance.LngLat(first[0], first[1]),
        content: '<div style="width:14px;height:14px;background:#00ff00;border-radius:50%;border:2px solid white;"></div>',
        offset: new AMapInstance.Pixel(-7, -7),
      });

      const endMarker = new AMapInstance.Marker({
        position: new AMapInstance.LngLat(last[0], last[1]),
        content: '<div style="width:14px;height:14px;background:#ff0000;border-radius:50%;border:2px solid white;"></div>',
        offset: new AMapInstance.Pixel(-7, -7),
      });

      map.add(startMarker);
      map.add(endMarker);
      markersRef.current.push(startMarker, endMarker);
    }

    if (polylinesRef.current.length > 0) {
      map.setFitView(polylinesRef.current, false, [50, 50, 50, 50]);
    }
  }, [mapLoaded, geoData, AMapInstance, isSingleRun]);

  const toggleFullscreen = useCallback(() => {
    if (!mapContainerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      mapContainerRef.current.requestFullscreen();
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (mapInstanceRef.current) {
        setTimeout(() => mapInstanceRef.current.resize(), 100);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div style={{ width: '100%', height: MAP_HEIGHT, position: 'relative' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      <RunMapButtons changeYear={changeYear} thisYear={thisYear} />
      <span className={styles.runTitle}>{title}</span>
      {!PRIVACY_MODE && (
        <div
          className={`${styles.lights} ${lights ? styles.lightsOn : styles.lightsOff}`}
          onClick={() => setLights(!lights)}
        />
      )}
      <button
        onClick={toggleFullscreen}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          padding: '5px 10px',
          background: 'rgba(0,0,0,0.5)',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          opacity: 0.3,
        }}
      >
        ⛶
      </button>
    </div>
  );
};

export default AMapView;
