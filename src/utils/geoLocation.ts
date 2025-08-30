import haversine from "haversine";

export const getDistance = async (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const start = {
    latitude: lat1,
    longitude: lon1,
  };
  const end = {
    latitude: lat2,
    longitude: lon2,
  };
  return haversine(start, end, { unit: "km" });
};
