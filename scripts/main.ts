type Context = CanvasRenderingContext2D;
type Canvas = HTMLCanvasElement;

let game: Game;

function main() {
    game = new Game();

    game.init();

    game.startUpdating();

    game.startDrawing();
}

class Game {
    canvas: Canvas;
    context: Context;

    input: Input;
    grid: Grid;
    points: Points;
    blockTray: BlockTray;
    upgradeTray: UpgradeTray;
    tooltip: Tooltip;

    updateInterval = 1000 / 60;
    drawInterval = 1000 / 60;

    colours = {
        background: '#005555',
        textNormal: '#AAAAAA',
        textGood: '#00AA00',
        textBad: '#AA0000',
        boxNormal: '#AAAAAA',
        boxGood: '#00AA00',
        boxBad: '#AA0000',
    }

    fonts = {
        small: '16px Arial',
        medium: '22px Arial',
        large: '30px Arial',
    }

    constructor() {
        this.canvas = document.getElementById('gameCanvas') as Canvas;
        this.context = this.canvas.getContext('2d');

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    init() {
        this.input = new Input(this.canvas);

        this.points = new Points();

        this.grid = new Grid();
        this.grid.init();

        this.blockTray = new BlockTray();
        this.blockTray.init();

        this.upgradeTray = new UpgradeTray();
        this.upgradeTray.init();
    }

    update() {
        this.tooltip = null;

        this.input.update();

        this.grid.update();

        this.blockTray.update();

        this.upgradeTray.update();

        this.points.update();
    }

    draw() {
        this.context.clearRect(0, 0, 800, 600);

        this.points.draw(this.context);

        this.grid.draw(this.context);

        this.blockTray.draw(this.context);

        this.upgradeTray.draw(this.context);

        if (this.tooltip != null) {
            this.tooltip.draw(this.context);
        }
    }

    startUpdating() {
        setInterval(() => this.update(), this.updateInterval);
    }

    startDrawing() {
        setInterval(() => this.draw(), this.drawInterval);
    }
}

class MouseState {
    constructor(
        public x: number,
        public y: number,
        public down: boolean,
    ) { }
}

class Input {
    private previousMouseState: MouseState;
    private currentMouseState: MouseState;
    private runningMouseState: MouseState

    constructor(canvas: Canvas) {
        this.previousMouseState = new MouseState(0, 0, false);
        this.currentMouseState = new MouseState(0, 0, false);
        this.runningMouseState = new MouseState(0, 0, false);

        canvas.addEventListener('mousedown', () => this.runningMouseState.down = true);
        canvas.addEventListener('mouseup', () => this.runningMouseState.down = false);
        canvas.addEventListener('mousemove', (event) => {
            const target = event.currentTarget as Element;
            const rect = target.getBoundingClientRect();
            this.runningMouseState.x = event.clientX - rect.left;
            this.runningMouseState.y = event.clientY - rect.top;
        });
    }

    update() {
        this.previousMouseState = this.currentMouseState;
        this.currentMouseState = new MouseState(this.runningMouseState.x, this.runningMouseState.y, this.runningMouseState.down);
    }

    getX() {
        return this.currentMouseState.x;
    }

    getY() {
        return this.currentMouseState.y;
    }

    isUp() {
        return !this.currentMouseState.down;
    }

    isDown() {
        return this.currentMouseState.down;
    }

    isClicked() {
        return this.currentMouseState.down && !this.previousMouseState.down;
    }

    isReleased() {
        return !this.currentMouseState.down && this.previousMouseState.down;
    }
}

class Grid {
    width = 1;
    height = 1;
    offsetX = 10;
    offsetY = 10;
    padding = 5;
    size = 50;
    paddedSize = this.size - this.padding;
    paddedOffsetX = this.offsetX + this.padding;
    paddedOffsetY = this.offsetY + this.padding;

    grid: BlockType[][];

    init() {
        this.grid = [];
        for (let x = 0; x < this.width; x++) {
            const arr: BlockType[] = [];
            for (let y = 0; y < this.height; y++) {
                arr.push(BlockType.Empty);
            }
            this.grid.push(arr);
        }
    }

    update() {
        const input = game.input;
        const inputX = input.getX();
        const inputY = input.getY();

        if (input.isClicked() && game.blockTray.canPurchase()) {
            for (let x = 0; x < this.width; x++) {
                for (let y = 0; y < this.height; y++) {
                    if (this.grid[x][y] === BlockType.Empty && pointWithinRectangle(inputX, inputY,
                        this.paddedOffsetX + x * this.size,
                        this.paddedOffsetY + y * this.size,
                        this.paddedSize, this.paddedSize)) {
                        this.grid[x][y] = game.blockTray.purchase();
                        this.updatePointsPerTick();
                    }
                }
            }
        }
    }

    draw(context: Context) {
        context.strokeStyle = game.colours.boxNormal;
        context.fillStyle = game.colours.textNormal;
        context.font = game.fonts.large;

        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {

                const rectX = this.paddedOffsetX + x * this.size;
                const rectY = this.paddedOffsetY + y * this.size;

                context.strokeRect(
                    rectX,
                    rectY,
                    this.paddedSize,
                    this.paddedSize);

                const cell = this.grid[x][y];
                if (cell !== BlockType.Empty) {
                    context.fillText(cell.toString(), rectX + 10, rectY + 35);
                }
            }
        }
    }

    adjustGridSize() {
        for (let x = 0; x < this.width; x++) {
            if (this.grid.length > x) {
                const arr = this.grid[x];
                for (let toAdd = this.height - arr.length; toAdd--; toAdd > 0) {
                    arr.push(BlockType.Empty);
                }
                this.grid[x] = arr;
            }
            else {
                const arr = [];
                for (let y = 0; y < this.height; y++) {
                    arr.push(BlockType.Empty);
                }
                this.grid.push(arr);
            }
        }
    }

    updatePointsPerTick() {
        const pointGrid: number[][] = [];
        const adderGrid: number[][] = [];

        for (let x = 0; x < this.width; x++) {
            const arr: number[] = [];
            for (let y = 0; y < this.height; y++) {
                arr.push(this.grid[x][y] === BlockType.Incrementor ? 1 : 0);
            }
            pointGrid.push(arr);
        }

        for (let x = 0; x < this.width; x++) {
            const arr: number[] = [];
            for (let y = 0; y < this.height; y++) {
                arr.push(this.grid[x][y] === BlockType.Adder ? 1 : 0);
            }
            adderGrid.push(arr);
        }

        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                if (this.grid[x][y] === BlockType.Doubler) {
                    this.tryDoubleCoord(x - 1, y, adderGrid);
                    this.tryDoubleCoord(x + 1, y, adderGrid);
                    this.tryDoubleCoord(x, y - 1, adderGrid);
                    this.tryDoubleCoord(x, y + 1, adderGrid);
                }
            }
        }

        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                if (this.grid[x][y] === BlockType.Adder) {
                    this.tryIncrementCoord(x - 1, y, pointGrid, adderGrid[x][y]);
                    this.tryIncrementCoord(x + 1, y, pointGrid, adderGrid[x][y]);
                    this.tryIncrementCoord(x, y - 1, pointGrid, adderGrid[x][y]);
                    this.tryIncrementCoord(x, y + 1, pointGrid, adderGrid[x][y]);
                }
            }
        }

        let total = 0;
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                total += pointGrid[x][y];
            }
        }

        game.points.pointsPerTick = total;
    }

    getBlockTypeOfCoord(x: number, y: number) {
        return x <= -1 || y <= -1 || x >= this.width || y >= this.height ? BlockType.Empty : this.grid[x][y];
    }

    tryIncrementCoord(x: number, y: number, grid: number[][], incrementAmount: number) {
        if (this.getBlockTypeOfCoord(x, y) === BlockType.Incrementor) {
            grid[x][y] += incrementAmount;
        }
    }

    tryDoubleCoord(x: number, y: number, grid: number[][]) {
        if (this.getBlockTypeOfCoord(x, y) === BlockType.Adder) {
            grid[x][y] *= 2;
        }
    }
}

class Points {
    points = 1000;
    pointsPerTick = 0;
    updateTime = 1000;
    currentTime = 0;

    update() {
        this.currentTime += game.updateInterval;
        if (this.currentTime >= this.updateTime) {
            this.currentTime -= this.updateTime;

            this.points += this.pointsPerTick;
        }
    }

    draw(context: Context) {
        context.font = game.fonts.large;
        context.fillStyle = game.colours.textNormal;
        context.fillText(this.points.toString(), 20, 550);

        context.fillText('+' + this.pointsPerTick.toString() + '/s', 20, 580);
    }
}

class BlockInfo {
    constructor(
        public cost: number,
        public type: BlockType,
        public name: string,
        public char: string,
        public description: string,
    ) { }

    draw(context: Context, x: number, y: number, selected: boolean) {
        context.strokeStyle = selected ? game.colours.boxGood : game.colours.boxNormal;
        context.strokeRect(x, y, 45, 45);

        context.font = game.fonts.large;
        context.fillStyle = selected ? game.colours.textGood : game.colours.textNormal;
        context.fillText(this.char, x + 10, y + 35);
    }
}

class BlockTray {
    blocks: BlockInfo[] = [];
    selected = -1;

    offsetX = 20;
    offsetY = 450;

    init() {
        this.blocks = [
            new BlockInfo(10, BlockType.Incrementor, 'Incrementor', 'I', 'Collects 1 point per second.'),
            new BlockInfo(20, BlockType.Adder, 'Adder', 'A', 'Increases the points collected by adjacent Incrementors by 1.'),
            new BlockInfo(30, BlockType.Doubler, 'Doubler', 'D', 'Doubles the effectiveness of adjacent Adders.'),
        ]
    }

    update() {
        const input = game.input;

        const x = input.getX();
        const y = input.getY();

        for (let i = 0; i < this.blocks.length; i++) {
            if (pointWithinRectangle(x, y, this.offsetX + (50 * i), this.offsetY, 45, 45)) {
                const block = this.blocks[i];

                if (input.isClicked()) {
                    this.selected = this.selected === i ? -1 : i;
                }

                game.tooltip = new Tooltip(block.name, block.description, x, y, block.cost);
            }
        }
    }

    draw(context: Context) {
        for (let i = 0; i < this.blocks.length; i++) {
            this.blocks[i].draw(context, this.offsetX + (50 * i), this.offsetY, i === this.selected);
        }
    }

    canPurchase() {
        return this.selected !== -1 && game.points.points >= this.blocks[this.selected].cost;
    }

    purchase() {
        const block = this.blocks[this.selected];

        game.points.points -= block.cost;

        return block.type;
    }
}

class UpgradeInfo {
    constructor(
        public cost: number,
        public name: string,
        public description: string,
        public char: string,
        public action: Function
    ) { }

    draw(context: Context, x: number, y: number) {
        context.strokeStyle = game.colours.boxNormal;
        context.strokeRect(x, y, 45, 45);

        context.font = game.fonts.large;
        context.fillStyle = game.colours.textNormal;
        context.fillText(this.char, x + 10, y + 35);
    }
}

class UpgradeTray {
    upgrades: UpgradeInfo[] = [];

    offsetX = 20;
    offsetY = 400;

    init() {
        this.upgrades = [
            new UpgradeInfo(15, 'Bigger grid', 'Increases the size of the grid by 1.', '+', () => {
                game.grid.width += 1;
                game.grid.height += 1;
                game.grid.adjustGridSize();
            })
        ]
    }

    update() {
        const input = game.input;

        const x = input.getX();
        const y = input.getY();

        for (let i = 0; i < this.upgrades.length; i++) {
            if (pointWithinRectangle(x, y, this.offsetX + (50 * i), this.offsetY, 45, 45)) {
                const upgrade = this.upgrades[i];

                if (input.isClicked() && upgrade.cost <= game.points.points) {
                    game.points.points -= upgrade.cost;
                    upgrade.action();
                }

                game.tooltip = new Tooltip(upgrade.name, upgrade.description, x, y, upgrade.cost);
            }
        }
    }

    draw(context: Context) {
        for (let i = 0; i < this.upgrades.length; i++) {
            this.upgrades[i].draw(context, this.offsetX + (50 * i), this.offsetY);
        }
    }
}

class Tooltip {
    constructor(
        public title: string,
        public text: string,
        public x: number,
        public y: number,
        public cost: number = null,
    ) { }

    draw(context: Context) {
        const height = this.getHeight();
        const top = this.getTop();

        const width = this.getWidth(context);

        context.fillStyle = game.colours.background;
        context.fillRect(this.x, top, width, height);

        context.strokeStyle = game.colours.boxNormal;
        context.strokeRect(this.x, top, width, height);

        context.fillStyle = game.colours.textNormal;
        context.font = game.fonts.large;
        context.fillText(this.title, this.x + 5, top + 30);

        context.font = game.fonts.medium;
        context.fillText(this.text, this.x + 5, top + 55);

        if (this.cost != null) {
            context.font = game.fonts.medium;
            context.fillText(this.getCostPrefix(), this.x + 5, top + 80);

            context.fillStyle = this.cost <= game.points.points ? game.colours.textGood : game.colours.textBad;
            context.fillText(this.cost.toString(), this.x + 5 + this.getCostPrefixWidth(context), top + 80);
        }
    }

    getHeight() {
        return this.cost == null ? 60 : 90;
    }

    getTop() {
        return this.y - this.getHeight();
    }

    getCostPrefix() {
        return 'Cost: ';
    }

    getCostPrefixWidth(context: Context) {
        return context.measureText(this.getCostPrefix()).width;
    }

    getWidth(context: Context) {
        context.font = game.fonts.large;
        const titleWidth = context.measureText(this.title).width;
        context.font = game.fonts.medium;
        const textWidth = context.measureText(this.text).width;

        if (this.cost == null) {
            return Math.max(titleWidth, textWidth) + 10;
        }

        context.font = game.fonts.medium;
        const costWidth = context.measureText(this.getCostPrefix() + this.cost.toString()).width;
        return Math.max(titleWidth, textWidth, costWidth) + 10;
    }
}

function pointWithinRectangle(px: number, py: number, rx: number, ry: number, rw: number, rh: number) {
    return px >= rx
        && px <= rx + rw
        && py >= ry
        && py <= ry + rh;
}

enum BlockType {
    Empty = 0,
    Incrementor = 1,
    Adder = 2,
    Doubler = 3
}

window.onload = main;