var game;
function main() {
    game = new Game();
    game.init();
    game.startUpdating();
    game.startDrawing();
}
var Game = /** @class */ (function () {
    function Game() {
        this.updateInterval = 1000 / 60;
        this.drawInterval = 1000 / 60;
        this.colours = {
            background: '#005555',
            textNormal: '#AAAAAA',
            textSelected: '#00AA00',
            boxNormal: '#AAAAAA',
            boxSelected: '#00AA00',
        };
        this.fonts = {
            small: '16px Arial',
            medium: '22px Arial',
            large: '30px Arial',
        };
        this.canvas = document.getElementById('gameCanvas');
        this.context = this.canvas.getContext('2d');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    Game.prototype.init = function () {
        this.input = new Input(this.canvas);
        this.points = new Points();
        this.grid = new Grid();
        this.grid.init();
        this.blockTray = new BlockTray();
        this.blockTray.init();
        this.upgradeTray = new UpgradeTray();
        this.upgradeTray.init();
    };
    Game.prototype.update = function () {
        this.tooltip = null;
        this.input.update();
        this.grid.update();
        this.blockTray.update();
        this.upgradeTray.update();
    };
    Game.prototype.draw = function () {
        this.context.clearRect(0, 0, 800, 600);
        this.points.draw(this.context);
        this.grid.draw(this.context);
        this.blockTray.draw(this.context);
        this.upgradeTray.draw(this.context);
        if (this.tooltip != null) {
            this.tooltip.draw(this.context);
        }
    };
    Game.prototype.startUpdating = function () {
        var _this = this;
        setInterval(function () { return _this.update(); }, this.updateInterval);
    };
    Game.prototype.startDrawing = function () {
        var _this = this;
        setInterval(function () { return _this.draw(); }, this.drawInterval);
    };
    return Game;
}());
var MouseState = /** @class */ (function () {
    function MouseState(x, y, down) {
        this.x = x;
        this.y = y;
        this.down = down;
    }
    return MouseState;
}());
var Input = /** @class */ (function () {
    function Input(canvas) {
        var _this = this;
        this.previousMouseState = new MouseState(0, 0, false);
        this.currentMouseState = new MouseState(0, 0, false);
        this.runningMouseState = new MouseState(0, 0, false);
        canvas.addEventListener('mousedown', function () { return _this.runningMouseState.down = true; });
        canvas.addEventListener('mouseup', function () { return _this.runningMouseState.down = false; });
        canvas.addEventListener('mousemove', function (event) {
            var target = event.currentTarget;
            var rect = target.getBoundingClientRect();
            _this.runningMouseState.x = event.clientX - rect.left;
            _this.runningMouseState.y = event.clientY - rect.top;
        });
    }
    Input.prototype.update = function () {
        this.previousMouseState = this.currentMouseState;
        this.currentMouseState = new MouseState(this.runningMouseState.x, this.runningMouseState.y, this.runningMouseState.down);
    };
    Input.prototype.getX = function () {
        return this.currentMouseState.x;
    };
    Input.prototype.getY = function () {
        return this.currentMouseState.y;
    };
    Input.prototype.isUp = function () {
        return !this.currentMouseState.down;
    };
    Input.prototype.isDown = function () {
        return this.currentMouseState.down;
    };
    Input.prototype.isClicked = function () {
        return this.currentMouseState.down && !this.previousMouseState.down;
    };
    Input.prototype.isReleased = function () {
        return !this.currentMouseState.down && this.previousMouseState.down;
    };
    return Input;
}());
var Grid = /** @class */ (function () {
    function Grid() {
        this.width = 1;
        this.height = 1;
        this.offsetX = 10;
        this.offsetY = 10;
        this.padding = 5;
        this.size = 50;
        this.paddedSize = this.size - this.padding;
        this.paddedOffsetX = this.offsetX + this.padding;
        this.paddedOffsetY = this.offsetY + this.padding;
        this.updateTime = 1000;
        this.currentTime = 0;
    }
    Grid.prototype.init = function () {
        this.grid = [];
        for (var x = 0; x < this.width; x++) {
            var arr = [];
            for (var y = 0; y < this.height; y++) {
                arr.push(0);
            }
            this.grid.push(arr);
        }
    };
    Grid.prototype.update = function () {
        var input = game.input;
        var inputX = input.getX();
        var inputY = input.getY();
        if (input.isClicked() && game.blockTray.canPurchase()) {
            for (var x = 0; x < this.width; x++) {
                for (var y = 0; y < this.height; y++) {
                    if (this.grid[x][y] === 0 && pointWithinRectangle(inputX, inputY, this.paddedOffsetX + x * this.size, this.paddedOffsetY + y * this.size, this.paddedSize, this.paddedSize)) {
                        this.grid[x][y] = game.blockTray.purchase();
                    }
                }
            }
        }
        this.currentTime += game.updateInterval;
        if (this.currentTime >= this.updateTime) {
            this.currentTime -= this.updateTime;
            for (var x = 0; x < this.width; x++) {
                for (var y = 0; y < this.height; y++) {
                    var cell = this.grid[x][y];
                    game.points.points += cell;
                }
            }
        }
    };
    Grid.prototype.draw = function (context) {
        context.strokeStyle = game.colours.boxNormal;
        context.fillStyle = game.colours.textNormal;
        context.font = game.fonts.large;
        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                var rectX = this.paddedOffsetX + x * this.size;
                var rectY = this.paddedOffsetY + y * this.size;
                context.strokeRect(rectX, rectY, this.paddedSize, this.paddedSize);
                var cell = this.grid[x][y];
                if (cell !== 0) {
                    context.fillText(cell.toString(), rectX + 10, rectY + 35);
                }
            }
        }
    };
    Grid.prototype.adjustGrid = function () {
        for (var x = 0; x < this.width; x++) {
            if (this.grid.length > x) {
                var arr = this.grid[x];
                for (var toAdd = this.height - arr.length; toAdd--; toAdd > 0) {
                    arr.push(0);
                }
                this.grid[x] = arr;
            }
            else {
                var arr = [];
                for (var y = 0; y < this.height; y++) {
                    arr.push(0);
                }
                this.grid.push(arr);
            }
        }
    };
    return Grid;
}());
var Points = /** @class */ (function () {
    function Points() {
        this.points = 10;
    }
    Points.prototype.draw = function (context) {
        context.font = game.fonts.large;
        context.fillStyle = game.colours.textNormal;
        context.fillText(this.points.toString(), 20, 550);
    };
    return Points;
}());
var BlockInfo = /** @class */ (function () {
    function BlockInfo(cost, id, name, char) {
        this.cost = cost;
        this.id = id;
        this.name = name;
        this.char = char;
    }
    BlockInfo.prototype.draw = function (context, x, y, selected) {
        context.strokeStyle = selected ? game.colours.boxSelected : game.colours.boxNormal;
        context.strokeRect(x, y, 45, 45);
        context.font = game.fonts.large;
        context.fillStyle = selected ? game.colours.textSelected : game.colours.textNormal;
        context.fillText(this.char, x + 10, y + 35);
    };
    return BlockInfo;
}());
var BlockTray = /** @class */ (function () {
    function BlockTray() {
        this.blocks = [];
        this.selected = -1;
        this.offsetX = 20;
        this.offsetY = 450;
    }
    BlockTray.prototype.init = function () {
        this.blocks = [
            new BlockInfo(10, 1, 'Incrementer', 'I'),
            new BlockInfo(20, 2, 'Adder', 'A'),
        ];
    };
    BlockTray.prototype.update = function () {
        var input = game.input;
        if (input.isClicked()) {
            var x = input.getX();
            var y = input.getY();
            for (var i = 0; i < this.blocks.length; i++) {
                if (pointWithinRectangle(x, y, this.offsetX + (50 * i), this.offsetY, 45, 45)) {
                    this.selected = this.selected === i ? -1 : i;
                }
            }
        }
    };
    BlockTray.prototype.draw = function (context) {
        for (var i = 0; i < this.blocks.length; i++) {
            this.blocks[i].draw(context, this.offsetX + (50 * i), this.offsetY, i === this.selected);
        }
    };
    BlockTray.prototype.canPurchase = function () {
        return this.selected !== -1 && game.points.points >= this.blocks[this.selected].cost;
    };
    BlockTray.prototype.purchase = function () {
        var block = this.blocks[this.selected];
        game.points.points -= block.cost;
        return block.id;
    };
    return BlockTray;
}());
var UpgradeInfo = /** @class */ (function () {
    function UpgradeInfo(cost, name, char, action) {
        this.cost = cost;
        this.name = name;
        this.char = char;
        this.action = action;
    }
    UpgradeInfo.prototype.draw = function (context, x, y) {
        context.strokeStyle = game.colours.boxNormal;
        context.strokeRect(x, y, 45, 45);
        context.font = game.fonts.large;
        context.fillStyle = game.colours.textNormal;
        context.fillText(this.char, x + 10, y + 35);
    };
    return UpgradeInfo;
}());
var UpgradeTray = /** @class */ (function () {
    function UpgradeTray() {
        this.upgrades = [];
        this.offsetX = 20;
        this.offsetY = 400;
    }
    UpgradeTray.prototype.init = function () {
        this.upgrades = [
            new UpgradeInfo(15, 'Bigginator', '-', function () {
                game.grid.width += 1;
                game.grid.height += 1;
                game.grid.adjustGrid();
            })
        ];
    };
    UpgradeTray.prototype.update = function () {
        var input = game.input;
        var x = input.getX();
        var y = input.getY();
        console.log('here11');
        for (var i = 0; i < this.upgrades.length; i++) {
            console.log('here2');
            if (pointWithinRectangle(x, y, this.offsetX + (50 * i), this.offsetY, 45, 45)) {
                var upgrade = this.upgrades[i];
                if (input.isClicked() && upgrade.cost <= game.points.points) {
                    game.points.points -= upgrade.cost;
                    upgrade.action();
                }
                console.log('here3');
                game.tooltip = new Tooltip(upgrade.name, 'Tooltip text here, blah blah blah.', x, y);
            }
        }
    };
    UpgradeTray.prototype.draw = function (context) {
        for (var i = 0; i < this.upgrades.length; i++) {
            this.upgrades[i].draw(context, this.offsetX + (50 * i), this.offsetY);
        }
    };
    return UpgradeTray;
}());
var Tooltip = /** @class */ (function () {
    function Tooltip(title, text, x, y) {
        this.title = title;
        this.text = text;
        this.x = x;
        this.y = y;
    }
    Tooltip.prototype.draw = function (context) {
        context.font = game.fonts.large;
        var titleWidth = context.measureText(this.title).width;
        context.font = game.fonts.medium;
        var textWidth = context.measureText(this.text).width;
        var width = Math.max(titleWidth, textWidth) + 10;
        context.fillStyle = game.colours.background;
        context.fillRect(this.x, this.y, width, 60);
        context.strokeStyle = game.colours.boxNormal;
        context.strokeRect(this.x, this.y, width, 60);
        context.fillStyle = game.colours.textNormal;
        context.font = game.fonts.large;
        context.fillText(this.title, this.x + 5, this.y);
        context.font = game.fonts.medium;
        context.fillText(this.text, this.x + 5, this.y + 35);
    };
    return Tooltip;
}());
function pointWithinRectangle(px, py, rx, ry, rw, rh) {
    return px >= rx
        && px <= rx + rw
        && py >= ry
        && py <= ry + rh;
}
window.onload = main;
//# sourceMappingURL=main.js.map