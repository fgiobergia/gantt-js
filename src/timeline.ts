
import { Entry } from "./entry";
import { entries } from "./entries";

const now = new Date();

// get min/max dates, given a list of entries
function getBoundaries(entries: ReadonlyArray<Entry>): [Date, Date] {
    const min = entries.map(e => e.from).reduce((a,b) => a.getTime() < b.getTime() ? a : b);
    const max = entries.map(e => dateOrNow(e.to)).reduce((a,b) => a.getTime() > b.getTime() ? a : b);
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
    return getWidthFromDelta(dateOrNow(target.to).getTime() - target.from.getTime(), from, to, width);
}

function dateOrNow(date: Date | null): Date {
    if (date === null) {
        return now;
    }
    return date;
}

function drawTimeline(entries: ReadonlyArray<Entry>) {
    const [from, to] = getBoundaries(entries);
    const sortedEntries = [...entries].sort((a,b) => a.from.getTime() - b.from.getTime());

    const svgNS = "http://www.w3.org/2000/svg";

    const svg: SVGSVGElement = document.createElementNS(svgNS, "svg");

    const svgWidth = 800;
    const rowHeight = 30;
    const svgHeight = rowHeight * (sortedEntries.length+1);
    const lightRowColor = "rgb(238,238,238)";
    const darkRowColor = "rgb(224,224,224)";
    const rectHeight = 20;
    const yOffset = Math.round((rowHeight - rectHeight)/2);
    const rectColor = "rgb(230,40,40)";
    const rectRadius = 5;
    const xOffset = 10;
    const popupColor = "white";
    const popupMargin = 25;
    const popupHeight = 120;
    const popupWidth = 300;

    svg.setAttribute("width", `${svgWidth}`);
    svg.setAttribute("height", `${svgHeight}`);

    /*
     * Create rows (one for each entry in the list) + 1 extra row (for labels)
     */
    svg.append(...[...Array(sortedEntries.length+1).keys()].map(k => {
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
    const rects = sortedEntries.map((e,k) => {
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

        const rectPopup = document.createElementNS(svgNS, "rect");
        rectPopup.classList.add("popuprect")
        
        const hRect = y + rectHeight + popupHeight > svgHeight ? svgHeight - popupHeight : y + rectHeight;
        // rectPopup.classList.add("popup");
        rectPopup.setAttribute("fill", popupColor);
        rectPopup.setAttribute("opacity", ".7");
        rectPopup.setAttribute("width", `${popupWidth}`);
        rectPopup.setAttribute("height", `${popupHeight}`);
        rectPopup.setAttribute("x", `${x}`);
        rectPopup.setAttribute("y", `${hRect}`);
        rectPopup.setAttribute("rx", `${rectRadius}`);
        rectPopup.setAttribute("ry", `${rectRadius}`);
        
        const g = document.createElementNS(svgNS, "g");
        
        // title of the popup
        const h0 = hRect+popupMargin;
        const textTitle = document.createElementNS(svgNS, "text");
        textTitle.setAttribute("x", `${x+xOffset}`);
        textTitle.setAttribute("y", `${h0}`);
        textTitle.setAttribute("font-weight", "bold");
        textTitle.setAttribute("font-family", "Optima");
        textTitle.setAttribute("font-size", "16");
        
        textTitle.textContent = e.title;

        // from-when row of popup
        const h1 = h0 + popupMargin;
        const textInstitution = document.createElementNS(svgNS, "text");
        textInstitution.setAttribute("x", `${x+xOffset}`);
        textInstitution.setAttribute("y", `${h1}`);
        textInstitution.textContent = e.institution;
        textInstitution.setAttribute("font-family", "Optima");
        textInstitution.setAttribute("font-size", "16");
        textInstitution.setAttribute("font-style", "italic");

        // from-when row of popup
        const h2 = h1 + popupMargin;
        const textDuration = document.createElementNS(svgNS, "text");
        textDuration.setAttribute("x", `${x+xOffset}`);
        textDuration.setAttribute("y", `${h2}`);
        textDuration.textContent = `${e.from.toLocaleString("en-GB", {month: "short", year: "numeric"})} - ${dateOrNow(e.to).toLocaleString("en-GB", {month: "short", year: "numeric"})}`;
        textDuration.setAttribute("font-family", "Optima");
        textDuration.setAttribute("font-size", "13");
        
        // from-when row of popup
        const h3 = h2 + popupMargin;
        const textLocation = document.createElementNS(svgNS, "text");
        textLocation.setAttribute("x", `${x+xOffset}`);
        textLocation.setAttribute("y", `${h3}`);
        textLocation.textContent = e.location;
        textLocation.setAttribute("font-family", "Optima");
        textLocation.setAttribute("font-size", "13");

        g.append(rectPopup, textTitle, textDuration, textInstitution, textLocation);


        return [rectBar, g];
    // final reduction needed to flatten
    // the result of map (multiple rects
    // are returned). the flat() function
    // is in es2019, but not widely supported
    });

    const bars = rects.map(r => r[0]);
    const gs = rects.map(r => r[1]);

    rects.forEach(rect => {
        const [bar, g] = rect;
        bar.onmouseover = () => g.classList.add("visible");
        bar.onmouseout = () => g.classList.remove("visible");


    })
    svg.append(...bars);
    svg.append(...gs);

    /*
     * Create popups (&& hide them!) 
     */
    document.getElementById("container").appendChild(svg);

    gs.map(g => {
        const [ rect, ...texts ] = [...g.children];
        const maxWidth = Math.round(Math.max(...texts.map((el: SVGGraphicsElement) => el.getBBox().width)));
        const popupWidth = maxWidth + 2 * xOffset;
        rect.setAttribute("width", `${popupWidth}`);
        const x = g.getBBox().x + popupWidth > svgWidth ? svgWidth - popupWidth : g.getBBox().x;
        rect.setAttribute("x", `${x}`);
        texts.forEach(t => t.setAttribute("x", `${x+xOffset}`));

        g.classList.add("popup");
    })

    // Apparently, <text>s are only given a size
    // after being displayed -- hence, wait until
    // drawn to (1) make them invisible and (2)
    // assign the right width to each popup

}

window.onload = () => drawTimeline(entries);