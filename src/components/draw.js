import { splitPoints, getPieDataPoints, calYAxisData, getXAxisPoints, getDataPoints, fixColumeData, calLegendData } from './charts-data'
import { measureText, calRotateTranslate } from './charts-util'
import Util, {convertHex} from '../util/util'
import { drawPointAtIndex, drawPointShape } from './draw-data-shape'
import { drawPointText, drawPieText, drawRingTitle } from './draw-data-text'

function drawYAxisTitle (title, opts, config, context) {
    let startX = config.xAxisHeight + (opts.height - config.xAxisHeight - measureText(title)) / 2;
    context.save();
    context.beginPath();
    context.setFontSize(config.fontSize);
    context.setFillStyle(opts.yAxis.titleFontColor || '#333333');
    context.translate(0, opts.height);
    context.rotate(-90 * Math.PI / 180);
    context.fillText(title, startX, config.paddingLeft + 0.5 * config.fontSize);
    context.stroke();
    context.closePath();
    context.restore();
}

export function drawColumnDataPoints (series, opts, config, context, process = 1) {
    let { ranges } = calYAxisData(series, opts, config);
    let { xAxisPoints, eachSpacing } = getXAxisPoints(opts.categories, opts, config);
    let minRange = ranges.pop();
    let maxRange = ranges.shift();
    let endY = opts.height - config.paddingBottom - config.xAxisHeight - config.legendHeight;

    series.forEach(function(eachSeries, seriesIndex) {
        let data = eachSeries.data;
        let points = getDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config, process);
        let customColor = false;
        points = fixColumeData(points, eachSpacing, series.length, seriesIndex, config);

        if(eachSeries.customColors && eachSeries.customColors.length > 0) {
            customColor = true;
        }

        // 绘制柱状数据图
        points.forEach(function(item, index) {
            context.beginPath();

            const currentColor = customColor? (eachSeries.customColors[index] || eachSeries.color) : eachSeries.color;
            context.setFillStyle(currentColor);

            if (item !== null) {
                let startX = item.x - item.width / 2 + 1;
                let height = opts.height - item.y - config.paddingBottom - config.xAxisHeight - config.legendHeight;
                context.moveTo(startX, item.y);
                context.rect(startX, item.y, item.width, height);
            }

            context.closePath();
            context.fill();
        });

    });
    series.forEach(function(eachSeries, seriesIndex) {
        let data = eachSeries.data;
        let points = getDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config, process);
        points = fixColumeData(points, eachSpacing, series.length, seriesIndex, config);
        if (opts.dataLabel !== false && process === 1) {
            drawPointText(points, eachSeries, config, context);
        }
    });

    return xAxisPoints;
}

export function drawAreaDataPoints (series, opts, config, context, process = 1) {
    let { ranges } = calYAxisData(series, opts, config);
    let { xAxisPoints, eachSpacing } = getXAxisPoints(opts.categories, opts, config);
    let minRange = ranges.pop();
    let maxRange = ranges.shift();
    let endY = opts.height - config.paddingBottom - config.xAxisHeight - config.legendHeight;
    const me = this;

    series.forEach(function(eachSeries, seriesIndex) {
        let data = eachSeries.data;
        let points = getDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config, process);
        me.chartData.seriesData[seriesIndex] = {
            points: points
        };

        let splitPointList = splitPoints(points);

        splitPointList.forEach((points) => {
            // 绘制区域数据
            context.beginPath();
            context.setStrokeStyle(eachSeries.color);
            context.setFillStyle(convertHex(eachSeries.color, eachSeries.opacity || 20));
            context.setLineWidth(2);
            console.log(points)
            if (points.length > 1) {
                let firstPoint = points[0];
                let lastPoint = points[points.length - 1];
                
                context.moveTo(firstPoint.x, firstPoint.y);
                points.forEach(function(item, index) {
                    if (index > 0) {
                        context.lineTo(item.x, item.y);
                    }
                });

                context.lineTo(lastPoint.x, endY);
                context.lineTo(firstPoint.x, endY);
                context.lineTo(firstPoint.x, firstPoint.y);
            } else {
                let item = points[0];
                context.moveTo(item.x - eachSpacing / 2, item.y);
                context.lineTo(item.x + eachSpacing / 2, item.y);
                context.lineTo(item.x + eachSpacing / 2, endY);
                context.lineTo(item.x - eachSpacing / 2, endY);
                context.moveTo(item.x - eachSpacing / 2, item.y);
            }
            context.closePath();
            context.fill();

            if(opts.showAreaBorder) {

                context.beginPath();
                context.setStrokeStyle(eachSeries.color);
                context.setLineWidth(2);

                if (points.length > 1) {
                    let firstPoint = points[0];

                    context.moveTo(firstPoint.x, firstPoint.y);
                    points.forEach(function(item, index) {
                        if (index > 0) {
                            context.lineTo(item.x, item.y);
                        }
                    });

                    context.stroke();
                }
            }

        });

        if (opts.dataPointShape !== false) {          
            let shape = config.dataPointShape[seriesIndex % config.dataPointShape.length];
            drawPointShape(points, eachSeries.color, shape, context);
        } else if(eachSeries.showPointAtIndex) {
            let dataPointShape;
            //在某个坐标显示点
            if(eachSeries.dataPointShape) {
                dataPointShape = eachSeries.dataPointShape;
            } else {
                dataPointShape = config.dataPointShape[seriesIndex % config.dataPointShape.length];
            }

            drawPointAtIndex(points[eachSeries.showPointAtIndex], eachSeries.color, dataPointShape, context, opts);
        }
    });
    if (opts.dataLabel !== false && process === 1) {
        series.forEach(function(eachSeries, seriesIndex) {
            let data = eachSeries.data;
            let points = getDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config, process);
            drawPointText(points, eachSeries, config, context);
        });
    }

    return xAxisPoints;
}

export function drawTrendDataPoints (series, opts, config, context, process = 1) {
    let { ranges } = calYAxisData(series, opts, config);
    let { xAxisPoints, eachSpacing } = getXAxisPoints(opts.categories, opts, config);
    let minRange = ranges.pop();
    let maxRange = ranges.shift();
    let areaPoints = [];
    const me = this;
    const categoryLength = series[1].data.length;

    series.forEach(function(eachSeries, seriesIndex) {
        let data = eachSeries.data;
        let points = getDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config, process);
        let splitPointList = splitPoints(points);

        me.chartData.seriesData[seriesIndex] = {
            points: points
        };

    });

    splitPoints(me.chartData.seriesData[1].points).forEach(points => {
        context.beginPath();
        context.setStrokeStyle(opts.color);
        context.setLineWidth(2);
        context.moveTo(points[0].x, points[0].y);
        points.forEach(function(item, index) {
            if (index > 0) {
                context.lineTo(item.x, item.y);
            }
        });
        context.moveTo(points[0].x, points[0].y);
        context.closePath();
        context.stroke();
    });

    drawPointAtIndex(me.chartData.seriesData[1].points[categoryLength - 1], opts.color, "halo", context, opts);
    areaPoints = me.chartData.seriesData[0].points.concat(me.chartData.seriesData[2].points.reverse());
    context.beginPath();
    context.setFillStyle(convertHex(opts.color, 20));
    areaPoints.forEach(point => {
        context.lineTo(point.x, point.y);
    });

    context.closePath();
    context.fill();


    return xAxisPoints;
}

export function drawLineDataPoints (series, opts, config, context, process = 1) {
    let { ranges } = calYAxisData(series, opts, config);
    let { xAxisPoints, eachSpacing } = getXAxisPoints(opts.categories, opts, config);
    let minRange = ranges.pop();
    let maxRange = ranges.shift();
    const me = this;

    series.forEach(function(eachSeries, seriesIndex) {
        let data = eachSeries.data;
        let points = getDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config, process);
        let splitPointList = splitPoints(points);

        me.chartData.seriesData[seriesIndex] = {
            points: points
        };

        splitPointList.forEach((points, index) => {
            context.beginPath();
            context.setStrokeStyle(eachSeries.color);
            context.setLineWidth(2);
            if (points.length === 1) {
                context.moveTo(points[0].x, points[0].y);
                context.arc(points[0].x, points[0].y, 1, 0, 2 * Math.PI);
            } else {
                context.moveTo(points[0].x, points[0].y);
                points.forEach(function(item, index) {
                    if (index > 0) {
                        context.lineTo(item.x, item.y);
                    }
                });
                context.moveTo(points[0].x, points[0].y);
            }
            context.closePath();
            context.stroke();
        });

        if (opts.dataPointShape !== false) {
            let shape = config.dataPointShape[seriesIndex % config.dataPointShape.length];
            drawPointShape(points, eachSeries.color, shape, context);
        } else if(eachSeries.showPointAtIndex) {
            let dataPointShape;
            //在某个坐标显示点
            if(eachSeries.dataPointShape) {
                dataPointShape = eachSeries.dataPointShape;
            } else {
                dataPointShape = config.dataPointShape[seriesIndex % config.dataPointShape.length];
            }

            drawPointAtIndex(points[eachSeries.showPointAtIndex], eachSeries.color, dataPointShape, context, opts);
        }
    });
    if (opts.dataLabel !== false && process === 1) {
        series.forEach(function(eachSeries, seriesIndex) {
            let data = eachSeries.data;
            let points = getDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config, process);
            drawPointText(points, eachSeries, config, context);
        });
    }

    return xAxisPoints;
}

export function drawXAxis (categories, opts, config, context) {

    if(opts.xAxis.disabled) {
        return;
    }

    let { xAxisPoints, startX, endX, eachSpacing } = getXAxisPoints(categories, opts, config);
    let startY = opts.height - config.paddingBottom - config.xAxisHeight - config.legendHeight;
    let endY = startY + config.xAxisLineHeight;

    context.beginPath();

    if(opts.yAxis.disableGrid !== true) {
        context.setStrokeStyle(opts.xAxis.gridColor || "#cccccc");
        context.setLineWidth(1);
        context.moveTo(startX, startY);
        context.lineTo(endX, startY);
    }

    if (opts.xAxis.disableGrid !== true) {
        if (opts.xAxis.type === 'calibration') {
            xAxisPoints.forEach(function(item, index) {
                if (index > 0) {                
                    context.moveTo(item - eachSpacing / 2, startY);
                    context.lineTo(item - eachSpacing / 2, startY + 4);
                }
            });
        } else {
            xAxisPoints.forEach(function(item, index) {
                context.moveTo(item, startY);
                context.lineTo(item, endY);
            });
        }
    }
    context.closePath();
    context.stroke();

    // 对X轴列表做抽稀处理
    let validWidth = opts.width - config.paddingLeft - config.yAxisWidth - config.yAxisTitleWidth - opts.paddingRight;
    let maxXAxisListLength = opts.xAxis.splitNumber || Math.min(categories.length, Math.ceil(validWidth / config.fontSize / 1.5));
    let ratio = Math.ceil((categories.length - 2) / maxXAxisListLength) || 1;
    const categoryLength = categories.length;

    if(opts.xAxis.disabledSparsing) {
        config._xAxisTextAngle_ = 0;
    }

    if( opts.xAxis.splitNumber ) {
        categories = categories.map((item, index) => {
            if(index % ratio === 0 || index == categoryLength - 1) {
                return item;
            } else {
                return "";
            }
        });
    }

    if (config._xAxisTextAngle_ === 0) {
        context.beginPath();
        context.setFontSize(config.fontSize);
        context.setFillStyle(opts.xAxis.fontColor || '#666666');
        categories.forEach(function(item, index) {
            let offset = eachSpacing / 2 - measureText(item) / 2;
            context.fillText(item, xAxisPoints[index] + offset, startY + config.fontSize + ( ( opts.xAxis && opts.xAxis.labelMargin ) || config.xAxisLabelMargin));
        });
        context.closePath();
        context.stroke();
    } else {
        categories.forEach(function(item, index) {
            context.save();
            context.beginPath();
            context.setFontSize(config.fontSize);
            context.setFillStyle(opts.xAxis.fontColor || '#666666');
            let textWidth = measureText(item);
            let offset = eachSpacing / 2 - textWidth;
            let { transX, transY }  = calRotateTranslate(xAxisPoints[index] + eachSpacing / 2, startY + config.fontSize / 2 + 5, opts.height);
            context.rotate(-1 * config._xAxisTextAngle_);
            context.translate(transX, transY);
            context.fillText(item, xAxisPoints[index] + offset, startY + config.fontSize + 5);
            context.closePath();
            context.stroke();
            context.restore();
        });
    }
}

export function drawYAxis (series, opts, config, context) {
    if (opts.yAxis.disabled === true) {
        return;
    }
    let { rangesFormat } = calYAxisData(series, opts, config);
    let yAxisTotalWidth = config.yAxisWidth + config.yAxisTitleWidth;

    let spacingValid = opts.height - config.paddingTop - config.paddingBottom - config.xAxisHeight - config.legendHeight;
    let eachSpacing = Math.floor(spacingValid / config.yAxisSplit);
    let startX = config.paddingLeft + yAxisTotalWidth;
    let endX = opts.width - config.paddingRight;
    let startY = config.paddingTop;
    let endY = opts.height - config.paddingBottom - config.xAxisHeight - config.legendHeight;

    let points = [];
    for (let i = 0; i < config.yAxisSplit; i++) {
        points.push(config.padding + eachSpacing * i);
    }

    if(opts.yAxis.disableGrid !== true) {
        context.beginPath();
        context.setStrokeStyle(opts.yAxis.gridColor || "#cccccc")
        context.setLineWidth(1);
        points.forEach(function(item, index) {
            context.moveTo(startX, item);
            context.lineTo(endX, item);
        });
        context.closePath();
        context.stroke();
    }

    context.beginPath();
    context.setFontSize(config.fontSize);
    context.setFillStyle(opts.yAxis.fontColor || '#666666')
    rangesFormat.forEach(function(item, index) {
        let pos = points[index] ? points[index] : endY;
        context.fillText(item, config.paddingLeft + config.yAxisTitleWidth + config.yAxisLabelWidth - measureText(item), pos + config.fontSize / 2);
    });
    context.closePath();
    context.stroke();

    if (opts.yAxis.title) {  
        drawYAxisTitle(opts.yAxis.title, opts, config, context);
    }
}

export function drawLegend (series, opts, config, context) {
    if (!opts.legend) {
        return;
    }
    // each legend shape width 15px
    // the spacing between shape and text in each legend is the `padding`
    // each legend spacing is the `padding`
    // legend margin top `config.padding`
    let { legendList, legendHeight } = calLegendData(series, opts, config);
    let padding = 5;
    let marginTop = 8;
    let shapeWidth = 15;
    const shapeMargin = 20;
    const fontSize = opts.legendFontSize || config.fontSize;

    legendList.forEach((itemList, listIndex) => {
        let width = 0;
        itemList.forEach(function (item, itemIndex) {
            item.name = item.name || 'undefined';
            width += padding + measureText(item.name, fontSize) + shapeWidth + (itemIndex == 0 ? 0 : shapeMargin);
        });
        let startX = (opts.width - width) / 2;
        let startY = opts.height - config.paddingBottom - config.legendHeight + listIndex * (fontSize + marginTop) + padding + marginTop;

        context.setFontSize(fontSize);
        itemList.forEach(function (item) {

            if(opts.legendPointType) {
                switch(opts.legendPointType) {
                    case 'halo':
                        context.beginPath();

                        context.setStrokeStyle(convertHex(item.color, 50));
                        context.setLineWidth(4);
                        context.setFillStyle(item.color);
                        context.arc(startX + 6.5, startY + 4.5, 5, 0, 2 * Math.PI, false);
                        context.fill();
                        context.stroke();
                        context.closePath();
                        break;
                }
            } else {
                switch (opts.type) {
                    case 'line':
                        context.beginPath();
                        context.setLineWidth(1);
                        context.setStrokeStyle(item.color);
                        context.moveTo(startX - 2, startY + 5);
                        context.lineTo(startX + 17, startY + 5);
                        context.stroke();
                        context.closePath();
                        context.beginPath();
                        context.setLineWidth(1);
                        context.setStrokeStyle('#ffffff');
                        context.setFillStyle(item.color);
                        context.moveTo(startX + 7.5, startY + 5);
                        context.arc(startX + 7.5, startY + 5, 4, 0, 2 * Math.PI);
                        context.fill();
                        context.stroke();
                        context.closePath();
                        break;
                    case 'pie':
                    case 'ring':
                        context.beginPath();
                        context.setFillStyle(item.color);
                        context.moveTo(startX + 7.5, startY + 5);
                        context.arc(startX + 7.5, startY + 5, 7, 0, 2 * Math.PI);
                        context.closePath();
                        context.fill();
                        break;
                    default:
                        context.beginPath();
                        context.setFillStyle(item.color);
                        context.moveTo(startX, startY);
                        context.rect(startX, startY, 15, 10);
                        context.closePath();
                        context.fill();
                }
            }

            startX += padding + shapeWidth;
            context.beginPath();
            context.setFillStyle(opts.legendFontColor || '#333333');
            context.fillText(item.name, startX, startY + 9);
            context.closePath();
            context.stroke();
            startX += measureText(item.name, fontSize) + shapeMargin;
        });
    });
}
export function drawPieDataPoints (series, opts, config, context, process = 1) {
    series = getPieDataPoints(series, process);
    let centerPosition = {
        x: opts.width / 2,
        y: (opts.height - config.legendHeight) / 2
    }
    let radius = Math.min(
        centerPosition.x - config.pieChartLinePadding - config.pieChartTextPadding - config._pieTextMaxLength_,
        centerPosition.y - config.pieChartLinePadding - config.pieChartTextPadding
    );
    if (opts.dataLabel) {
        radius -= 10;
    } else {
        radius -= 2 * config.padding;
    }
    series.forEach(function(eachSeries) {
        context.beginPath();
        context.setLineWidth(2);
        context.setStrokeStyle('#ffffff');
        context.setFillStyle(eachSeries.color);
        context.moveTo(centerPosition.x, centerPosition.y);
        context.arc(centerPosition.x, centerPosition.y, radius, eachSeries._start_, eachSeries._start_ + 2 * eachSeries._proportion_ * Math.PI);
        context.closePath();
        context.fill();
        if (opts.disablePieStroke !== true) {        
            context.stroke();
        }
    });

    if (opts.type === 'ring') {
        let innerPieWidth = radius * 0.6;
        if (typeof opts.extra.ringWidth === 'number' && opts.extra.ringWidth > 0) {
            innerPieWidth = Math.max(0, radius - opts.extra.ringWidth);
        }
        context.beginPath();
        context.setFillStyle('#ffffff');
        context.moveTo(centerPosition.x, centerPosition.y);
        context.arc(centerPosition.x, centerPosition.y, innerPieWidth, 0, 2 * Math.PI);
        context.closePath();
        context.fill();
    }

    if (opts.dataLabel !== false && process === 1) {
        drawPieText(series, opts, config, context, radius, centerPosition);
    }

    if (process === 1 && opts.type === 'ring') {
        drawRingTitle(opts, config, context);
    }

    return {
        center: centerPosition,
        radius,
        series
    }
}

export function drawCanvas (opts, context) {
    context.draw();
}