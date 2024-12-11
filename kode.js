function lagOgLeggTilListeElement(elev) {
    let tid = new Date();
    let listeElement = document.createElement('li');
    listeElement.innerHTML = '<b>' + elev + '</b> (' + tid.toLocaleTimeString() + ')';
    document.getElementById("liste").appendChild(listeElement);
}

document.getElementById("skjema").addEventListener("submit", function (evt) {
    evt.preventDefault();
    let elev = document.getElementById("navn").value;
    lagOgLeggTilListeElement(elev);
});