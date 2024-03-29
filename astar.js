/**
 * Obiekt AStar do wyszukiwania najkrotszej sciezki
 *
 * @constructor
 * @param {number} mapWidth - szerokosc mapy gry
 * @param {number} mapHeight - wysokosc mapy gry
 * @param {Object[]} stones - tablica ze wspolrzednymi kamieni (x,y)
 * @param {Object[]} snake - tablica ze wspolrzednymi weza (x,y)
 */

function AStar(mapWidth, mapHeight, stones, snake) {
    // koszt przejscia z pustego pola na pole zawierajace kamien - duza liczba sprawiajaca, ze nie oplaca sie przechodzic przez kamien, lepiej go okrazyc
    var STONE_DISTANCE = 999999;
    // to samo co wyzej - zapobiega zawracaniu sie glowy weza i chodzeniu p
    // o wlasnym ogonie
    var SNAKE_DISTANCE = STONE_DISTANCE;
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;
    this.map = [];

    //inicjalizacja mapy
    for(var i = 0; i < this.mapWidth; i++) {
        this.map[i] = [];
        for (var j = 0; j < this.mapHeight; j++) {
            this.map[i].push({
                x: i,
                y: j,
                distance: this.containsNode(stones, {x: i, y: j}) ? STONE_DISTANCE : (this.containsNode(snake, {x: i, y: j}) ? SNAKE_DISTANCE : 1),
                // droga pomiędzy polem początkowym a danym polem. Dokładniej: suma wag krawędzi, które należą już do ścieżki plus waga krawędzi łączącej aktualne pole
                g: 0,
                // przewidywana przez heurystykę droga od danego pola do pola docelowego
                h: 0,
                // f = f + h
                f: 0
            });
        }
    }
}

/**
 * Oblicza najkrotsza sciezke od punktu 'from' do 'to'
 *
 * @param {Object} from - punkt startowy (x,y)
 * @param {Object} to - punkt koncowy (x,y)
 * @returns {Object[]} tablica punktow z najkrotsza sciezka
 */
AStar.prototype.getClosestPath = function(from, to) {
    // pola juz odwiedzone
    var visitedNodes = [];
    // pola do odwiedzenia
    var nodesToVisit = [];

    // dodajemy punkt startowy jako pole do odwiedzenia
    nodesToVisit.push(this.map[from.x][from.y]);


    // dopoki jest jakies pole do odwiedzenia
    while(nodesToVisit.length > 0) {
        // szukamy w polach do odwiedzenia indeks pola o najnizszym koszcie przejscia na nie
        var lowestCostIndex = this.getLowestCostNodeIndex(nodesToVisit);
        var currentNode = nodesToVisit[lowestCostIndex];

        // jezeli pobrane pole to pole koncowe, konczymy algorytm
        if (this.nodeEquals(currentNode, to)) {
            return this.getPathFromNode(currentNode);
        }

        // usuwamy pole o najnizszym koszcie przejscia z tablicy pol do odwiedzenia
        nodesToVisit.splice(lowestCostIndex, 1);

        // dodajemy pole o najnizszym koszcie przejscia do tablicy odwiedzonych pol
        visitedNodes.push(currentNode);

        // pobieramy sasiadow aktualnie przegladanego pola
        var neighbourNodes = this.getNeighbours(currentNode);

        // dla kazdego sasiada obliczamy koszty przejscia
        for (var i = 0; i < neighbourNodes.length; i++) {
            if (this.containsNode(visitedNodes, neighbourNodes[i])) { // wezel juz byl wczesniej odwiedzony
                continue;
            }

            // koszt przejscia z punktu 'from' do danego sasiada jest rowny kosztowi przejscia do aktualnie przegladanego pola (o najniszym koszcie) + kosz przejscia z aktualnego pola do sasiada
            var gScore = currentNode.g + neighbourNodes[i].distance;

            // jezeli pole sasiada nie bylo jeszcze odwiedzone to dodajemy je do tablicy pol do odwiedzenia i aktualizujemy koszty przejscia
            if (!this.containsNode(nodesToVisit, neighbourNodes[i])) {

                // liczymy heurystyke kosztu przejscia od pola sasiada do pola koncowego
                neighbourNodes[i].h = this.heuristic(neighbourNodes[i], to);
                nodesToVisit.push(neighbourNodes[i]);

                this.updateNeighbour(neighbourNodes[i], currentNode, gScore);
                // jezeli sasiad byl juz kiedys odwiedzony (inna sciezka) sprawdzamy czy nowa sciezka nie ma mniejszego kosztu przejscia
            } else if (gScore < neighbourNodes[i].g) {
                this.updateNeighbour(neighbourNodes[i], currentNode, gScore);
            }
        }
    }
    // zwracamy pusta tablice jezeli nie znaleziono sciezki
    return [];
}

/**
 * Zwraca indeks elementu o najniszym koszcie
 *
 * @param {Object[]} nodes - tablica pol mapy gry
 * @returns {number} indeks elementu o najniszym koszcie
 */
AStar.prototype.getLowestCostNodeIndex = function(nodes) {
    var index = -1;
    for (var i = 0; i < nodes.length; i++) {
        if (index == -1 || nodes[i].f < nodes[index].f) {
            index = i;
        }
    }

    return index;
}

/**
 * Zwraca sciezke od punktu startowego do koncowego
 *
 * @param {Object} node - punkt startowy
 * @returns {Object[]} sciezka od punktu startowego do koncowego
 */
AStar.prototype.getPathFromNode = function(node) {
    var path = [];
    var currentNode = node;

    // dopoki dany punkt ma "rodzica" podazamy za nim
    while (currentNode.parent !== undefined) {
        path.push({x: currentNode.x, y: currentNode.y});
        currentNode = currentNode.parent;
    }

    // odwracamy tablice zeby sciezka byla od punktu startowanego do koncowego
    return path.reverse();
}

/**
 * Zwraca tablice sasiadow danego pola
 *
 * @param {Object} node - pole, dla ktorego pobieramy sasiadow
 * @returns {Object[]} tablica sasiadow danego pola
 */
AStar.prototype.getNeighbours = function(node) {
    var neighbours = [];
    var x = node.x;
    var y = node.y;

    if (x - 1 >= 0) {
        neighbours.push(this.map[x-1][y]);
    }

    if (x + 1 < this.mapWidth) {
        neighbours.push(this.map[x+1][y]);
    }

    if (y - 1 >= 0) {
        neighbours.push(this.map[x][y-1]);
    }

    if (y + 1 < this.mapHeight) {
        neighbours.push(this.map[x][y+1]);
    }

    return neighbours;
}

/**
 * Sprawdza czy w danej tablicy wystepuje pole o danych wspolrzednych
 *
 * @param {Object[]} nodes - tablica z polami do sprawdzenia
 * @param {Object} node - pole, ktore sprawdzamy
 * @returns {boolean}
 */
AStar.prototype.containsNode = function(nodes, node) {
    for (var i = 0; i < nodes.length; i++) {
        if(nodes[i].x === node.x && nodes[i].y === node.y) {
            return true;
        }
    }

    return false;
}

/**
 * Sprawdza dwa pola maja takie same wspolrzedne
 *
 * @param {Object} node1 - pole 1
 * @param {Object} node2 - pole2
 * @returns {boolean}
 */
AStar.prototype.nodeEquals = function(node1, node2) {
    return node1.x === node2.x && node1.y === node2.y;
}

/**
 * Liczy przewidywana przez heurystyke droga od danego punktu do punktu docelowego
 *
 * @param {Object} from - pole 1
 * @param {Object} to - pole 2
 * @returns {number}
 */
AStar.prototype.heuristic = function(from, to) {
    return Math.abs(from.x - to.y) + Math.abs(from.y - to.y);
}

/**
 * Aktualizuje parametry danego pola
 *
 * @param {Object} neighbour - pole sasiadujace
 * @param {Object} currentNode - aktualnie przetwarzane pole
 * @param {Object} gScore - koszt przejscia
 */
AStar.prototype.updateNeighbour = function (neighbour, currentNode, gScore) {
    neighbour.parent = currentNode;
    neighbour.g = gScore;
    neighbour.f = neighbour.g + neighbour.h;
}