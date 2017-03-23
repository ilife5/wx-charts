import { convertHex, calculate } from "../util/util";
import Points from "../plugins/points";

export function drawPointShape(points, color, shape, context) {
    context.beginPath();
    const pointPlugin = Points[shape];
    context.setStrokeStyle(calculate(pointPlugin.strokeStyle, color));
    context.setLineWidth(calculate(pointPlugin.lineWidth, color));
    context.setFillStyle(color);

    points.forEach(item => {
        if (item !== null) {
            pointPlugin.draw(item, context);
        }
    });

    context.closePath();
    context.fill();
    context.stroke();
}

export function drawPointAtIndex(point, color, shape, context) {

    const pointPlugin = Points[shape];

    context.beginPath();
    context.setStrokeStyle(calculate(pointPlugin.strokeStyle, color));
    context.setLineWidth(calculate(pointPlugin.lineWidth, color));
    context.setFillStyle(color);

    if (point !== null) {
        pointPlugin.draw(point, context);
    }

    context.closePath();
    context.fill();
    context.stroke();

}