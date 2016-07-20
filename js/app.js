/*
 _______  (_) ______  (_) ______
/  ____/ /  // ____/ /  //  ___/
\____ \ /  // /__ \ /  / \____ \
/_____//__/ \_____//__/ /______/2015

*/
getData();
	
	function ensure_group_bins(source_group) { // (source_group, bins...}
	    var bins = Array.prototype.slice.call(arguments, 1);
	    return {
	        all:function () {
	            var result = source_group.all().slice(0), // copy original results (we mustn't modify them)
	                found = {};
	            result.forEach(function(d) {
	                found[d.key] = true;
	            });
	            bins.forEach(function(d) {
	                if(!found[d])
	                    result.push({key: d, value: 0});
	            });
	            return result;
	        }
	    };
	};

	function remove_empty_bins(source_group) {
	    return {
	        all:function () {
	            return source_group.all().filter(function(d) {
	                return d.value != 0;
	            });
	        }
	    };
	};

    function getData(){
     /*
     * Funcion que pide la data.
     */
		var lineChart = dc.compositeChart('#lineChart');
		var volumeChart = dc.barChart('#volumeLineChart');
		var mapaChart = dc.leafletMarkerChart('#mapaChart');
		var rowChart = dc.rowChart('#rowChart');
		//var equiposChart = dc.rowChart('#equiposChart');

		//fecha,equipo,temp,cantidad,lat,lon

	    d3.csv('data/dataSep2015c.csv', function (data) {
			var dateFormat = d3.time.format('%Y-%m-%d %X');
			var horaFormat = d3.time.format('%d/%b %I:%M %p');
			var salidaFecha = d3.time.format('%d %b %Y');
		    var numberFormat = d3.format('.2f');

		    data.forEach(function (d) {
		        d.dd = dateFormat.parse(d.fecha);
		        d.month = d3.time.month(d.dd); // pre-calculate month for better performance
		    	d.hora = horaFormat(d.dd);
		    	if(d.temp >= 25){
		    		d.tipo = '1 ambiente';
		    	}else if(d.temp < 25 && d.temp >= 20 ){
		    		d.tipo = '2 ok';
		    	}else if(d.temp < 20 && d.temp >= 10 ){
		    		d.tipo = '3 baja';
		    	}else if(d.temp < 10){
		    		d.tipo = '4 muy baja';
		    	};
		    });

		    var ndx = crossfilter(data);
	    	var all = ndx.groupAll();

	    	var dateDimension = ndx.dimension(function (d) {
		        return d.dd;
		    });

		    //Dimensions 
		    var equipos = ndx.dimension(function(d){
		    	return d.equipo;
		  	}),
		  	equipoGroup = equipos.group().reduceCount().top(Infinity);
		  	
		  	//var grupoEqu = equipos.group();

		  	var equipos = function(){
		  		var equ = [];
		  		for (var i = 0, len = equipoGroup.length; i < len; i++) {
				  equ.push(equipoGroup[i].key);
				}
				return equ;
		  	};

		  	var nEquipos = equipos()
		  	console.log(nEquipos);

		  	/*var temp = ndx.dimension(function(d){
		  		return d.temp;
		  	});
		  	var tempGroup = temp.group();*/

		  	var tipo = ndx.dimension(function(d){
		  		return d.tipo;
		  	}),
		  	tipoGroup = tipo.group();

		  	var hours = ndx.dimension(function(d){
		    	return d3.time.minute(dateFormat.parse(d.fecha));
		  	});
		  	var totalByHour = hours.group().reduceSum(function(d){
		    	return d.temp;
		  	});
		  	var stackByHour = hours.group().reduceCount(function (d) {
            	return d.equipo;
        	});
		  	var groupByEquipo1 = hours.group().reduceSum(function (d) {
               	if(d.equipo == nEquipos[0]){
	        		return d.temp;	
	        	}else{
	        		return 0;
	        	}
	    	});
	    	var groupByEquipo2 = hours.group().reduceSum(function (d) {
               	if(d.equipo == nEquipos[1]){
	        		return d.temp;	
	        	}else{
	        		return 0;
	        	}
	    	});
	    	/*var groupByEquipo3 = hours.group().reduceSum(function (d) {
               	if(d.equipo == nEquipos[2]){
	        		return d.temp;
	        	}else{
	        		return 0;
	        	}
	    	});
	    	var groupByEquipo4 = hours.group().reduceSum(function (d) {
               	if(d.equipo == nEquipos[3]){
	        		return d.temp;	
	        	}else{
	        		return 0;
	        	}
	    	});*/
	    	var group2x1 = remove_empty_bins(groupByEquipo1);
	    	var group2x2 = remove_empty_bins(groupByEquipo2);
	    	/*var group2x3 = remove_empty_bins(groupByEquipo3);
	    	var group2x4 = remove_empty_bins(groupByEquipo4);*/
	    	
// azul = #00c0ef
// rojo = #dd4b39
// verda = #00a65a
// orange = #f39c12
	    	var colorEqu = {
	    		861001000767554:'#00c0ef',
	    		861001000767885:'#dd4b39',
	    		861001000781654:'#00a65a',
	    		861001000767158:'#f39c12'
	    	};
	    	//Dimension para el mapa
	    	var points = ndx.dimension(function(d) { 
				//return d.lat+','+d.lon; 
				return [d.lat+','+d.lon+','+d.temp+','+d.hora+','+d.tipo+','+d.equipo+','+colorEqu[d.equipo]+','+d.temp]; 
			}); //[d.lat+','+d.lon,d.id,d.stat,d.temp]; }),
			
		    var pointsGroup = points.group().reduceCount();

		  	var wid_chart = parseInt(d3.select('#lineContainer').style('width'));
		  	var mindate = hours.bottom(1)[0].fecha;
			var maxdate = hours.top(1)[0].fecha;

			$('#minDate').html(salidaFecha(dateFormat.parse(mindate)))
			$('#maxDate').html(salidaFecha(dateFormat.parse(maxdate)))


			/* dc.lineChart('#monthly-move-chart', 'chartGroup') */
	    	lineChart 
		        //.renderArea(true)
		        .width(wid_chart)
		        .height(250)
		        //.transitionDuration(1000)
		        .margins({top: 30, right: 50, bottom: 25, left: 40})
		  //       .valueAccessor(function (d) {
				//     return d.value;
				// })
		        // .dimension(hours)
		        // .group(groupByEquipo1, nEquipos[0])
		        // .stack(groupByEquipo2, nEquipos[1], function (d) { return d.value;  })
		        // .stack(groupByEquipo3, nEquipos[2], function (d) { return d.value;  })
		        // .stack(groupByEquipo4, nEquipos[3], function (d) { return d.value;  })
		        .compose([
		            dc.lineChart(lineChart)
		                .dimension(hours)
		                .colors(colorEqu[nEquipos[0]])
		                .group(group2x1, nEquipos[0]),
		                //.dashStyle([2,2]),
		            dc.lineChart(lineChart)
		                .dimension(hours)
		                .colors(colorEqu[nEquipos[1]])
		                .group(group2x2, nEquipos[1])
		                //.dashStyle([5,5])
		            /*dc.lineChart(lineChart)
		                .dimension(hours)
		                .colors(colorEqu[nEquipos[2]])
		                .group(group2x3, nEquipos[2]),
		            dc.lineChart(lineChart)
		                .dimension(hours)
		                .colors(colorEqu[nEquipos[3]])
		                .group(group2x4, nEquipos[3])*/
	            ])
		        .mouseZoomable(true)
		        .rangeChart(volumeChart)
		        .elasticY(true)
		        //.x(d3.time.scale().domain([new Date(2015, 08, 1), new Date(2015, 08, 15)]))
		        .x(d3.time.scale().domain([dateFormat.parse(mindate), dateFormat.parse(maxdate)]))
		        .round(d3.time.minute.round)
		        .xUnits(d3.time.minutes)
		        .legend(dc.legend().x(60).y(35).itemHeight(13).gap(5))
        		.brushOn(false)		        
		        .renderHorizontalGridLines(true);

		    /* dc.barChart('#monthly-volume-chart', 'chartGroup'); */
		    volumeChart.width(wid_chart)
		        .height(60)
		        .margins({top: 0, right: 50, bottom: 20, left: 40})
		        .dimension(hours)
		        .group(totalByHour)
		        .centerBar(true)
		        .gap(1)
		        //.x(d3.time.scale().domain([new Date(1985, 0, 1), new Date(2012, 11, 31)]))
		        .x(d3.time.scale().domain([dateFormat.parse(mindate), dateFormat.parse(maxdate)]))
		        .round(d3.time.minute.round)
		        .alwaysUseRounding(true)
		        .xUnits(d3.time.minutes);
		    volumeChart.yAxis().ticks(0);//*/

		    mapaChart
		    	.width(600)
		  		.height(400)
		    	.dimension(points)
				.group(pointsGroup)
				.center([9.87,-68.81])
				.zoom(7)
				//.cluster(true)
				.filterByArea(true);  

			var wid_eqchart = parseInt(d3.select('#rowChart').style('width'));
			rowChart.width(wid_eqchart-50)
		        .height(250)
		        .margins({top: 20, left: 0, right: 5, bottom: 20})
		        .elasticX(true)
		        .dimension(tipo)
		        .group(tipoGroup)
		        .label(function (d) {
		        	var sp = d.key.split(' ')
		        	if(sp.length > 2){
		            	return sp[1]+' '+sp[2];
		        	}else{
		            	return sp[1];
		        	}
		        })
		        .ordinalColors([ "#dd4b39", "#00a65a", "#f39c12","#00c0ef"]);

		    // 861001000767554:'#00c0ef', blue
	    	// 	861001000767885:'#dd4b39', red 
	    	// 	861001000781654:'#00a65a', orange
	    	// 	861001000767158:'#f39c12' green

		    dc.renderAll();

		});
    }

    function graficar(){
     /*
     * Graficar data obtenida
     */
    }