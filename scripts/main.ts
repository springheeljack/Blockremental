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

    updateInterval = 1000 / 60;
    drawInterval = 1000 / 60;

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
        this.input.update();

        this.grid.update();

        this.blockTray.update();

        this.upgradeTray.update();
    }

    draw() {
        this.context.clearRect(0, 0, 800, 600);

        this.points.draw(this.context);

        this.grid.draw(this.context);

        this.blockTray.draw(this.context);

        this.upgradeTray.draw(this.context);
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

    updateTime = 1000;
    currentTime = 0;

    grid: number[][];

    init() {
        this.grid = [];
        for (let x = 0; x < this.width; x++) {
            const arr = [];
            for (let y = 0; y < this.height; y++) {
                arr.push(0);
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
                    if (this.grid[x][y] === 0 && pointWithinRectangle(inputX, inputY,
                        this.paddedOffsetX + x * this.size,
                        this.paddedOffsetY + y * this.size,
                        this.paddedSize, this.paddedSize)) {
                        this.grid[x][y] = game.blockTray.purchase();
                    }
                }
            }
        }

        this.currentTime += game.updateInterval;
        if (this.currentTime >= this.updateTime) {
            this.currentTime -= this.updateTime;

            for (let x = 0; x < this.width; x++) {
                for (let y = 0; y < this.height; y++) {
                    const cell = this.grid[x][y];
                    game.points.points += cell;
                }
            }
        }
    }

    draw(context: Context) {
        context.strokeStyle = '#AAAAAA';
        context.fillStyle = '#AAAAAA';
        context.font = '30px Arial';

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
                if (cell !== 0) {
                    context.fillText(cell.toString(), rectX + 10, rectY + 35);
                }
            }
        }
    }

    adjustGrid() {
        for (let x = 0; x < this.width; x++) {
            if (this.grid.length > x) {
                const arr = this.grid[x];
                for (let toAdd = this.height - arr.length; toAdd--; toAdd > 0) {
                    arr.push(0);
                }
                this.grid[x] = arr;
            }
            else {
                const arr = [];
                for (let y = 0; y < this.height; y++) {
                    arr.push(0);
                }
                this.grid.push(arr);
            }
        }
    }
}

class Points {
    points = 10;

    draw(context: Context) {
        context.fillStyle = '#AAAAAA';
        context.font = '30px Arial';
        context.fillText(this.points.toString(), 20, 550);
    }
}

class BlockInfo {
    constructor(
        public cost: number,
        public id: number,
        public name: string,
        public char: string,
    ) { }

    draw(context: Context, x: number, y: number, selected: boolean) {
        const colour = selected ? '#00AA00' : '#AAAAAA';
        context.strokeStyle = colour;
        context.fillStyle = colour;

        context.strokeRect(x, y, 45, 45);

        context.font = '30px Arial';
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
            new BlockInfo(10, 1, 'Incrementer', 'I'),
            new BlockInfo(20, 2, 'Adder', 'A'),
        ]
    }

    update() {
        const input = game.input;

        if (input.isClicked()) {
            const x = input.getX();
            const y = input.getY();

            for (let i = 0; i < this.blocks.length; i++) {
                if (pointWithinRectangle(x, y, this.offsetX + (50 * i), this.offsetY, 45, 45)) {
                    this.selected = this.selected === i ? -1 : i;
                }
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

        return block.id;
    }
}

class UpgradeInfo {
    constructor(
        public cost: number,
        public name: string,
        public char: string,
        public action: Function
    ) { }

    draw(context: Context, x: number, y: number) {
        const colour = '#AAAAAA';
        context.strokeStyle = colour;
        context.fillStyle = colour;

        context.strokeRect(x, y, 45, 45);

        context.font = '30px Arial';
        context.fillText(this.char, x + 10, y + 35);
    }
}

class UpgradeTray {
    upgrades: UpgradeInfo[] = [];

    offsetX = 20;
    offsetY = 400;

    init() {
        this.upgrades = [
            new UpgradeInfo(15, 'Bigginator', '+', () => {
                game.grid.width += 1;
                game.grid.height += 1;
                game.grid.adjustGrid();
            })
        ]
    }

    update() {
        const input = game.input;

        if (input.isClicked()) {
            const x = input.getX();
            const y = input.getY();

            for (let i = 0; i < this.upgrades.length; i++) {
                if (pointWithinRectangle(x, y, this.offsetX + (50 * i), this.offsetY, 45, 45)) {
                    const upgrade = this.upgrades[i];

                    if (upgrade.cost <= game.points.points) {
                        game.points.points -= upgrade.cost;
                        upgrade.action();
                    }
                }
            }
        }
    }

    draw(context: Context) {
        for (let i = 0; i < this.upgrades.length; i++) {
            this.upgrades[i].draw(context, this.offsetX + (50 * i), this.offsetY);
        }
    }
}

function pointWithinRectangle(px: number, py: number, rx: number, ry: number, rw: number, rh: number) {
    return px >= rx
        && px <= rx + rw
        && py >= ry
        && py <= ry + rh;
}

window.onload = main;