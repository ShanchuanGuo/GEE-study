//landsat 5tm+8oli 19880101-20130131
var byq = ee.FeatureCollection("users/cnscguo/Bayiqu");
Map.addLayer(byq,{},'Baiyiqu');
var start = ee.Date('1988-01-01');
var finish = ee.Date('1997-12-31');
//导入夏季6-8月份landsat5影像，数据量太少未采用：
//var landsat5=ee.ImageCollection('LANDSAT/LT05/C01/T1_TOA').filter(ee.Filter.calendarRange(6,8,'month'));
var landsat5=ee.ImageCollection('LANDSAT/LT05/C01/T1_TOA');
//边界、时相、云量筛选影像
var l5byq=ee.ImageCollection(landsat5
.filterBounds(byq)
.filterDate(start, finish)
.filterMetadata('CLOUD_COVER','less_than',10)
);
//print(l5byq);
//数据镶嵌
//总天数
var diff = finish.difference(start, 'day');
var temporalResolution = 1 //days;
//日期列表
var range = ee.List.sequence(0, diff.subtract(1), temporalResolution)
.map(function(day){return start.advance(day,'day')});
//print(range);
//按日期镶嵌
var day_mosaics = function(date, newlist)
{
	date = ee.Date(date);
	newlist = ee.List(newlist);
	var dateT = ee.Date(date).millis();
	var date_formatted = ee.Number.parse(date.format('YYYYMMdd'));
	var dateband = ee.Image.constant(date_formatted).toUint32().rename('date');
	//按日期选择
	var filtered = l5byq.filterDate(date, date.advance(temporalResolution, 'day'));
	var image = ee.Image(filtered.mosaic().clip(byq)).addBands(dateband).set('system:time_start', dateT);
	return ee.List(ee.Algorithms.If(filtered.size(), newlist.add(image), newlist));
}
var newl5byq = ee.ImageCollection(ee.List(range.iterate(day_mosaics, ee.List([]))))
print(newl5byq);
Map.addLayer(newl5byq);
//NDVI计算
var addNdvi = function (img){
	var nir=img.select('B4');
	var red=img.select('B3');
	var ndvi=nir.subtract(red).divide(nir.add(red)).rename('NDVI');
	return img.addBands(ndvi);
};
var withNdvi=newl5byq.map(addNdvi);
//Map.addLayer(withNdvi);
//print(withNdvi);
var l5Ndvi = withNdvi.select('NDVI');
print(l5Ndvi);
//Map.addLayer(l5Ndvi, {}, 'NDVI');
//Download collection to Google Drive
var list=l5Ndvi.toList(150);
    for (var i=0;i<150;i++){
         var imageN=ee.Image(list.get(i));
         var date = imageN.date().format('YYYYMMdd').getInfo();
         var name= 'NDVI_'+i.toString()+'_'+date;
         print(name);
         // Export NDVI        
         Export.image.toDrive({ 
               image: imageN,
               description: name,
               fileNamePrefix: name,
               scale: 30,
               region:byq,
               });
    }
