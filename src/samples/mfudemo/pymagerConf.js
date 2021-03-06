dojo.provide("samples.mfudemo.pymagerConf");

	samples.mfudemo.pymagerConf.generateLinks = function(uploadedFileInformation) {
		
		var supportedFormats = ["jpg", "bmp", "gif","png"];
		var derivedImageURL = "http://@PYMAGER_HOST@:@PYMAGER_PORT@@PYMAGER_PATH@/derived/";
		var convertToSize = ["600x600", "80x80"];
		var link ="";
		
		dojo.forEach(supportedFormats , function(format) {							
				link = link + "<a href="+derivedImageURL+uploadedFileInformation.getID()+"-"+convertToSize[0]+"."+format+">Download "+uploadedFileInformation.getName()+"  converted to "+format+"<strong> ["+convertToSize[0]+"]</strong></a><br />";										
		});
		
		link = link +"<br />";
		
		dojo.forEach(supportedFormats , function(format) {							
				link = link + "<a href="+derivedImageURL+uploadedFileInformation.getID()+"-"+convertToSize[1]+"."+format+">Download "+uploadedFileInformation.getName()+"  converted to "+format+"<strong> ["+convertToSize[1]+"]</strong></a><br />";										
		});
		
		dojo.byId("result").innerHTML = link;
	}

	samples.mfudemo.pymagerConf.addHeadMsg = function() {
		var  headerText = "<p>The demo uses <a href='http://github.com/samokk/pymager'>pymager</a> image server.<br />the following links are generated with pymager, which provides automatic image conversion and resize<p>"	;			
		dojo.byId("headmsg").innerHTML = headerText;
		
	}
	
	
