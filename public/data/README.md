# Place-picker dataset

`israel-places.geojson` contains 877 selectable points derived from GeoNames Israel records. This is a static place-selection aid, not an official alert-area catalog or a live data feed.

Source: https://www.geonames.org/countries/IL/israel.html

The Hebrew labels for Jerusalem, Tel Aviv, Jaljulya, Qiryat HaYovel, Yehud-Monosson, and Lod have been corrected for display. The historical Yajur record (`293243`) is excluded; the separate Yagur record (`293248`) remains. See https://palquest.org/en/place/17176/yajur for the historical record.

When refreshing this file, preserve these corrections and run the dataset regression tests in `src/lib/map/israel-places.test.ts`.
