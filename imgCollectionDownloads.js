// data L8 Downloads
var nbgp = ee.FeatureCollection("users/cnscguo/NBGP/NBGP");
var landsat8 = ee.ImageCollection("LANDSAT/LC08/C01/T1_SR")
.filter(ee.Filter.eq('WRS_PATH', 135))
.filter(ee.Filter.eq('WRS_ROW', 39))
.filterMetadata("CLOUD_COVER","less_than",10.01)
.filterDate("2013-7-24","2019-4-26")
.map(function(image){return image.clip(nbgp)})
.select(['B2','B3','B4','B5','B6','B7']);

// Downloads
var list = landsat8.toList(100);
	for (var i=0;i<14;i++){
		 var image = ee.Image(list.get(i));
		 var id = image.id().getInfo();
		 var name = 'L8_'+id.slice(12,20);
		 Export.image.toDrive({
		 	image: image,
		 	description: name,
		 	fileNamePrefix: name,
		 	scale: 30,
		 	region: nbgp,
		 });		 
		};


// data L5 Downloads
var nbgp = ee.FeatureCollection("users/cnscguo/NBGP/NBGP");
var landsat5 = ee.ImageCollection("LANDSAT/LT05/C01/T1_SR")
.filter(ee.Filter.eq('WRS_PATH', 135))
.filter(ee.Filter.eq('WRS_ROW', 39))
.filterMetadata("CLOUD_COVER","less_than",10.01)
.filterDate("1984-01-01","2012-5-31")
.map(function(image){return image.clip(nbgp)})
.select(['B1','B2','B3','B4','B5','B7']);
print(landsat5);
// Downloads
var list = landsat5.toList(100);
	for (var i=0;i<64;i++){
		 var image = ee.Image(list.get(i));
		 var id = image.id().getInfo();
		 var name = 'L5_'+id.slice(12,20);
		 Export.image.toDrive({
		 	image: image,
		 	description: name,
		 	fileNamePrefix: name,
		 	scale: 30,
		 	region: nbgp,
		 });		 
		};


// data L7 Downloads
import ee
from geetools import batch
nbgp = ee.FeatureCollection("users/cnscguo/NBGP/NBGP");
landsat7 = ee.ImageCollection("LANDSAT/LE07/C01/T1_SR")
.filter(ee.Filter.eq('WRS_PATH', 135))
.filter(ee.Filter.eq('WRS_ROW', 39))
.filterMetadata("CLOUD_COVER","less_than",10.01)
.filterDate("2013-7-24","2019-4-26")
.map(function(image){return image.clip(nbgp)})
.select(['B1','B2','B3','B4','B5','B7']);

tasklist = batch.ImageCollection.toDrive(landsat7,'test',{})
