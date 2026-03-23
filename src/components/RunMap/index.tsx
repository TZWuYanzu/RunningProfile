import { MAP_PROVIDER } from '@/utils/const';
import { FeatureCollection } from 'geojson';
import { RPGeometry } from '@/static/run_countries';
import { IViewState } from '@/utils/utils';

// Lazy load map components
import MapboxView from './MapboxView';
import AMapView from './AMapView';

interface IRunMapProps {
  title: string;
  viewState: IViewState;
  setViewState: (_viewState: IViewState) => void;
  changeYear: (_year: string) => void;
  geoData: FeatureCollection<RPGeometry>;
  thisYear: string;
}

const RunMap = (props: IRunMapProps) => {
  // Use AMap for 'amap' provider, otherwise use Mapbox
  if (MAP_PROVIDER === 'amap') {
    return <AMapView {...props} />;
  }
  return <MapboxView {...props} />;
};

export default RunMap;
