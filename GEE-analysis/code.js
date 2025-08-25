var CONVERT_TO_IMPORT =
(
  [{"type":"imageCollection","name":"sent2","record":{"id":"COPERNICUS/S2_SR_HARMONIZED"}},
  {"type":"geometry","name":"gaza","record":{"geometries":[{"type":"Polygon","coordinates":
  [[[34.222186299269225,31.324595819970114],[34.26750490278485,31.223066782339156],
  [34.373248310987975,31.303477395514587],[34.36432191938641,31.372094955386814],
  [34.50165102094891,31.497470991393268],[34.565509053175475,31.5402010695869],
  [34.4899780473161,31.591100422432845],[34.36981508344891,31.4529641268055]]],"evenOdd":true}],"displayProperties":[],"properties":
  {},"color":"#ff1d1d","mode":"Geometry","shown":false,"locked":false}}]
)

Map.setCenter(264.8, 34.8, 4)

// Define the image collection we are working with
var collection = ee.ImageCollection(sent2.filterDate("2023-04-01", "2024-05-1").filterBounds(gaza)
// Filter the collection by only approving cloudless pics
.filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 1)));
// Need to exclude some of the images that are cropped duplicates of the images I need.
// Something to do with the last six characters (unique granule identifier indicating its UTM grid reference)
var excludeIDs =
[
"20230510T081601_20230510T082247_T36SXA",
"20230515T081609_20230515T082251_T36SXA",
"20230530T081611_20230530T082252_T36SXA",
"20230624T081609_20230624T082252_T36SXA",
"20230704T081609_20230704T082253_T36SXA",
"20230714T081609_20230714T082954_T36SXA",
"20230719T081611_20230719T082252_T36SXA",
"20230803T081609_20230803T082458_T36SXA",
"20230823T081609_20230823T082524_T36SXA",
"20230907T081611_20230907T082047_T36SXA",
"20230912T081609_20230912T082758_T36SXA",
"20231022T081959_20231022T082119_T36SXA",
"20231101T082009_20231101T082250_T36SXA",
"20231126T082251_20231126T082253_T36SXA",
"20231226T082341_20231226T082343_T36SXA",
"20240305T081821_20240305T082250_T36SXA",
"20240330T081609_20240330T083029_T36SXA",
"20240404T081601_20240404T082245_T36SXA"
];

var filteredCollection = collection.filter(ee.Filter.inList('system:index', excludeIDs).not());

// Bands 4,3 and 2 needed for RGB
var trueColour =
{
  bands: ["B4", "B3", "B2"],
  min: 0,
  max: 3000
};
print(collection.getInfo(), filteredCollection.getInfo());

// Add a true colour image for reference
Map.addLayer(collection.first(), trueColour, "True colour");

// NDVI ---------------------------------------------------------------------------------------------
// Calculate NDVI
function calculateNDVI(image) 
{
  var NDVI =
  image.expression("(NIR-R) / (NIR+R)",
  {
    NIR: image.select("B8"),
    R: image.select("B4") // Red
  }).rename("NDVI");
  return image.addBands(NDVI);
}

var NDVIParams = 
{
  min: -1,
  max: 1,
  palette: [“black”, “white", "green"]
};

var NDVICollection = filteredCollection.map(calculateNDVI);

// Create a list so that I can select a specific image from the collection
var NDVIlist = NDVICollection.toList(NDVICollection.size());
var JuneNDVIImg = ee.Image(NDVIlist.get(0)); // First image of the collection, June 2023
var JanNDVIImg = ee.Image(NDVIlist.get(26)); // Last, January 2024

Map.addLayer(JuneNDVIImg.select("NDVI"), NDVIParams, "June, 2023 NDVI");
Map.addLayer(JanNDVIImg.select("NDVI"), NDVIParams, "January, 2024 NDVI");

// Chart the mean NDVI for the area
var ndviTimeSeries = ui.Chart.image.series({
  imageCollection: NDVICollection.select("NDVI"),
  region: gaza,
  reducer: ee.Reducer.mean(),
  scale: 30
})
.setOptions({
  title: "Mean NDVI Time Series",
  hAxis: {title: "Date", format: "M/d/yy", gridlines: {count: 15}, type: "category"},
  vAxis: {title: "NDVI"},
  lineWidth: 1,
  pointSize: 3
});

print(ndviTimeSeries);

// IBI -------------------------------------------------------------------------------------------------
// Calculate an Indices-built Built-up Index (IBI) for all the images in the collection
// according to Xu (2008)
function calculateIBI(image) 
{
  var IBI = image.expression(
    "(2*SWIR1 / (SWIR1+NIR) - (NIR / (NIR+R) + G / (G+SWIR1))) / (2*SWIR1 / (SWIR1+NIR) + (NIR / (NIR+R) + G / (G+SWIR1)))",
  {
    SWIR1: image.select("B11"), // Shortwave infrared
    NIR: image.select("B8"), // Near-infrared
    R: image.select("B4"), // Red
    G: image.select("B3"), // Green
  }).rename("IBI");
  return image.addBands(IBI);
}

var IBICollection = filteredCollection.map(calculateIBI);

// Count the values from the IBI for charting. Greater than 0.013 values of IBI are urban area, others are not.
// Threshold value 0.013 according to Xu (2008)
function classifyIBI(image) 
{
  var IBI = image.select("IBI");
  var classified = IBI.gt(0.013).rename("classified_IBI");
  return image.addBands(classified);
}

// Map the classification function over the image collection
var classifiedCollection = IBICollection.map(classifyIBI);
var IBIParams =
{
  min: 0,
  max: 1,
  palette: ["blue", "red"]
};

var IBIlist = classifiedCollection.toList(classifiedCollection.size());
var JuneIBIImg = ee.Image(IBIlist.get(0));
var JanIBIImg = ee.Image(IBIlist.get(26));

Map.addLayer(JuneIBIImg.select("classified_IBI"), IBIParams, "June, 2023 IBI");
Map.addLayer(JanIBIImg.select("classified_IBI"), IBIParams, "January, 2024 IBI");

function countValues(image) 
{
  var count0 = image.select("IBI").sample({region: gaza, scale: 30}).filter(ee.Filter.lt("IBI", 0.013)).size();
  var count1 = image.select("IBI").sample({region: gaza, scale: 30}).filter(ee.Filter.gt("IBI", 0.013)).size();

  return ee.Feature(gaza, {
    "non-urban": count0,
    "urban": count1,
    "date": ee.Date(image.get("system:time_start"))
  });
}

// Apply the countValues function
var countCollection = IBICollection.map(countValues);

// Charting & Images ------------------------------------------------------------------------------------
// Chart out the pixels of urban and non-urban area according to the IBI
var chartIBI = ui.Chart.feature.byFeature(countCollection, "date", ["non-urban", "urban"]).setChartType("ColumnChart")
  .setOptions({
    title: "IBI Counts Over Time",
    hAxis: {title: "Date", format: "M/d/yy", gridlines: {count: 15}, type: "category"},
    vAxis: {title: "Count of pixels"},
    bar: {groupWidth: "100px"}
  }
);
print(chartIBI);

// Make gif file of the true colour images. Lot's of info there
// Code taken (with minor modifications) from the introductory lecture by Dr. Iuliia Burdun
var videoArgs =
{
  dimensions: 600,
  region: gaza,
  framesPerSecond: 1
};

var text = require('users/gena/packages:text');
var annotations =
[
  { 
    position: 'left',
    offset: '1%',
    margin: '1%',
    property: 'label',
    scale: 140,
    font: 'monospace'  
  }
];

function addText(image)
{
  var timeStamp = ee.Number(image.date().format('YYYY-MM-dd'));
  var timeStamp = ee.String('Date: ').cat(ee.String(timeStamp));
  var image = image.visualize({
    min: 0,
    max: 3000,
    bands: ["B4", "B3", "B2"],
    gamma: [1.1, 1.1, 1.1]
  }).set({'label':timeStamp});
  var annotated = text.annotateImage(image, {}, gaza, annotations);
  return annotated;
}

var dataset = filteredCollection.map(addText);

print(ui.Thumbnail({
  image: dataset,
  params: videoArgs,
  style: {fontWeight:500, border: '1px solid black'}
}));

// IBI and NDVI layers as images to the console, first June 14th, 2023 then Jan 10th, 2024
// Did it this way because exporting proved difficult
// NDVI
print(ui.Thumbnail({
  image: JuneNDVIImg,
  params: {
    min: -1,
    max: 1,
    palette: ["black", "white", "green"],
    region: gaza,
    bands: "NDVI",
    dimensions: 600
  }
}));

print(ui.Thumbnail({
  image: JanNDVIImg,
  params: {
    min: -1,
    max: 1,
    palette: ["black", "white", "green"],
    region: gaza,
    bands: "NDVI",
    dimensions: 600
  }
}));

// IBI
print(ui.Thumbnail({
  image: JuneIBIImg,
  params: {
    min: 0,
    max: 1,
    palette: ["blue", "red"],
    region: gaza,
    bands: "classified_IBI",
    dimensions: 600
  }
}));

print(ui.Thumbnail({
  image: JanIBIImg,
    params: {
    min: 0,
    max: 1,
    palette: ["blue", "red"],
    region: gaza,
    bands: "classified_IBI",
    dimensions: 600
  }
}));
