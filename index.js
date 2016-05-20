var LAYER_COLORS = [
    "#000000", // 0
    "#23238D", // 1
    "#238D23", // 2
    "#238D8D", // 3
    "#8D2323", // 4
    "#8D238D", // 5
    "#8D8D23", // 6
    "#8D8D8D", // 7
    "#272727", // 8
    "#0000B4", // 9
    "#00B400", // 10
    "#00B4B4", // 11
    "#B40000", // 12
    "#B400B4", // 13
    "#B4B400", // 14
    "#B4B4B4"  // 15
];

var PAD_LAYER = 17;
var VIA_LAYER = 18;
var TORIGIN_LAYER = 23;
var BORIGIN_LAYER = 24;

var ZOOM_EXPONENT = 1.1;

var global_LayerVisibility = {};

function updateLayerVisibilityStyleSheet()
{
    var styleSheet = document.getElementById("styleSheetLayerVisibility");
    var txt = "";
    for (name in global_LayerVisibility)
    {
        if (global_LayerVisibility[name] == false)
            txt += "." + name + " {display: none}\n";
    }
    deleteAllChildren(styleSheet);
    styleSheet.appendChild(document.createTextNode(txt));
}

function setLayerVisible(name, checked)
{
    global_LayerVisibility[name] = checked;
    updateLayerVisibilityStyleSheet();
}

function loadXMLDoc(dname)
{
    if (window.XMLHttpRequest)
        xhttp=new XMLHttpRequest();
    else
        xhttp=new ActiveXObject("Microsoft.XMLHTTP");
    xhttp.open("GET",dname,false);
    xhttp.send();
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(xhttp.responseText, "application/xml");
    return xmlDoc;
}

function deleteAllChildren(myNode)
{
    while (myNode.firstChild)
    {
        myNode.removeChild(myNode.firstChild);
    }
}

function addWire(dest, wire)
{
    var curveAttr = wire.getAttribute("curve");
    if (curveAttr !== null)
    {
        var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        var x1 = parseFloat(wire.getAttribute("x1"));
        var y1 = parseFloat(wire.getAttribute("y1"));
        var x2 = parseFloat(wire.getAttribute("x2"));
        var y2 = parseFloat(wire.getAttribute("y2"));
        var arcAngle = parseFloat(wire.getAttribute("curve"))*Math.PI/180.0;
        //alert(wire.getAttribute("curve"));
        //alert(arcAngle);
        var length = Math.sqrt(Math.pow(x2-x1, 2.0) + Math.pow(y2-y1, 2.0));
        var rotAngle = Math.atan2(y2-y1, x2-x1)*180.0/Math.PI;
        var radius = Math.abs(length/Math.sin(arcAngle/2.0))/2.0;
        // TODO set side of line properly, test more
        var dir = '0';
        path.setAttribute("d", "M" + wire.getAttribute("x1") + " " + wire.getAttribute("y1") + " A" + radius.toString() + " " +
            radius.toString() + " " + rotAngle.toString() + " " + ((Math.abs(arcAngle) > Math.PI) ? '1' : '0') +
            " " + ((arcAngle > 0.0) ? '1' : '0') + " " + wire.getAttribute("x2") + " " + wire.getAttribute("y2") + "");
        path.setAttribute("class", "wire layer" + wire.getAttribute("layer"));
        path.style.strokeWidth = parseFloat(wire.getAttribute("width"));
        if (path.style.strokeWidth == 0.0)
            path.style.strokeWidth = 0.5;
        dest.appendChild(path);
    }
    else
    {
        var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", wire.getAttribute("x1"));
        line.setAttribute("y1", wire.getAttribute("y1"));
        line.setAttribute("x2", wire.getAttribute("x2"));
        line.setAttribute("y2", wire.getAttribute("y2"));
        line.setAttribute("class", "wire layer" + wire.getAttribute("layer"));
        line.style.strokeWidth = parseFloat(wire.getAttribute("width"));
        if (line.style.strokeWidth == 0.0)
            line.style.strokeWidth = 0.5;
        dest.appendChild(line);
    }
}

function addRect(dest, wire)
{
    var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    var x1 = parseFloat(wire.getAttribute("x1"));
    var y1 = parseFloat(wire.getAttribute("y1"));
    var x2 = parseFloat(wire.getAttribute("x2"));
    var y2 = parseFloat(wire.getAttribute("y2"));
    rect.setAttribute("x", Math.min(x1, x2));
    rect.setAttribute("y", Math.min(y1, y2));
    rect.setAttribute("width", Math.abs(x2-x1));
    rect.setAttribute("height", Math.abs(y2-y1));
    rect.setAttribute("class", "rect layer" + wire.getAttribute("layer"));
    dest.appendChild(rect);
}

function addPolygon(dest, polygon)
{
    var poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    var vertices = polygon.getElementsByTagName("vertex");
    var txt = "";
    for (var i = 0; i < vertices.length; i++)
    {
        var vertex = vertices[i];
        txt += vertex.getAttribute("x") + "," + vertex.getAttribute("y") + " ";
    }
    poly.setAttribute("points", txt);
    poly.setAttribute("class", "poly layer" + polygon.getAttribute("layer"));
    poly.style.strokeWidth = polygon.getAttribute("width");
    dest.appendChild(poly);
}

function addVia(dest, via, actuallyPad)
{
    var x = parseFloat(via.getAttribute("x"));
    var y = parseFloat(via.getAttribute("y"));
    var drill = parseFloat(via.getAttribute("drill"))/2.0;
    var radius = drill + 0.4064; // 16 mils in mm TODO not hard-code this here
    {
        var diam = via.getAttribute("diameter");
        if (diam !== null)
            radius = parseFloat(diam)/2.0;
    }
    var shape = via.getAttribute("shape");
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    var txt = "";
    // TODO other shapes besides square and round, like octagonal, long, and offset
    if (shape === "square")
    {
        txt +=  "M" + (x - radius).toString() + " " + (y - radius).toString();
        txt += " L" + (x + radius).toString() + " " + (y - radius).toString();
        txt += " L" + (x + radius).toString() + " " + (y + radius).toString();
        txt += " L" + (x - radius).toString() + " " + (y + radius).toString();
    }
    else
    {
        txt += "M" + (x - radius).toString() + " " + y.toString();
        txt += " A" + radius.toString() + " " + radius.toString() + " 45 0 1 " + x.toString() + " " + (y - radius).toString();
        txt += " A" + radius.toString() + " " + radius.toString() + " 45 0 1 " + (x + radius).toString() + " " + y.toString();
        txt += " A" + radius.toString() + " " + radius.toString() + " 45 0 1 " + x.toString() + " " + (y + radius).toString();
        txt += " A" + radius.toString() + " " + radius.toString() + " 45 0 1 " + (x - radius).toString() + " " + y.toString();
    }
    txt += " Z";
    txt += " M" + (x - drill).toString() + " " + y.toString();
    txt += " A" + drill.toString() + " " + drill.toString() + " 45 0 1 " + x.toString() + " " + (y - drill).toString();
    txt += " A" + drill.toString() + " " + drill.toString() + " 45 0 1 " + (x + drill).toString() + " " + y.toString();
    txt += " A" + drill.toString() + " " + drill.toString() + " 45 0 1 " + x.toString() + " " + (y + drill).toString();
    txt += " A" + drill.toString() + " " + drill.toString() + " 45 0 1 " + (x - drill).toString() + " " + y.toString();
    txt += " Z";
    path.setAttribute("d", txt);
    path.setAttribute("class", "via layer" + (actuallyPad ? PAD_LAYER : VIA_LAYER).toString());
    dest.appendChild(path);
}

function addSmd(dest, smd)
{
    var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    var x = parseFloat(smd.getAttribute("x"));
    var y = parseFloat(smd.getAttribute("y"));
    var dx = parseFloat(smd.getAttribute("dx"));
    var dy = parseFloat(smd.getAttribute("dy"));
    rect.setAttribute("x", (x - dx/2.0).toString());
    rect.setAttribute("y", (y - dy/2.0).toString());
    rect.setAttribute("width", dx.toString());
    rect.setAttribute("height", dy.toString());
    rect.setAttribute("class", "via layer" + smd.getAttribute("layer")); // HACK is via the right class?
    dest.appendChild(rect);
}

function addText(dest, text)
{
    var t = document.createElementNS("http://www.w3.org/2000/svg", "text");
    // t.setAttribute("x", text.getAttribute("x"));
    // t.setAttribute("y", text.getAttribute("y"));
    t.setAttribute("font-family", "Monospace");
    t.setAttribute("font-size", (parseFloat(text.getAttribute("size")) * 1.4).toString() + "px");
    t.setAttribute("transform", "translate(" + text.getAttribute("x") + " " + text.getAttribute("y") + ") scale(1, -1)");
    t.setAttribute("class", "layer" + text.getAttribute("layer"));
    t.appendChild(text.firstChild.cloneNode());
    dest.appendChild(t);
}

function addWires(dest, wires)
{
    for (var i = 0; i < wires.length; i++)
    {
        addWire(dest, wires[i]);
    }
}

function addRects(dest, rects)
{
    for (var i = 0; i < rects.length; i++)
    {
        addRect(dest, rects[i]);
    }
}

function addPolygons(dest, polys)
{
    for (var i = 0; i < polys.length; i++)
    {
        addPolygon(dest, polys[i]);
    }
}

function addVias(dest, vias)
{
    for (var i = 0; i < vias.length; i++)
    {
        addVia(dest, vias[i]);
    }
}

function addTexts(dest, texts)
{
    for (var i = 0; i < texts.length; i++)
    {
        addText(dest, texts[i]);
    }
}

// TODO support origins of different sizes
function addOrigin(dest, size, className)
{
    var radius = Math.max(0.5, Math.min(size.width, size.height)*0.2);
    var originLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    originLine.setAttribute("x1", "-" + radius.toString());
    originLine.setAttribute("y1", "0");
    originLine.setAttribute("x2", radius.toString());
    originLine.setAttribute("y2", "0");
    originLine.setAttribute("class", "origin " + className);
    dest.appendChild(originLine);

    originLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    originLine.setAttribute("x1", "0");
    originLine.setAttribute("y1", "-" + radius.toString());
    originLine.setAttribute("x2", "0");
    originLine.setAttribute("y2", radius.toString());
    originLine.setAttribute("class", "origin " + className);
    dest.appendChild(originLine);
}

var scaleFactor = 10.0;
var originalBoardSize = null;
var oldPos = {'x':0, 'y':0};
var boardOffset = {'x':0, 'y':0};
var scrollingTheView = false;

function MouseDownHandler(e, obj)
{
    e = e || window.event; //window.event for IE
    if (e.button == 0)
    {
        oldPos.x = e.clientX;
        oldPos.y = e.clientY;
        scrollingTheView = true;
        return false;
    }
    return true;
}

function MouseUpHandler(e, obj)
{
    e = e || window.event; //window.event for IE
    if (e.button == 0)
    {
        scrollingTheView = false;
        return false;
    }
    return true;
}

function MouseMoveHandler(e, obj)
{
    e = e || window.event; //window.event for IE
    if (scrollingTheView)
    {
        var dx = e.clientX - oldPos.x;
        var dy = e.clientY - oldPos.y;
        oldPos.x = e.clientX;
        oldPos.y = e.clientY;
        var svgElementId = document.getElementById("svgElementId");
        boardOffset.x += dx;
        boardOffset.y += dy;
        svgElementId.style.left = boardOffset.x.toString() + "px";
        svgElementId.style.top = boardOffset.y.toString() + "px";
        return false;
    }
    return true;
}

function findRelativePosition(obj)
{
    var curleft = 0.0;
    var curtop = 0.0;
    do
    {
        curleft += obj.offsetLeft;
        curtop += obj.offsetTop;
    } while (obj = obj.offsetParent);
    return {'x': curleft, 'y': curtop};
}

function MouseWheelHandler(e)
{
    // cross-browser wheel delta
    var e = window.event || e; // old IE support
    var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));

    var scrollView = document.getElementById("scrollView");
    var offset = findRelativePosition(scrollView);
    var oldBoardX = ((e.clientX - offset.x) - boardOffset.x)/scaleFactor;
    var oldBoardY = ((e.clientY - offset.y) - boardOffset.y)/scaleFactor;

    var svgElementId = document.getElementById("svgElementId");
    var boardGroup = document.getElementById("boardGroup");
    scaleFactor *= Math.pow(ZOOM_EXPONENT, delta);

    boardOffset.x = (e.clientX - offset.x) - oldBoardX*scaleFactor;
    boardOffset.y = (e.clientY - offset.y) - oldBoardY*scaleFactor;

    svgElementId.style.left = boardOffset.x.toString() + "px";
    svgElementId.style.top = boardOffset.y.toString() + "px";
    boardGroup.setAttribute("transform", "matrix(" + scaleFactor.toString() + ", 0, 0, -" + scaleFactor.toString() + ", 0, " + (originalBoardSize.height*scaleFactor).toString() + ")");
    svgElementId.setAttribute("width", (originalBoardSize.width*scaleFactor).toString());
    svgElementId.setAttribute("height", (originalBoardSize.height*scaleFactor).toString());
    return false;
}

function onLoadFunc()
{
    var scrollView = document.getElementById("scrollView");
    if (scrollView.addEventListener)
    {
        // IE9, Chrome, Safari, Opera
        scrollView.addEventListener("mousewheel", MouseWheelHandler, false);
        // Firefox
        scrollView.addEventListener("DOMMouseScroll", MouseWheelHandler, false);
    }
    // IE 6/7/8
    else
        scrollView.attachEvent("onmousewheel", MouseWheelHandler);

    var boardDocument = loadXMLDoc("Arduino_MEGA2560_ref.brd");
    loadBoard(boardDocument);
}

function loadFile(file)
{
    var parser = new DOMParser();
    var start = parseInt(0);
    var stop = parseInt(file.size - 1);

    var reader = new FileReader();

    // If we use onloadend, we need to check the readyState.
    reader.onloadend = function(evt) {
        if (evt.target.readyState == FileReader.DONE) { // DONE == 2
            var xmlDoc = parser.parseFromString(evt.target.result, "application/xml");
            loadBoard(xmlDoc);
        }
    };

    var blob = file.slice(start, stop + 1);
    reader.readAsBinaryString(blob)
}

function loadBoard(boardDocument)
{
    var svgElementId = document.getElementById("svgElementId");
    var boardGroup = document.getElementById("boardGroup");
    deleteAllChildren(boardGroup);
    deleteAllChildren(document.getElementById("packagesGroup"));
    deleteAllChildren(document.getElementById("styleSheetLayerColors"));
    deleteAllChildren(document.getElementById("styleSheetLayerVisibility"));
    deleteAllChildren(document.getElementById("layerCheckboxForm"));
    {
        var layerCheckboxForm = document.getElementById("layerCheckboxForm");
        var styleSheet = document.getElementById("styleSheetLayerColors");
        var layers = boardDocument.getElementsByTagName("eagle")[0].getElementsByTagName("drawing")[0].getElementsByTagName("layers")[0].getElementsByTagName("layer");
        var txt = "";
        for (var i = 0; i < layers.length; i++)
        {
            var layer = layers[i];
            var n = layer.getAttribute("number");
            txt += ".poly.layer" + n + ", .wire.layer" + n + " {stroke: " + LAYER_COLORS[parseInt(layer.getAttribute("color"))] + "}\n";
            txt += ".via.layer"  + n + ", .rect.layer" + n + " {fill: "   + LAYER_COLORS[parseInt(layer.getAttribute("color"))] + "}\n";
        }
        styleSheet.appendChild(document.createTextNode(txt));
        global_LayerVisibility = {};
        for (var i = 0; i < layers.length; i++)
        {
            var layer = layers[i];
            var visible = true;
            if (layer.getAttribute("visible") == "no")
                visible = false;
            global_LayerVisibility["layer" + layer.getAttribute("number")] = visible;

            if (layer.getAttribute("active") == "yes")
            {
                var checkboxElement = document.createElement("input");
                checkboxElement.setAttribute("type", "checkbox");
                checkboxElement.setAttribute("name", "layer" + layer.getAttribute("number"));
                checkboxElement.checked = visible;
                checkboxElement.setAttribute("onClick", "setLayerVisible(this.name, this.checked)");
                layerCheckboxForm.appendChild(checkboxElement);
                layerCheckboxForm.appendChild(document.createTextNode(layer.getAttribute("name")));
                layerCheckboxForm.appendChild(document.createElement("br"));
            }
        }
        updateLayerVisibilityStyleSheet();
    }
    var board = boardDocument.getElementsByTagName("eagle")[0].getElementsByTagName("drawing")[0].getElementsByTagName("board")[0]
    {
        var plain = board.getElementsByTagName("plain")[0];
        var plainWires = plain.getElementsByTagName("wire");
        addWires(boardGroup, plainWires);
        var plainRects = plain.getElementsByTagName("rectangle");
        addRects(boardGroup, plainRects);
        var plainTexts = plain.getElementsByTagName("text");
        addTexts(boardGroup, plainTexts);
    }
    {
        var packagesGroup = document.getElementById("packagesGroup");
        var libraries = board.getElementsByTagName("libraries")[0].getElementsByTagName("library");
        for (var i = 0; i < libraries.length; i++)
        {
            var library = libraries[i];
            var packages = library.getElementsByTagName("packages")[0].getElementsByTagName("package");
            for (var j = 0; j < packages.length; j++)
            {
                var pack = packages[j];
                var packageGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
                packageGroup.setAttribute("id", library.getAttribute("name") + "___" + pack.getAttribute("name"));
                var circles = pack.getElementsByTagName("circle");
                for (var k = 0; k < circles.length; k++)
                {
                    var circle = circles[k];
                    var circ = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                    circ.setAttribute("cx", circle.getAttribute("x"));
                    circ.setAttribute("cy", circle.getAttribute("y"));
                    circ.setAttribute("r", circle.getAttribute("radius"));
                    circ.style.strokeWidth = circle.getAttribute("width");
                    circ.setAttribute("class", "wire layer" + circle.getAttribute("layer"));
                    packageGroup.appendChild(circ);
                }
                var pads = pack.getElementsByTagName("pad");
                for (var k = 0; k < pads.length; k++)
                {
                    var pad = pads[k];
                    addVia(packageGroup, pad, true);
                }
                var smds = pack.getElementsByTagName("smd");
                for (var k = 0; k < smds.length; k++)
                {
                    var smd = smds[k];
                    addSmd(packageGroup, smd);
                }
                //var texts = pack.getElementsByTagName("text"); // TODO
                var wires = pack.getElementsByTagName("wire");
                addWires(packageGroup, wires);
                packagesGroup.appendChild(packageGroup);
            }
        }
    }
    {
        var signals = board.getElementsByTagName("signals")[0].getElementsByTagName("signal");
        for (var i = 0; i < signals.length; i++)
        {
            var wires = signals[i].getElementsByTagName("wire");
            addWires(boardGroup, wires);
            var polygons = signals[i].getElementsByTagName("polygon");
            addPolygons(boardGroup, polygons);
            var vias = signals[i].getElementsByTagName("via");
            addVias(boardGroup, vias);
        }
    }
    {
        var elements = board.getElementsByTagName("elements")[0].getElementsByTagName("element");
        for (var i = 0; i < elements.length; i++)
        {
            var element = elements[i];
            var packageInst = document.createElementNS("http://www.w3.org/2000/svg", "use");
            packageInst.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', "#" + element.getAttribute("library") + "___" + element.getAttribute("package"));
            var rot = element.getAttribute("rot");
            var mirrored = false;
            var extra = "";
            if (rot !== null)
            {
                mirrored = (rot.substring(0, 1) == "M");
                var trans = "";
                if (mirrored)
                    trans = "scale(-1 1) ";
                trans += " rotate(" + rot.substring(mirrored ? 2 : 1) + ")";
                packageInst.setAttribute("transform", trans);
            }
            // TODO not rotate/mirror the origin!
            var packageInstGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
            packageInstGroup.setAttribute("transform", "translate(" + element.getAttribute("x") + " " + element.getAttribute("y") + ")" + extra);
            packageInstGroup.appendChild(packageInst);
            boardGroup.appendChild(packageInstGroup);
            addOrigin(packageInstGroup, packageInst.getBBox(), "layer" + (mirrored ? BORIGIN_LAYER : TORIGIN_LAYER).toString());
        }
    }
    originalBoardSize = boardGroup.getBBox();
    boardGroup.setAttribute("transform", "matrix(" + scaleFactor.toString() + ", 0, 0, -" + scaleFactor.toString() + ", 0, " + (originalBoardSize.height*scaleFactor).toString() + ")");
    svgElementId.setAttribute("width", (originalBoardSize.width*scaleFactor).toString());
    svgElementId.setAttribute("height", (originalBoardSize.height*scaleFactor).toString());
}