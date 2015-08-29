

(function() {


    "use strict";


    function SproutChart(target, options) {
        var sc = this;

        options = Array.isArray(options) ? {
            data: options
        } : options || {};

        sc.data = options.data || [
                {name: 'Kevin', value: 8},
                {name: 'Bob', value: 8},
                {name: 'Stuart', value: 3},
                {name: 'Gru', value: 5}
            ];
        sc.size = options.size || 360; // svg container size, idealy equals to twice of rHover + max(spaceHover, spaceActive)
        sc.duration = options.duration || 1000; // transition duration of the first time draw the pie chart
        sc.materialColor = [
            '#f44336', ' #e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722', '#795548', '#9e9e9e', '#607d8b'
        ];

        var ri = Math.floor(Math.random() * sc.materialColor.length);
        sc.materialColor = sc.materialColor.slice(ri).concat(sc.materialColor.slice(0, ri));

        // create the svg container
        sc.svg = d3.select(target)
            .append('svg')
            .attr('width', this.size)
            .attr('height', this.size)
            .append('g');

        return sc;
    }

    // create pie chart
    SproutChart.prototype.pieChart = function(options) {
        var sc = this;
        sc.type = 'pie';

        options = options || {};

        var r = options.r || 150, // radius of pie chart
            innerRadius = options.innerRadius || 80, // the radius of the donut pie inner space
            rHover = options.rHover || 160, // radius of pie chart when hover
            spaceHover = options.spaceHover || 10, // the space pie pop out when hover
            spaceActive = options.spaceActive || 20, // the space pie pop out when active
            showOnStart = options.showOnStart || true; // call transitionForward() on start


        // function to draw arc
        var drawArc = function(startAngle, endAngle, outerRadius) {
            return d3.svg.arc()
                .startAngle(startAngle)
                .endAngle(endAngle)
                .innerRadius(innerRadius)
                .outerRadius(outerRadius || r);
        };

        // map data to arc function
        var sum = sc.data.map(function(d) {
            return d.value;
        }).reduce(function(prev, cur) {
            return prev + cur;
        });
        var accumulate = 0;
        sc.data = sc.data.map(function(d, i) {
            return {
                name: d.name,
                value: d.value,
                color: d.color || sc.materialColor[i],
                arc: drawArc(accumulate, accumulate += d.value / sum * 2 * Math.PI)
            };
        });

        // place the svg container
        sc.svg.attr('transform', 'translate(' + sc.size / 2 + ', ' + sc.size / 2 + ')');

        // draw for each pie
        var pie = sc.svg.selectAll('path')
            .data(sc.data)
            .enter().append('path')
            .style('fill', function(d) {
                return d.color;
            })
            .attr('d', function(d) {
                return drawArc(d.arc.startAngle()(), d.arc.endAngle()())();
            })
            .style('clip-path', 'url(#clipMask)');

        pie.on('mouseover', function(d) {
            if (!d.active) {
                d3.select(this)
                    .transition().duration(200).ease('cubic-out')
                    .attr('d', function() {
                        return drawArc(d.arc.startAngle()(), d.arc.endAngle()(), rHover)();
                    })
                    .attr('transform', function(d) {
                        var distance = Math.sqrt(Math.pow(d.arc.centroid()[0], 2) + Math.pow(d.arc.centroid()[1], 2));
                        var n = spaceHover / distance;

                        return 'translate(' + n * d.arc.centroid()[0] + ',' + n * d.arc.centroid()[1] + ')';
                    });

                sc.svg.select('text.percent')
                    .transition().duration(500)
                    .ease('cubic-out')
                    .attr('opacity', 1)
                    .tween('text', function() {
                        var i = d3.interpolate(0, Math.round((d.arc.endAngle()() - d.arc.startAngle()()) / 2 / Math.PI * 100));
                        return function(t) {
                            this.textContent = Math.round(i(t)) + "%";
                        };
                    });
            }

        });

        pie.on('click', function(d) {

            if (!d.active) {
                d3.select(this)
                    .transition().duration(200).ease('bounce')
                    .attr('d', function() {
                        return drawArc(d.arc.startAngle()(), d.arc.endAngle()(), rHover)();
                    })
                    .attr('transform', function(d) {
                        var distance = Math.sqrt(Math.pow(d.arc.centroid()[0], 2) + Math.pow(d.arc.centroid()[1], 2));
                        var n = spaceActive / distance;

                        return 'translate(' + n * d.arc.centroid()[0] + ',' + n * d.arc.centroid()[1] + ')';
                    });
            }

            d.active = !d.active;
        });

        pie.on('mousemove', function(d) {

            var nameText = sc.svg.select('text')
                .attr('x', function() {
                    return d3.mouse(this)[0] + 10;
                })
                .attr('y', function() {
                    return d3.mouse(this)[1] + 30;
                })
                .style('fill', d3.rgb(255, 255, 255))
                .text(function() {
                    return d.name;
                })
                .attr('height', function() {
                    return this.getBBox().height;
                })
                .attr('width', function() {
                    return this.getBBox().width;
                });

            sc.svg.select('rect')
                .style('display', 'block')
                .attr('width', function() {
                    return parseFloat(nameText.attr('width'), 10) + 10;
                })
                .attr('height', nameText.attr('height'))
                .attr('x', function() {
                    return d3.mouse(this)[0] + 5 - nameText.attr('width') / 2;
                })
                .attr('y', function() {
                    return d3.mouse(this)[1] + 13;
                });

        });

        pie.on('mouseout', function(d) {
            if (!d.active) {
                d3.select(this)
                    .transition().duration(200).ease('cubic-out')
                    .attr('d', function() {
                        return drawArc(d.arc.startAngle()(), d.arc.endAngle()())();
                    })
                    .attr('transform', 'translate(0, 0)');

                sc.svg.select('text.percent').transition()
                    .duration(500).ease('cubic-out')
                    .attr('opacity', 0);
            }

            sc.svg.select('rect').style('display', 'none');
            sc.svg.select('text').text('');
        });

        // start transition animation clip path
        var clipPath = sc.svg.append('defs').append('clipPath')
            .attr('id', 'clipMask')
            .append('path');

        // hover text background
        var textWrapper = sc.svg.append('rect')
            .style('fill', d3.rgb(0, 0, 0))
            .style('opacity', 0.7)
            .style('display', 'none');
        // hover text
        var nameText = sc.svg.append('text')
            .attr('class', 'name')
            .style('fill', d3.rgb(255, 255, 255))
            .attr('font-family', 'Montserrat')
            .attr('text-anchor', 'middle');

        var percentText = sc.svg.append('text')
            .attr('x', 0)
            .attr('y', 18)
            .attr('text-anchor', 'middle')
            .attr('font-size', 50)
            .attr('font-family', 'Montserrat')
            .attr('class', 'percent')
            .style('fill', d3.rgb(0, 0, 0));

        sc.transitionBack = function(callback) {
            clipPath.transition().duration(sc.duration).ease('cubic-out')
                .attrTween('d', function() {
                    return function(t) {
                        return drawArc(0, (1-t) * 2 * Math.PI, rHover)();
                    };
                })
                .each('end', callback);

            return sc;
        };

        sc.transitionForward = function(callback) {
            clipPath.transition().duration(sc.duration).ease('cubic-out')
                .attrTween('d', function() {
                    return function(t) {
                        return drawArc(0, t * 2 * Math.PI, rHover)();
                    };
                })
                .each('end', callback);

            return sc;
        };

        if (showOnStart)
            sc.transitionForward();

        return sc;
    };



    // create bar chart
    SproutChart.prototype.barChart = function(options) {
        var sc = this;

        sc.type = 'bar';

        options = options || {};

        var barHeight = options.barHeight || 30,
            gap = options.gap || 0,
            padding = options.padding || 50,
            showOnStart = options.showOnStart || true, // call transitionForward() on start
            max;


        sc.data = sc.data.map(function(d, i) {
            max = max ? (d.value > max ? d.value : max) : d.value;

            return {
                name: d.name,
                value: d.value,
                color: d.color || sc.materialColor[i]
            };
        });

        var ratio = options.ratio || (sc.size - padding * 2) / max;

        sc.svg.attr('transform', function() {
            var y = (sc.size - sc.data.length * (barHeight + gap) - gap) / 2;

            return 'translate(' + padding + ', ' + y + ')';
        });

        var bar = sc.svg.selectAll('rect')
            .data(sc.data)
            .enter().append('rect')
            .attr('x', 0)
            .attr('y', function(d, i) {
                return i * (barHeight + gap);
            })
            .attr('height', barHeight)
            .style('fill', function(d) {
                return d.color;
            });

        sc.transitionForward = function(callback) {
            bar.transition()
                .duration(sc.duration / 2).ease('cubic-out')
                .delay(function(d, i) {
                    return i * (sc.duration / 2 / sc.data.length);
                })
                .attrTween('width', function(d) {
                    var i = d3.interpolate(0, d.value * ratio);
                    return function(t) {
                        return i(t);
                    };
                })
                .each('end', function(d, i) {
                    if (i === sc.data.length - 1)
                        callback();
                });

            return sc;
        };

        sc.transitionBack = function(callback) {
            bar.transition()
                .duration(sc.duration / 2).ease('cubic-out')
                .delay(function(d, i) {
                    return (sc.data.length - i - 1) * (sc.duration / 2 / sc.data.length);
                })
                .attrTween('width', function(d) {
                    var i = d3.interpolate(d.value * ratio, 0);
                    return function(t) {
                        return i(t);
                    };
                })
                .each('end', function(d, i) {
                    if (i === 0)
                        callback();
                });

            return sc;
        };

        if (showOnStart)
            sc.transitionForward();

        return sc;
    };

    SproutChart.prototype.transformTo = function(type, options, callback) {
        var sc = this;

        callback = typeof(options) === 'function' ? options : callback;
        options = typeof(options) === 'object' ? options : {};

        if (sc.type === type || !sc.type) {
            return sc;
        }

        sc.transitionBack(function() {
            sc.svg.selectAll('*').remove();

            if (type === 'bar')
                sc.barChart(options);
            else if (type === 'pie')
                sc.pieChart(options);
        });

        if (typeof(callback) === 'function') {
            callback();
        }

        return sc;
    };



    // inject to target DOM
    var chart = new SproutChart(document.getElementById('pie'), [
        {name: '1', value: 10},
        {name: '2', value: 13},
        {name: '3', value: 1},
        {name: '34', value: 12},
        {name: '4', value: 8},
        {name: '5', value: 9}
    ]);
    chart.pieChart();



})();
