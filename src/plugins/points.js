import { convertHex } from "../util/util";

let PointPlugins = {
    "diamond": {
        strokeStyle: "#ffffff",
        lineWidth: 1,
        draw(item, context) {
            context.moveTo(item.x, item.y - 4.5);
            context.lineTo(item.x - 4.5, item.y);
            context.lineTo(item.x, item.y + 4.5);
            context.lineTo(item.x + 4.5, item.y);
            context.lineTo(item.x, item.y - 4.5);
        }
    }, "circle": {
        strokeStyle: "#ffffff",
        lineWidth: 1,
        draw(item, context) {
            context.moveTo(item.x + 3.5, item.y);
            context.arc(item.x, item.y, 4, 0, 2 * Math.PI, false);
        }
    }, "rect": {
        strokeStyle: "#ffffff",
        lineWidth: 1,
        draw(item, context) {
            context.moveTo(item.x - 3.5, item.y - 3.5);
            context.rect(item.x - 3.5, item.y - 3.5, 7, 7);
        }
    }, "triangle": {
        strokeStyle: "#ffffff",
        lineWidth: 1,
        draw(item, context) {
            context.moveTo(item.x, item.y - 4.5);
            context.lineTo(item.x - 4.5, item.y + 4.5);
            context.lineTo(item.x + 4.5, item.y + 4.5);
            context.lineTo(item.x, item.y - 4.5);
        }
    }, "halo": {
        strokeStyle(color) {
            return convertHex(color, 50);
        },
        lineWidth: 4,
        draw(item, context) {
            context.moveTo(item.x + 6.5, item.y);
            context.arc(item.x, item.y, 5, 0, 2 * Math.PI, false);
        }
    }
};

export default PointPlugins;