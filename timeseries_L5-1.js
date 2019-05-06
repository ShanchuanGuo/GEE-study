// data import
var cgi2 = ee.FeatureCollection("users/cnscguo/CGI2");
var nbgp = ee.FeatureCollection("users/cnscguo/NBGP/NBGP");
var dem = ee.Image("users/cnscguo/NBGP/terrain")
.clip(nbgp).rename('DEM').reproject('EPSG:32646', null, 30);
var landsat5 = ee.ImageCollection("LANDSAT/LT05/C01/T1_SR")
.filter(ee.Filter.eq('WRS_PATH', 135))
.filter(ee.Filter.eq('WRS_ROW', 39))
.filterMetadata("CLOUD_COVER","less_than",10.01)
.filterDate("1984-01-01","2000-01-01")
.map(function(image){return image.clip(nbgp)});
var sample = ee.FeatureCollection("users/cnscguo/NBGP/sample");


// visualization
var vizParams = {
  bands: ['B5', 'B4', 'B2'],
  min: 0,
  max: 5000,
  gamma: [0.95, 1.1, 1]
};
Map.centerObject(nbgp,10);
print(landsat5);
Map.addLayer(landsat5,vizParams,'l5');
// Map.addLayer(ee.Image(0).mask(0).paint(cgi2,0,2),{},'CGI2');
Map.addLayer(ee.Image(0).mask(0).paint(nbgp,0,2),{},'NamchaBarwa&GyalaPeri');


// index calculation
var addEvi = function(img){
	var evi = img.expression('2.5*((nir-red)/(nir+6*red-7.5*blue+1))',{
		'nir': img.select('B4'),
		'red': img.select('B3'),
		'blue': img.select('B1')
	}).rename('EVI').add(127.5).multiply(127.5).toUint16();
	return img.addBands(evi);
};
var addNdbi = function(img){
	var swir1 = img.select('B5');
	var nir = img.select('B4');
	var ndbi = swir1.subtract(nir).divide(swir1.add(nir)).rename('NDBI')
	.add(127.5).multiply(127.5).toUint16();
	return img.addBands(ndbi);
};
var addNdsi = function(img){
	var green = img.select('B2');
	var swir1 = img.select('B5');
	var ndsi = green.subtract(swir1).divide(green.add(swir1)).rename('NDSI')
	.add(127.5).multiply(127.5).toUint16();
	return img.addBands(ndsi);
};
var addNdvi = function(img){
	var nir = img.select('B4');
	var red = img.select('B3');
	var ndvi = nir.subtract(red).divide(nir.add(red)).rename('NDVI')
	.add(127.5).multiply(127.5).toUint16();
	return img.addBands(ndvi);
};
var addNdwi = function(img){
	var green = img.select('B2');
	var nir = img.select('B4');
	var ndwi = green.subtract(nir).divide(green.add(nir)).rename('NDWI')
	.add(127.5).multiply(127.5).toUint16();
	return img.addBands(ndwi);
};
var l5 = landsat5.map(addNdwi).map(addNdvi).map(addNdsi).map(addNdbi).map(addEvi)
.map(function(image){return image.addBands(dem)});


// GLCM calculation
var addGlcm = function(img){
	var int = img.select(['B1','B2','B3','B4','B5','B6']);
	var glcm = int.glcmTexture();
	return img.addBands(glcm);
};

var bands = ['B1','B2','B3','B4','B5','B6','NDWI','NDVI','NDSI','NDBI','EVI','DEM',
'B1_asm','B1_contrast','B1_corr','B1_var','B1_idm','B1_ent',
'B2_asm','B2_contrast','B2_corr','B2_var','B2_idm','B2_ent',
'B3_asm','B3_contrast','B3_corr','B3_var','B3_idm','B3_ent',
'B4_asm','B4_contrast','B4_corr','B4_var','B4_idm','B4_ent',
'B5_asm','B5_contrast','B5_corr','B5_var','B5_idm','B5_ent',
'B6_asm','B6_contrast','B6_corr','B6_var','B6_idm','B6_ent'];

var lg = l5.map(addGlcm).select(bands);
print(lg);

// segmentation

var segmentation = function(img){
	var seeds = ee.Algorithms.Image.Segmentation.seedGrid(10);
	var snic = ee.Algorithms.Image.Segmentation.SNIC({
		image: img.select(['B1','B2','B3','B4','B5','B6','NDVI','NDSI']),
		size: 10,
		compactness: 2,
		connectivity: 8,
		neighborhoodSize: 90,
		seeds: seeds
	});
	return img.addBands(snic);
};
var seg = lg.map(segmentation);
print(seg);
var clusters = seg.select('clusters');
print(clusters);
Map.addLayer(clusters, {}, 'clusters', false);


var addClusters = function(img){
	var bands = ['B1','B2','B3','B4','B5','B6','NDWI','NDVI','NDSI','NDBI','EVI','DEM',
	'B1_asm','B1_contrast','B1_corr','B1_var','B1_idm','B1_ent',
	'B2_asm','B2_contrast','B2_corr','B2_var','B2_idm','B2_ent',
	'B3_asm','B3_contrast','B3_corr','B3_var','B3_idm','B3_ent',
	'B4_asm','B4_contrast','B4_corr','B4_var','B4_idm','B4_ent',
	'B5_asm','B5_contrast','B5_corr','B5_var','B5_idm','B5_ent',
	'B6_asm','B6_contrast','B6_corr','B6_var','B6_idm','B6_ent','clusters'];
	var mean = img.reduceConnectedComponents(ee.Reducer.mean(), 'clusters', 90);
	var stdDev = img.reduceConnectedComponents(ee.Reducer.stdDev(), 'clusters', 90);
	var area = ee.Image.pixelArea().addBands(img.select('clusters')).reduceConnectedComponents(ee.Reducer.sum(), 'clusters', 90);
	var minMax = img.select('clusters').reduceNeighborhood(ee.Reducer.minMax(), ee.Kernel.square(1));
	var perimeterPixels = minMax.select(0).neq(minMax.select(1)).rename('perimeter');
	var perimeter = perimeterPixels.addBands(img.select('clusters')).reduceConnectedComponents(ee.Reducer.sum(), 'clusters', 90);
	var sizes = ee.Image.pixelLonLat().addBands(img.select('clusters')).reduceConnectedComponents(ee.Reducer.minMax(), 'clusters', 90);
	var width = sizes.select('longitude_max').subtract(sizes.select('longitude_min')).rename('width');
	var height = sizes.select('latitude_max').subtract(sizes.select('latitude_min')).rename('height');
	return ee.Image.cat([mean,stdDev,area,perimeter,width,height]).float();
};
var object = seg.map(addClusters);
print(object);

// training

var classification = function(img){
	var training = img.sampleRegions({
	collection:sample,
	properties:['id'],
	scale:30,
	tileScale:4
	});
	var classifier = ee.Classifier.randomForest({'numberOfTrees': 200});
	var trained = classifier.train(training,'id');
	var classified = img.classify(trained).remap([0,1,2],[0,1,1]);
	return classified
};
var glacier = object.map(classification);
print(glacier);
var list = glacier.toList(100);
	for (var i=0;i<32;i++){
		 var image = ee.Image(list.get(i));
		 var id = image.id().getInfo();
		 var name = 'G'+id.slice(12,20);
		 var palette = ['ffffff','ff0000'];
		 Map.addLayer(image, {min: 0, max: 1, palette: palette, opacity: 0.5}, name, false);
		 // Export glacier
		 Export.image.toDrive({
		 	image: image,
		 	description: name,
		 	fileNamePrefix: name,
		 	scale: 30,
		 	region: nbgp,
		 });		 
		};