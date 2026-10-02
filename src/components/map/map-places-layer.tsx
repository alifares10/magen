import { MapClusterLayer } from "@/components/ui/map";
import {
  mapPlaceFeaturePropertiesSchema,
  selectedMapPlaceSchema,
  type MapPlaceFeatureProperties,
  type SelectedMapPlace,
} from "@/lib/schemas/map-places";

type MapPlacesLayerProps = {
  onSelectPlace: (place: SelectedMapPlace) => void;
};

export function MapPlacesLayer({ onSelectPlace }: MapPlacesLayerProps) {
  return (
    <MapClusterLayer<MapPlaceFeatureProperties>
      data="/data/israel-places.geojson"
      clusterMaxZoom={9}
      clusterRadius={42}
      clusterColors={["#8b5cf6", "#7c3aed", "#6d28d9"]}
      clusterThresholds={[25, 100]}
      pointColor="#a855f7"
      onPointClick={(feature, coordinates) => {
        const parsedProperties = mapPlaceFeaturePropertiesSchema.safeParse(feature.properties);

        if (!parsedProperties.success) {
          return;
        }

        const parsedSelection = selectedMapPlaceSchema.safeParse({
          ...parsedProperties.data,
          longitude: coordinates[0],
          latitude: coordinates[1],
        });

        if (!parsedSelection.success) {
          return;
        }

        onSelectPlace(parsedSelection.data);
      }}
    />
  );
}
