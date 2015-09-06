
function SproutChart(target, options) {
    "use strict";

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
    sc.easing = options.easing || 'cubic-in-out'; // transition easing function, same as d3 easing
    sc.materialColor = [
        '#f44336', ' #e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722', '#795548', '#9e9e9e', '#607d8b'
    ];
    sc.legendCircleSize = options.legendCircleSize || 5;
    sc.active = 0;

    var ri = Math.floor(Math.random() * sc.materialColor.length);
    sc.materialColor = sc.materialColor.slice(ri).concat(sc.materialColor.slice(0, ri));

    // map random color to data
    sc.data = sc.data.map(function(d, i) {
        return {
            name: d.name,
            value: d.value,
            color: d.color || sc.materialColor[i]
        };
    });

    // create the svg container
    sc.svg = d3.select(target)
        .append('svg')
        .attr('width', this.size)
        .attr('height', this.size);

    sc.legend = sc.svg.append('g')
        .attr('class', 'legend')
        .style('opacity', 1);

    sc.legendBackground = sc.legend.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('stroke', '#EEE')
        .style('fill', d3.rgb(255, 255, 255))
        .style('opacity', 0.7);

    sc.legendCircle = sc.legend.selectAll('circle')
        .data(sc.data).enter()
        .append('circle')
        .attr('cx', sc.legendCircleSize)
        .attr('cy', function(d, i) {
            return i * (sc.legendCircleSize * 2.5);
        })
        .attr('r', sc.legendCircleSize)
        .style('fill', function(d) {
            return d.color;
        });

    sc.legendText = sc.legend.selectAll('text')
        .data(sc.data).enter()
        .append('text')
        .attr('class', 'legendText')
        .style('fill', d3.rgb(0, 0, 0))
        .attr('font-size', sc.legendCircleSize)
        .attr('font-family', 'Montserrat')
        .attr('text-anchor', 'start')
        .text(function(d) {
            return d.name;
        })
        .attr('x', sc.legendCircleSize * 2.5)
        .attr('y', function(d, i) {
            return i * (sc.legendCircleSize * 2.5) + sc.legendCircleSize / 2;
        });

    var maxWidth = sc.legendText[0].map(function(t) {
        return t.getBBox().width + t.getBBox().x;
    }).reduce(function(prev, cur) {
        return cur > prev ? cur : prev;
    });
    sc.legend.attr('transform', 'translate(' + (sc.size - maxWidth - 10) + ', ' + (sc.size - sc.data.length * (sc.legendCircleSize * 2.5) - 10) + ')');


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
        spaceHover = options.spaceHover !== undefined ? options.spaceHover : 10, // the space pie pop out when hover
        spaceActive = options.spaceActive || 20, // the space pie pop out when active
        showOnStart = options.showOnStart !== undefined ? options.showOnStart : true; // call transitionForward() on start


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


    var g = sc.svg.append('g')
        .attr('class', 'pie');

    // place the svg container
    g.attr('transform', 'translate(' + sc.size / 2 + ', ' + sc.size / 2 + ')');

    // draw for each pie
    var pie = g.selectAll('path')
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
        if (!sc.active) {
            d3.select(this)
                .transition().duration(200).ease(sc.easing)
                .attr('d', function() {
                    return drawArc(d.arc.startAngle()(), d.arc.endAngle()(), rHover)();
                })
                .attr('transform', function(d) {
                    var distance = Math.sqrt(Math.pow(d.arc.centroid()[0], 2) + Math.pow(d.arc.centroid()[1], 2));
                    var n = spaceHover / distance;

                    return 'translate(' + n * d.arc.centroid()[0] + ',' + n * d.arc.centroid()[1] + ')';
                });

            g.select('text.percent')
                .transition().duration(500)
                .ease(sc.easing)
                .attr('opacity', 1)
                .tween('text', function() {
                    var i = d3.interpolate(0, Math.round((d.arc.endAngle()() - d.arc.startAngle()()) / 2 / Math.PI * 100));
                    return function(t) {
                        this.textContent = Math.round(i(t)) + "%";
                    };
                });
        }

    });

    pie.on('click', function(d, i) {
        if (sc.active) {
            d3.select(pie[0][sc.active - 1])
                .transition().duration(200).ease('bounce')
                .attr('d', function(d) {
                    return drawArc(d.arc.startAngle()(), d.arc.endAngle()(), r)();
                })
                .attr('transform', 'translate(0, 0)');

            percentText.transition()
                .duration(200).ease(sc.easing)
                .attr('opacity', 0)
                .attr('y', 18);

            percentName.transition()
                .duration(200).ease(sc.easing)
                .attr('opacity', 0);

            if (i + 1 !== sc.active) {
                sc.data[sc.active - 1].active = false;
            }
        }

        if (i + 1 !== sc.active) {
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

            g.select('text.percent')
                .transition().duration(200)
                .ease(sc.easing)
                .attr('opacity', 1)
                .attr('y', 30)
                .tween('text', function() {
                    var i = d3.interpolate(0, Math.round((d.arc.endAngle()() - d.arc.startAngle()()) / 2 / Math.PI * 100));
                    return function(t) {
                        this.textContent = Math.round(i(t)) + "%";
                    };
                });

            percentName.transition()
                .duration(200).ease(sc.easing)
                .attr('opacity', 1)
                .text(d.name);
        }

        d.active = !d.active;
        sc.active = d.active && i + 1;
    });

    pie.on('mousemove', function(d) {

        var nameText = g.select('text')
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

        g.select('rect')
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
        if (!sc.active) {
            d3.select(this)
                .transition().duration(200).ease(sc.easing)
                .attr('d', function() {
                    return drawArc(d.arc.startAngle()(), d.arc.endAngle()())();
                })
                .attr('transform', 'translate(0, 0)');

            g.select('text.percent').transition()
                .duration(500).ease(sc.easing)
                .attr('opacity', 0);

            percentName.transition()
                .duration(200).ease(sc.easing)
                .attr('opacity', 0);
        }

        g.select('rect').style('display', 'none');
        g.select('text').text('');
    });

    // start transition animation clip path
    var clipPath = g.append('defs').append('clipPath')
        .attr('id', 'clipMask')
        .append('path')
        .attr('d', function() {
            return drawArc(0, 10 / r, rHover)();
        });

    // hover text background
    var textWrapper = g.append('rect')
        .style('fill', d3.rgb(0, 0, 0))
        .style('opacity', 0.7)
        .style('display', 'none');
    // hover text
    var nameText = g.append('text')
        .attr('class', 'name')
        .style('fill', d3.rgb(255, 255, 255))
        .attr('font-family', 'Montserrat')
        .attr('text-anchor', 'middle');

    var percentText = g.append('text')
        .attr('x', 0)
        .attr('y', 18)
        .attr('text-anchor', 'middle')
        .attr('font-size', 50)
        .attr('font-family', 'Montserrat')
        .attr('class', 'percent')
        .style('fill', d3.rgb(0, 0, 0));

    var percentName = g.append('text')
        .attr('x', 0)
        .attr('y', -30)
        .attr('text-anchor', 'middle')
        .attr('font-size', 20)
        .attr('font-family', 'Montserrat')
        .attr('class', 'percentName')
        .style('fill', d3.rgb(0, 0, 0))
        .attr('opacity', 0);

    sc.transitionBack = function(callback, options) {
        clipPath.transition().duration(sc.duration).ease(sc.easing)
            .attrTween('d', function() {
                var i = d3.interpolate(2 * Math.PI, 10 / r);

                return function(t) {
                    return drawArc(0, i(t), rHover)();
                };
            })
            .each('end', callback);

        return sc;
    };

    sc.transitionForward = function(callback) {
        clipPath.transition().duration(sc.duration).ease(sc.easing)
            .attrTween('d', function() {
                var i = d3.interpolate(10 / r, 2 * Math.PI);

                return function(t) {
                    return drawArc(0, i(t), rHover)();
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
        showOnStart = options.showOnStart !== undefined ? options.showOnStart : true , // call transitionForward() on start
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

    // create the svg container
    var g = sc.svg.append('g')
        .attr('class', 'bar');

    g.attr('transform', function() {
        var y = (sc.size - sc.data.length * (barHeight + gap) - gap) / 2;

        return 'translate(' + padding + ', ' + y + ')';
    });

    var bar = g.selectAll('rect')
        .data(sc.data)
        .enter().append('rect')
        .attr('x', 0)
        .attr('y', function(d, i) {
            return i * (barHeight + gap);
        })
        .attr('height', barHeight)
        .attr('width', 10)
        .style('fill', function(d) {
            return d.color;
        })
        .style('clip-path', 'url(#clipMask)');

    var barValue = g.selectAll('text')
        .data(sc.data)
        .enter().append('text')
        .attr('class', 'bar-value')
        .attr('x', 0)
        .attr('y', function(d, i) {
            return i * (barHeight + gap) + barHeight * 0.7;
        })
        .attr('opacity', 0)
        .attr('font-size', barHeight * 0.7)
        .attr('font-family', 'Montserrat')
        .attr('text-anchor', 'start');

    bar.on('mousemove', function(d) {
        var nameText = g.select('text.name')
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

        g.select('rect.nameBackground')
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

    bar.on('mouseout', function(d) {
        g.select('rect.nameBackground').style('display', 'none');
        g.select('text.name').text('');
    });

    sc.transitionForward = function(callback) {
        bar.transition()
            .duration(sc.duration / 2).ease(sc.easing)
            .delay(function(d, i) {
                return i * (sc.duration / 2 / sc.data.length);
            })
            .attr('width', function(d) {
                return d.value * ratio;
            })
            .each('end', function(d, i) {
                if (i === sc.data.length - 1 && typeof(callback) === 'function')
                    callback();
            });

        barValue.transition()
            .duration(sc.duration / 2).ease(sc.easing)
            .delay(function(d, i) {
                return i * (sc.duration / 2 / sc.data.length);
            })
            .attr('x', function(d) {
                return d.value * ratio + barHeight * 0.3;
            })
            .attr('opacity', 1)
            .tween('text', function(d) {
                var i = d3.interpolate(0, d.value);

                return function(t) {
                    this.textContent = Math.round(i(t));
                };
            });

        clipPath.transition().duration(sc.duration * (sc.data.length - 1) / sc.data.length).ease(sc.easing)
            .attr('height', sc.size);

        return sc;
    };

    sc.transitionBack = function(callback) {
        bar.transition()
            .duration(sc.duration / 2).ease(sc.easing)
            .delay(function(d, i) {
                return (sc.data.length - i - 1) * (sc.duration / 2 / sc.data.length);
            })
            .attr('width', 10)
            .each('end', function(d, i) {
                if (i === 0 && typeof(callback) === 'function')
                    callback();
            });

        barValue.transition()
            .duration(sc.duration / 2).ease(sc.easing)
            .delay(function(d, i) {
                return (sc.data.length - i - 1) * (sc.duration / 2 / sc.data.length);
            })
            .attr('x', barHeight * 0.3)
            .attr('opacity', 0)
            .tween('text', function(d) {
                var i = d3.interpolate(d.value, 0);

                return function(t) {
                    this.textContent = Math.round(i(t));
                };
            });

        clipPath.transition().duration(sc.duration * (sc.data.length - 1) / sc.data.length).ease(sc.easing)
            .attr('height', barHeight);

        return sc;
    };

    var clipPath = g.append('defs').append('clipPath')
        .attr('id', 'clipMask')
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('height', barHeight)
        .attr('width', sc.size);

    // hover text background
    var textWrapper = g.append('rect')
        .attr('class', 'nameBackground')
        .style('fill', d3.rgb(0, 0, 0))
        .style('opacity', 0.7)
        .style('display', 'none');
    // hover text
    var nameText = g.append('text')
        .attr('class', 'name')
        .style('fill', d3.rgb(255, 255, 255))
        .attr('font-family', 'Montserrat')
        .attr('text-anchor', 'middle');

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

    sc.transitionBack();

    sc.svg.select('g:not(.legend)').transition()
        .duration(sc.duration).ease(sc.easing)
        .attr('transform', function(d) {
            var barHeight = options.barHeight || 30,
                gap = options.gap || 0,
                padding = options.padding || 50,
                r = options.r || 150;

            var y = (sc.size - sc.data.length * (barHeight + gap) - gap) / 2;

            if (type === 'bar')
                return 'translate(' + padding + ', ' + (r + y) + ')';
            else if (type === 'pie')
                return 'translate(' + sc.size / 2 + ', ' + (sc.size / 2 - r) + ')';
        })
        .each('end', function() {
            if (type === 'bar') {
                sc.barChart(options);
                sc.svg.select('g:not(.bar):not(.legend)').remove();
            }
            else if (type === 'pie') {
                sc.pieChart(options);
                sc.svg.select('g:not(.pie):not(.legend)').remove();
            }

        });

    if (typeof(callback) === 'function') {
        callback();
    }

    return sc;
};
