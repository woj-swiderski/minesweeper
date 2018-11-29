'use strict';
// const msg3 = document.getElementById('msg3');

const msg = document.getElementById('msg');
const msg2 = document.getElementById('msg2');
const new_game = document.getElementById('new_game_button');
const timer = document.getElementById('timer');
const radios = document.getElementsByName('level');

// const clr = document.getElementById('clear_records');

const bomb_icon = '<i class="fas fa-bomb"></i>';
const flag_icon = '<i class="fas fa-flag"></i>';

// [row, cols, bombs] - row x cols board with number of bombs = bombs
const gameLevels = [[9, 9, 10], [16, 16, 40], [16, 30, 99]];
// current game level
let currentGameLevel = 0;

// for controlling when to start a timer
let gameStarted = false;
// total number of flags (=bombs), flags currently used, time lapsed
let flagsTotal, flagsUsed, timeLapsed, timerID;

window.addEventListener('contextmenu', rightClick);
new_game.addEventListener('click', newGame);
// clr.addEventListener('click', storageClear);

const hider = document.createElement('input');
hider.class = 'button';
hider.type = 'button';
hider.value = 'Clear records';
hider.addEventListener('click', storageClear);

function initBoard(level=0){

    currentGameLevel = level;
    let [rows, cols, bombs] = gameLevels[level]; // rows and cols are used later in the loop

    flagsTotal = bombs;
    flagsUsed = 0;
    timeLapsed = 0;

    let stable = document.getElementById('stable');
    stable.style.width = cols * 25 + 'px';

    // event listener - found it easier to partially overwrite window ev. listener
    stable.addEventListener('click', cellClicked);

    let pkg = document.getElementsByClassName('package')[0];
    pkg.style.width = cols * 25 + 'px';
    pkg.style.height = rows * 25 + 'px';

    // for setting bombs randomly - used later
    let temp = [];
    let s = new Set();

    for (let i = 0; i < rows; i++){
        let r = document.createElement('div');
        r.classList.add('row');

        // append row
        stable.appendChild(r);
        for (let j = 0; j < cols; j++){
            let d = document.createElement('div');
            // cells are identified by id
            d.id = i + '_' + j;  // row + col
            temp.push(d.id);
            // whether cell was checked or not (exploded, cleared, bombs displayed)
            d.checked = false;
            // initialize d.values (1 = bomb, 0 = empty)
            // ALWAYS remember to initialise variables!
            d.value = 0;
            // wheter cell is flagged or not
            d.flag = false;
            d.classList.add('tile');
            // append cell to the row
            r.appendChild(d);
        }
    }

    // fill set s with randomly chosen id's
    while (s.size < bombs) {
        s.add(temp[Math.floor(Math.random()*temp.length)]);
    }
    // set bombs in chosen cells
    for (let i of s.values()){
        document.getElementById(i).value = 1;
    }

    msg.value = flagsTotal - flagsUsed;
    timer.value = timeLapsed;
}

function calcNeighborBombs(id){
    // number of bombs bordering given cell
    let temp = getNeighbors(id);
    return temp.map((x)=>x.value).reduce((p, q)=> p+q)
}

function isBomb(id){
    // whether there's a bomb in cell with id
    let x = document.getElementById(id);
    return (x.value == 1);
}

function explodeAll(tid){
    // should somehow inform that the game is over
    let [rows, cols, bombs] = gameLevels[currentGameLevel];
    for (let i = 0; i < rows; i++){
        for (let j = 0; j < cols; j++){
            let x = document.getElementById(i + '_' + j);

            x.checked = true;
            if (x.value == 1){
                x.innerHTML = bomb_icon;
                if (x.flag){
                    x.innerHTML = flag_icon;
                    // x.classList.toggle('tile_false_flag')
                }
                else if (x.id != tid) {
                    x.classList.toggle('tile_down')
                }
                else {
                    x.classList.toggle('tile_this_bomb')
                }
            }
            else if (x.flag) {
                x.classList.toggle('tile_false_flag')
            }
        }
    }
    clearInterval(timerID);
    info('You have lost!', JSON.parse(localStorage.getItem(currentGameLevel)));
}

function getNeighbors(id){
    // returns an array of cells being neighbors of id'd cell
    let [rows, cols, bombs] = gameLevels[currentGameLevel];
    let ret = [];
    let i = id.indexOf('_');
    let x = parseInt(id.slice(0, i));
    let y = parseInt(id.slice(i+1));

    if ((x == 0) && (y == 0)){
        ret.push(document.getElementById(x + '_' + (y+1)));
        ret.push(document.getElementById((x+1) + '_' + (y+1)));
        ret.push(document.getElementById((x+1) + '_' + y));
        return ret
    }

    if ((x == rows - 1) && (y == 0)){
        ret.push(document.getElementById(x + '_' + (y+1)));
        ret.push(document.getElementById((x-1) + '_' + (y+1)));
        ret.push(document.getElementById((x-1) + '_' + y));
        return ret
    }

    if ((x == rows - 1) && (y == cols - 1)){
        ret.push(document.getElementById(x + '_' + (y-1)));
        ret.push(document.getElementById((x-1)  + '_' + (y-1)));
        ret.push(document.getElementById((x-1) + '_' + y));
        return ret
    }

    if ((x == 0) && (y == cols - 1)){
        ret.push(document.getElementById(x + '_' + (y-1)));
        ret.push(document.getElementById((x+1) + '_' + (y-1)));
        ret.push(document.getElementById((x+1) + '_' + y));
        return ret
    }

    if (x == 0){
        ret.push(document.getElementById(x + '_' + (y-1)));
        ret.push(document.getElementById(x + '_' + (y+1)))
        ret.push(document.getElementById((x+1) + '_' + (y-1)));
        ret.push(document.getElementById((x+1) + '_' + y));
        ret.push(document.getElementById((x+1) + '_' + (y+1)));
        return ret
    }

    if (x == rows - 1){
        ret.push(document.getElementById(x + '_' + (y-1)));
        ret.push(document.getElementById(x + '_' + (y+1)));
        ret.push(document.getElementById((x-1) + '_' + (y-1)));
        ret.push(document.getElementById((x-1 )+ '_' + y));
        ret.push(document.getElementById((x-1) + '_' + (y+1)));
        return ret
    }

    if (y == 0){
        ret.push(document.getElementById((x-1) + '_' + y));
        ret.push(document.getElementById((x+1 )+ '_' + y));
        ret.push(document.getElementById((x+1 )+ '_' + (y+1)));
        ret.push(document.getElementById(x + '_' + (y+1)));
        ret.push(document.getElementById((x-1) + '_' + (y+1)));
        return ret
    }

    if (y == cols - 1){
        ret.push(document.getElementById((x-1) + '_' + y));
        ret.push(document.getElementById((x+1) + '_' + y));
        ret.push(document.getElementById((x+1) + '_' + (y-1)));
        ret.push(document.getElementById(x + '_' + (y-1)));
        ret.push(document.getElementById((x-1) + '_' + (y-1)));
        return ret
    }

    ret.push(document.getElementById((x-1) + '_' + (y-1)));
    ret.push(document.getElementById((x-1) + '_' + y));
    ret.push(document.getElementById((x-1) + '_' + (y+1)));
    ret.push(document.getElementById(x + '_' + (y-1)));
    ret.push(document.getElementById(x + '_' + (y+1)));
    ret.push(document.getElementById((x+1) + '_' + (y-1)));
    ret.push(document.getElementById((x+1) + '_' + y));
    ret.push(document.getElementById((x+1) + '_' + (y+1)));

    return ret
}

function clearCell(id){
    let cell = document.getElementById(id);
    // if cell was checked - exit
    if (cell.checked || cell.flag){
        cell.flag = false;
        return
    }

    let numberOfBombs = 0;
    // if there are bombs around - calculate how many, check the cell and exit
    if (numberOfBombs = calcNeighborBombs(id)) {
        cell.checked = true;
        cell.innerHTML = '';
        displayBombNumber(id, numberOfBombs);
        return
    }

    // now we know that there are no bombs around the cell
    let neighbors = getNeighbors(id);
    cell.checked = true;
    cell.innerHTML = '';
    cell.classList.toggle('tile_down');
    if (neighbors.length == neighbors.map((x)=>x.checked).reduce((p, q)=> p+q)) {
        return
    }

    for (let n of neighbors){
        clearCell(n.id);
    }
}

function displayBombNumber(id, nbombs){
    let x = document.getElementById(id);
    x.classList.toggle('tile_down');
    switch (nbombs){
        case 1 : x.classList.add('one'); x.innerHTML = 1;
        break;
        case 2 : x.classList.add('two'); x.innerHTML = 2;
        break;
        case 3 : x.classList.add('three'); x.innerHTML = 3;
        break;
        case 4 : x.classList.add('four'); x.innerHTML = 4;
        break;
        case 5 : x.classList.add('five'); x.innerHTML = 5;
        break;
        case 6 : x.classList.add('six'); x.innerHTML = 6;
        break;
        case 7 : x.classList.add('six'); x.innerHTML = 7;
        break;
        case 8 : x.classList.add('six'); x.innerHTML = 8;
        break;
        default : ;
    }
}

function cellClicked(e){

    if (!gameStarted) {
        gameStarted = true;
        if (timerID === undefined) {
            timerID = window.setInterval(timeCounter, 1000);
        }
    }
    let tid = e.target.id;
    let numberOfBombs = 0;
    let cell = document.getElementById(tid);

    if (tid == 'stable'){
        return
    }

    if (cell.checked || cell.flag){
        return
    }

    if (isBomb(tid)){
        explodeAll(tid);
        clearInterval(timerID); // should end the game
    }
    else if (numberOfBombs = calcNeighborBombs(tid)){
        // if there are bombs near a cell - display the number of bombs
        displayBombNumber(tid, numberOfBombs);
        cell.checked = true;
    }
    else {
        // recursive clearing
        clearCell(tid);
    }
    if (flagsMatchBombs()) {
        clearInterval(timerID);
        info('You have won!', storeResult());
    }
}

function rightClick(e){
    let tid = e.target.id;
    let cell = document.getElementById(tid);

    // alternative if (e.target.tagName.toUpperCase() == 'I')
    if (e.target.nodeName.toUpperCase() == 'I') {
        e.preventDefault();
        // msg.innerHTML = e.target.nodeName;
        let cid = e.target.parentElement.id;
        let c = document.getElementById(cid);
        if (c.checked) {
            return
        }

        flagsUsed -= 1;
        c.flag = false;
        msg.value = flagsTotal - flagsUsed;
        c.innerHTML = '';

    }

    if (tid.indexOf('_') > -1){
        e.preventDefault();

        if (cell.checked) {
            return
        }
        else if (cell.innerHTML == flag_icon) {
            cell.innerHTML = '';
            flagsUsed -= 1;
            cell.flag = false;
            msg.value = flagsTotal - flagsUsed;
        }
        else {
            cell.innerHTML = flag_icon;
            cell.flag = true;
            flagsUsed += 1;
            msg.value = flagsTotal - flagsUsed;
        }
    }


    if (flagsMatchBombs()){
        clearInterval(timerID);
        info('You have won!', storeResult());
    }

}

function timeCounter(){
    if (!gameStarted){
        return
    }
    timeLapsed += 1;
    timer.value = timeLapsed;
}

function newGame(){
    gameStarted = true;
    msg2.innerHTML = '';
    msg2.style.display = 'none';
    clearInterval(timerID);
    timerID = window.setInterval(timeCounter, 1000);

    clearBoard();
    for (let r of radios) {
        if (r.checked) {
            initBoard(parseInt(r.value));
            break
        }
    }
}

function info(text, res){
    msg2.style.display = 'block';

    let t = `<h1>${text}</h1><hr/>`;
    if (res === null) {
        msg2.innerHTML = t;
        return
    }

    t += `<p>Your top results:</p>
    <ul class="empty">`;
    for (let r of res){
        t += `<li>${r} sec</li>`;
    }
    t += '</ul></br>';
    // t += '</ul><input id="clear_records" class="button" type="button" value="Clear records"/>';
    msg2.innerHTML = t;
    msg2.appendChild(hider);
    //~ hider.addEventListener('click', storageClear);
}

function clearBoard(){
    // thanks to Marceli :-)
    document.getElementById('stable').innerHTML = '';
}

function flagsMatchBombs(){
    let stable = document.getElementById('stable');
    let i = 0;
    let r = true;
    let [rows, cols, bombs] = gameLevels[currentGameLevel];
    for (let r of stable.children) {
        for (let d of r.children) {
            if (d.value != d.flag) {
                return false
            }
            i += (d.flag || d.checked)
        }
    }
    return i == rows * cols;
}

function storeResult(){
    const ls = localStorage;
    let res;
    if (ls.getItem(currentGameLevel) === null) {
        res = [timeLapsed];
    }
    else {
        res = JSON.parse(ls.getItem(currentGameLevel));
        if (res.length < 3) {
            res.push(timeLapsed);
            res.sort((x,y)=>x-y);

        }
        else if (timeLapsed < res[res.length - 1]) {
            res.push(timeLapsed);
            res.sort((x,y)=>x-y);
            res.pop();
        }
    }
    ls.setItem(currentGameLevel, JSON.stringify(res));
    return res;
}

function storageClear(){
    const ls = localStorage;
    if (!(ls.getItem(currentGameLevel) === null)) {
        ls.removeItem(currentGameLevel);
        msg2.style.display = 'none';
    }
}

// start as beginner
initBoard();
