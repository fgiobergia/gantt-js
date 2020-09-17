
import { Entry } from "./entry";
import { entries } from "./entries";

const now = new Date();

// get min/max dates, given a list of entries
function getBoundaries(entries: ReadonlyArray<Entry>): [Date, Date] {
    const min = entries.map(e => e.from).reduce((a,b) => a.getTime() < b.getTime() ? a : b);
    const max = entries.map(e => e.to === null ? now : e.to).reduce((a,b) => a.getTime() > b.getTime() ? a : b);
    return [ min, max ];
}

// get horizontal span of delta, proportioned to `from` and `to` dates (scaled on `width`)
function getWidthFromDelta(delta: number, from: Date, to: Date, width: number): number {
    return Math.round(delta / (to.getTime() - from.getTime()) * width);
}

function getXFromEntry(target: Entry, from: Date, to: Date, width: number): number {
    return getWidthFromDelta(target.from.getTime() - from.getTime(), from, to, width);
}

function getWidthFromEntry(target: Entry, from: Date, to: Date, width: number): number {
    const targetTo = target.to === null ? now : target.to;
    return getWidthFromDelta(targetTo.getTime() - target.from.getTime(), from, to, width);
}

function drawTimeline(entries: ReadonlyArray<Entry>) {
    const [from, to] = getBoundaries(entries);
    const sortedEntries = [...entries].sort((a,b) => a.from.getTime() - b.from.getTime());

    const svgNS = "http://www.w3.org/2000/svg";

    const svg: SVGSVGElement = document.createElementNS(svgNS, "svg");

    const svgWidth = 800;
    const rowHeight = 30;
    const lightRowColor = "rgb(238,238,238)";
    const darkRowColor = "rgb(224,224,224)";
    const rectHeight = 20;
    const yOffset = Math.round((rowHeight - rectHeight)/2);
    const rectColor = "rgb(230,40,40)";
    const rectRadius = 5;

    svg.setAttribute("width", `${svgWidth}`);
    svg.setAttribute("height", `${rowHeight * sortedEntries.length}`);

    /*
     * Create rows (one for each entry in the list)
     */
    svg.append(...sortedEntries.map((e, k) => {
        const rect = document.createElementNS(svgNS, "rect");
        const color = k % 2 === 0 ? darkRowColor : lightRowColor ;
        const y = k * rowHeight;

        rect.setAttribute("fill", color);
        rect.setAttribute("width", `${svgWidth}`);
        rect.setAttribute("height", `${rowHeight}`);
        rect.setAttribute("x", "0");
        rect.setAttribute("y", `${y}`);

        return rect;
    }));

    /*
     * Create rectangles (one for each entry)
     */
    // TODO: remove aaa, pass directly into svg.append(...)
    const aaa = sortedEntries.map((e,k) => {
        const x = getXFromEntry(e, from, to, svgWidth);
        const y = k * rowHeight + yOffset;
        const width = getWidthFromEntry(e, from, to, svgWidth);

        const rectBar = document.createElementNS(svgNS, "rect");
        rectBar.classList.add("bar");
        rectBar.setAttribute("fill", rectColor);
        rectBar.setAttribute("opacity", "0.4");
        rectBar.setAttribute("width", `${width}`);
        rectBar.setAttribute("height", `${rectHeight}`);
        rectBar.setAttribute("x", `${x}`);
        rectBar.setAttribute("y", `${y}`);
        rectBar.setAttribute("rx", `${rectRadius}`);
        rectBar.setAttribute("ry", `${rectRadius}`);


        const popupColor = "white";
        const popupMargin = 10;

        const rectPopup = document.createElementNS(svgNS, "rect");
        // rectPopup.classList.add("popup");
        rectPopup.setAttribute("fill", popupColor);
        rectPopup.setAttribute("opacity", "0.8");
        rectPopup.setAttribute("width", "300");
        rectPopup.setAttribute("height", "150");
        rectPopup.setAttribute("x", `${x}`);
        rectPopup.setAttribute("y", `${y+rectHeight}`);
        rectPopup.setAttribute("rx", `${rectRadius}`);
        rectPopup.setAttribute("ry", `${rectRadius}`);
        
        const g = document.createElementNS(svgNS, "g");
        g.classList.add("popup");
        const text = document.createElementNS(svgNS, "text");
        text.setAttribute("x", `${x+5}`);
        text.setAttribute("y", `${y+rectHeight+25}`);
        text.textContent = "ASDASDASDASD";

        g.append(rectPopup, text);


        return [rectBar, g];
    // final reduction needed to flatten
    // the result of map (multiple rects
    // are returned). the flat() function
    // is in es2019, but not widely supported
    }).reduce((a,b) => [...a, ...b]);

    svg.append(...aaa);

    /*
     * Create popups (&& hide them!) 
     */

    document.getElementById("container").appendChild(svg);

}

window.onload = () => drawTimeline(entries);