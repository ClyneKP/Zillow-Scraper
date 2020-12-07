var options = {
		limit: 1000,
		autoscroll: true,
		remove: false
	},
	rows = {
		tid: ['Tab'],
		rid: 'Request ID',
		type: ['Type'],
		time: ['Time'],
		status: ['Status'],
		method: ['Method'],
		hostname: ['Hostname'],
		url: 'URL',
		request: 'Request Headers',
		response: 'Response Headers'
	},
	values = {
		requests: {},
		requests_all: 0,
		requests_visible: 0,
		filters: []
	},
    pause = true;
    var mergedData = new Array();

$(function() {

	$('.settings .link').bind('click', function() {

		var setting = $(this).parent(),
			bottom = 0;

		if (parseInt(setting.css('bottom')) == 0) {
			bottom = -setting.height();
		}

		setting.animate({bottom: bottom});

	}).trigger('click');

	$('.settings .pause').bind('click', function() {

	    var title = $(this).attr('title'),
            data = $(this).data('title');

        $(this).attr('title', data);
        $(this).data('title', title);

        pause = !pause;
	    $(this).toggleClass('glyphicon-play glyphicon-pause');
	});

		$('.settings .clear').bind('click', function() {

	  var mergedData = new Array();

		document.getElementById("results").innerHTML = "Results Captured: 0"

	});

	$('.settings .download').bind('click', function() {

		var flattened = new Array()

		for (i=0; i < mergedData.length; i++) {flattened.push(JSON.flatten(mergedData[i]))}

		var fields = Object.keys(flattened[0])
		var replacer = function(key, value) { return value === null ? '' : value } 
		var csv = flattened.map(function(row){
		  return fields.map(function(fieldName){
		    return JSON.stringify(row[fieldName], replacer)
		  }).join(',')
		})
		csv.unshift(fields.join(',')) // add header column
		csv = csv.join('\r\n');

		console.save(csv, place + '.csv')

	});

	$.extend( $.fn.dataTable.defaults, {
	    searching: false,
	    scrollY: 500,
	    ordering:  false,
	    paging: false
	} );

	(function(console){

	    console.save = function(data, filename){

	        if(!data) {
	            console.error('Console.save: No data')
	            return;
	        }

	        if(!filename) filename = 'console.json'

	        if(typeof data === "object"){
	            data = JSON.stringify(data, undefined, 4)
	        }

	        var blob = new Blob([data], {type: 'text/json'}),
	            e    = document.createEvent('MouseEvents'),
	            a    = document.createElement('a')

	        a.download = filename
	        a.href = window.URL.createObjectURL(blob)
	        a.dataset.downloadurl =  ['text/json', a.download, a.href].join(':')
	        e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
	        a.dispatchEvent(e)
	    }
	})(console)


	/*console.save(mergedData, place + '.json')*/

	JSON.flatten = function (data) {
	    var result = {};

	    function recurse(cur, prop) {
	        if (Object(cur) !== cur) {
	            result[prop] = cur;
	        } else if (Array.isArray(cur)) {
	            for (var i = 0, l = cur.length; i < l; i++)
	            recurse(cur[i], prop + "[" + i + "]");
	            if (l == 0) result[prop] = [];
	        } else {
	            var isEmpty = true;
	            for (var p in cur) {
	                isEmpty = false;
	                recurse(cur[p], prop ? prop + "." + p : p);
	            }
	            if (isEmpty && prop) result[prop] = {};
	        }
	    }
	    recurse(data, "");
	    return result;
	};

	const reducer = (accumulator, currentValue) => {
	  if(!accumulator.find(obj => obj.zpid === currentValue.zpid)){
	    accumulator.push(currentValue);
	  }
	  return accumulator;
	};

	$(document).ready( function () {
		var table = $('#example').DataTable();

		chrome.runtime.onConnect.addListener(async function(port) {

		port.onMessage.addListener(async function(Message) {

			if (pause) {
	        return false;
        	}


			try{
			r = Message.Details.url.split("SearchTerm%22%3A%22")[1].split("%22%2C%22mapBounds")[0]
			r = r.replace("%2C","_")
			place = r.replace("%20","")

			console.log("Downloading")

			var pageN = 25

			  async function downloadData(i){
			  url = Message.Details.url;
			pageing = "pagination%22%3A%7B%22currentPage%22%3A" + i + "%7D%2C%22";
			var res = url.replace("pagination%22%3A%7B%7D%2C%22",pageing);
			var res = res.replace("{%22cat1%22:[%22mapResults%22]}","{%22cat1%22:[%22listResults%22,%22mapResults%22]}");
			var res = res + "&emptyParam=70460277";
			  let response = await fetch(res, {
			  "headers": {
			    "accept": "*/*",
			    "accept-language": "en-US,en;q=0.9",
			    "cache-control": "no-cache",
			    "pragma": "no-cache",
			    "sec-fetch-dest": "empty",
			    "sec-fetch-mode": "cors",
			    "sec-fetch-site": "same-origin"
			  },
			  "referrer": res,
			  "referrerPolicy": "unsafe-url",
			  "body": null,
			  "method": "GET",
			  "mode": "cors",
			  "credentials": "include"
			});
			  let data = await response.json()
			  return data;
			} 

			var downloadedData = new Array();
			var totalResults = 0
			for (i=1; i < pageN + 1; i++)
			  {
			  	if (i == 1){
			  		await downloadData(i).then(data => {
			  			downloadedData.push(data.cat1.searchResults.listResults)
			  			totalResults = data.cat1.searchList.totalResultCount
			  		});

			  		document.getElementById("loader").style.display = "block";
			  		console.log(totalResults)

			  	} else{
			  		if ( i <= Math.ceil(totalResults/40)){
			  			await downloadData(i).then(data => downloadedData.push(data.cat1.searchResults.listResults))
			  		}
			  	}
			  }

			for (i=0; i < downloadedData.length; i++){
			  for (t=0; t < downloadedData[i].length; t++)
			  {
			    mergedData.push(downloadedData[i][t])
			  }
			}

		}catch{

		}



			mergedData = mergedData.reduce(reducer, []);

			/*table
		    .clear()
		    .draw();

			for (i=0; i < mergedData.length; i++){
				 table.row.add( [
					mergedData[i].zpid,
		            mergedData[i].address,
		            mergedData[i].area,
		            mergedData[i].unformattedPrice,
		            mergedData[i].statusType
		        	] ).draw( false );
			};*/

			if (Math.ceil(totalResults/40) > pageN){
			  			alert("There are " + totalResults.toString() + " results; however, the server will only return 1000 at a time.\n Zoom in and sweep over your geography until you've captured every result.");
			  		}

			document.getElementById("loader").style.display = "none";
			document.getElementById("results").innerHTML = "Results Captured: " + mergedData.length.toString();

		});

	});



	});
	});
