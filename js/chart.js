Node.prototype.sproutChart = function(options) {
    var target = this;
    options = Array.isArray(options) ? {
        data: options
    } : options || {};

    var data = options.data || [
            {name: 'Kevin', value: 8},
            {name: 'Bob', value: 8},
            {name: 'Stuart', value: 3},
            {name: 'Gru', value: 5}
        ],
        size = options.size || 360, // svg container size, idealy equals to twice of rHover + max(spaceHover, spaceActive)
        duration = options.duration || 1000, // transition duration of the first time draw the pie chart
        materialColor = [
            '#f44336', ' #e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722', '#795548', '#9e9e9e', '#607d8b'
        ];

    var ri = Math.floor(Math.random() * materialColor.length);
    materialColor = materialColor.slice(ri).concat(materialColor.slice(0, ri));

    // create the svg container
    var svg = d3.select(target)
        .append('svg')
        .attr('width', size)
        .attr('height', size)
        .append('g');


    // create pie chart
    var pieChart = function(options) {
        options = options || {};

        var r = options.r || 150, // radius of pie chart
            innerRadius = options.innerRadius || 0, // the radius of the donut pie inner space
            rHover = options.rHover || 160, // radius of pie chart when hover
            spaceHover = options.spaceHover || 10, // the space pie pop out when hover
            spaceActive = options.spaceActive || 20; // the space pie pop out when active

        // function to draw arc
        var drawArc = function(startAngle, endAngle, outerRadius) {
            return d3.svg.arc()
                .startAngle(startAngle)
                .endAngle(endAngle)
                .innerRadius(innerRadius)
                .outerRadius(outerRadius || r);
        };

        // map data to arc function
        var sum = data.map(function(d) {
            return d.value;
        }).reduce(function(prev, cur) {
            return prev + cur;
        });
        var accumulate = 0;
        data = data.map(function(d, i) {
            return {
                name: d.name,
                value: d.value,
                color: d.color || materialColor[i],
                arc: drawArc(accumulate, accumulate += d.value / sum * 2 * Math.PI)
            };
        });

        // place the svg container
        svg.attr('transform', 'translate(' + size / 2 + ', ' + size / 2 + ')');

        // draw for each pie
        var pie = svg.selectAll('path')
            .data(data)
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

                svg.select('text.percent')
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

            var nameText = svg.select('text')
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

            svg.select('rect')
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

                svg.select('text.percent').transition()
                    .duration(500).ease('cubic-out')
                    .attr('opacity', 0);
            }

            svg.select('rect').style('display', 'none');
            svg.select('text').text('');
        });

        // start transition animation clip path
        var clipPath = svg.append('defs').append('clipPath')
            .attr('id', 'clipMask')
            .append('path');

        var transitionForward = function() {
            clipPath.transition().duration(duration).ease('cubic-out')
                .attrTween('d', function() {
                    return function(t) {
                        return drawArc(0, t * 2 * Math.PI, rHover)();
                    };
                });

            return this;
        };

        var transitionBack = function() {
            clipPath.transition().duration(duration).ease('cubic-out')
                .attrTween('d', function() {
                    return function(t) {
                        return drawArc(0, (1-t) * 2 * Math.PI, rHover)();
                    };
                });

            return this;
        };

        // hover text background
        var textWrapper = svg.append('rect')
            .style('fill', d3.rgb(0, 0, 0))
            .style('opacity', 0.7)
            .style('display', 'none');
        // hover text
        var nameText = svg.append('text')
            .attr('class', 'name')
            .style('fill', d3.rgb(255, 255, 255))
            .attr('font-family', 'Montserrat')
            .attr('text-anchor', 'middle');

        var percentText = svg.append('text')
            .attr('x', 0)
            .attr('y', 18)
            .attr('text-anchor', 'middle')
            .attr('font-size', 50)
            .attr('font-family', 'Montserrat')
            .attr('class', 'percent')
            .style('fill', d3.rgb(0, 0, 0));



        function init() {
            transitionForward();
        }

        init();

        return {
            forward: transitionForward,
            back: transitionBack
        };
    };


    var barChart = function(options) {
        options = options || {};

        var barHeight = options.barHeight || 30,
            gap = options.gap || 0,
            padding = options.padding || 50,
            max;

        data = data.map(function(d, i) {
            max = max ? (d.value > max ? d.value : max) : d.value;

            return {
                name: d.name,
                value: d.value,
                color: d.color || materialColor[i]
            };
        });

        var ratio = options.ratio || (size - padding * 2) / max;

        svg.attr('transform', function() {
            var y = (size - data.length * (barHeight + gap) - gap) / 2;

            return 'translate(' + padding + ', ' + y + ')';
        });

        var bar = svg.selectAll('rect')
            .data(data)
            .enter().append('rect')
            .attr('x', 0)
            .attr('y', function(d, i) {
                return i * (barHeight + gap);
            })
            .attr('height', barHeight)
            .style('fill', function(d) {
                return d.color;
            });

        var transitionForward = function() {
            bar.transition()
                .duration(duration / 2).ease('cubic-out')
                .delay(function(d, i) {
                    return i * (duration / 2 / data.length);
                })
                .attrTween('width', function(d) {
                    var i = d3.interpolate(0, d.value * ratio);
                    return function(t) {
                        return i(t);
                    };
                });
        };

        var transitionBack = function() {
            bar.transition()
                .duration(duration / 2).ease('cubic-out')
                .delay(function(d, i) {
                    return (data.length - i - 1) * (duration / 2 / data.length);
                })
                .attrTween('width', function(d) {
                    var i = d3.interpolate(d.value * ratio, 0);
                    return function(t) {
                        return i(t);
                    };
                });
        };

        function init() {
            transitionForward();
        }

        init();

        return {
            forward: transitionForward,
            back: transitionBack
        };

    };


    return {
        pie: pieChart,
        bar: barChart
    };

};

// inject to target DOM
var pie = document.getElementById('pie').sproutChart([
    {name: '1', value: 10},
    {name: '2', value: 13},
    {name: '3', value: 1},
    {name: '34', value: 12},
    {name: '4', value: 8},
    {name: '5', value: 9}
]).bar({
    gap: 0,
});
