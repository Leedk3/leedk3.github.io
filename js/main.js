// 스크롤 시 헤더 스타일 변경
window.addEventListener('scroll', function() {
    const header = document.querySelector('header');
    if (window.scrollY > 50) {
        header.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";
    } else {
        header.style.boxShadow = "none";
    }
});

// 디지털 반응형 배경
(function() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const activeGlyphs = ['1', '*', '#'];
    const pointer = { x: -9999, y: -9999, targetX: -9999, targetY: -9999, activeUntil: 0 };
    const ripples = [];
    let cells = [];
    let columns = 0;
    let rows = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let animationFrame = 0;
    let cellSize = 24;
    let lastTrailX = -9999;
    let lastTrailY = -9999;

    if (!ctx) {
        return;
    }

    canvas.className = 'digital-background';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);

    function randomActiveGlyph() {
        return activeGlyphs[Math.floor(Math.random() * activeGlyphs.length)];
    }

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        buildCells();
    }

    function buildCells() {
        const isSmall = width < 768;
        cellSize = isSmall ? 13 : 15;
        columns = Math.ceil(width / cellSize) + 4;
        rows = Math.ceil(height / cellSize) + 4;
        cells = [];

        for (let row = 0; row < rows; row += 1) {
            for (let column = 0; column < columns; column += 1) {
                cells.push({
                    x: (column - 2) * cellSize + (Math.random() - 0.5) * 1.2,
                    y: (row - 2) * cellSize + (Math.random() - 0.5) * 1.2,
                    column: column,
                    row: row,
                    glyph: '0',
                    intensity: 0,
                    phase: Math.random() * Math.PI * 2,
                    noise: Math.random()
                });
            }
        }
    }

    function setPointer(x, y, duration) {
        pointer.targetX = x;
        pointer.targetY = y;
        if (pointer.x < -1000) {
            pointer.x = x;
            pointer.y = y;
        }
        pointer.activeUntil = performance.now() + duration;
    }

    function activateCells(x, y, radius, strength) {
        const minColumn = Math.max(0, Math.floor(x / cellSize) - Math.ceil(radius / cellSize) - 2);
        const maxColumn = Math.min(columns - 1, Math.floor(x / cellSize) + Math.ceil(radius / cellSize) + 2);
        const minRow = Math.max(0, Math.floor(y / cellSize) - Math.ceil(radius / cellSize) - 2);
        const maxRow = Math.min(rows - 1, Math.floor(y / cellSize) + Math.ceil(radius / cellSize) + 2);

        for (let row = minRow; row <= maxRow; row += 1) {
            for (let column = minColumn; column <= maxColumn; column += 1) {
                const cell = cells[row * columns + column];
                const distance = Math.hypot(cell.x - x, cell.y - y);

                if (distance < radius) {
                    const force = (1 - distance / radius) * strength;
                    cell.intensity = Math.min(1.35, Math.max(cell.intensity, force));

                    if (cell.glyph === '0' || force > 0.8) {
                        cell.glyph = randomActiveGlyph();
                    }
                }
            }
        }
    }

    function addTrail(x, y) {
        const distance = Math.hypot(x - lastTrailX, y - lastTrailY);

        if (distance < 7) {
            return;
        }

        lastTrailX = x;
        lastTrailY = y;
        activateCells(x, y, width < 768 ? 54 : 68, 1);
    }

    function addRipple(x, y) {
        setPointer(x, y, 1500);
        activateCells(x, y, width < 768 ? 90 : 120, 1.18);
        ripples.push({
            x: x,
            y: y,
            radius: 0,
            life: 1
        });
    }

    function drawAmbientGlow(now) {
        const active = now < pointer.activeUntil;
        const baseX = width * (0.58 + Math.sin(now * 0.00025) * 0.12);
        const baseY = height * (0.34 + Math.cos(now * 0.00021) * 0.10);
        const glowX = active ? pointer.x : baseX;
        const glowY = active ? pointer.y : baseY;
        const radius = Math.max(width, height) * (active ? 0.52 : 0.42);
        const glow = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, radius);

        glow.addColorStop(0, active ? 'rgba(0, 224, 255, 0.34)' : 'rgba(0, 194, 224, 0.16)');
        glow.addColorStop(0.28, active ? 'rgba(199, 36, 177, 0.16)' : 'rgba(0, 194, 224, 0.07)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, width, height);
    }

    function drawMesh(now) {
        const pointerActive = now < pointer.activeUntil;
        const radius = width < 768 ? 150 : 210;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        cells.forEach(function(cell) {
            const wave = (Math.sin(now * 0.0015 + cell.phase) + 1) * 0.5;
            const active = cell.intensity;
            let glyph = active > 0.04 ? cell.glyph : '0';
            let alpha = 0.034 + wave * 0.034 + cell.noise * 0.018;
            let size = width < 768 ? 9 : 10;
            let x = cell.x;
            let y = cell.y;

            if (active > 0) {
                alpha += active * 0.64;
                size += active * 3.2;
                cell.intensity *= prefersReducedMotion ? 0.9 : 0.985;

                if (cell.intensity < 0.025) {
                    cell.intensity = 0;
                    cell.glyph = '0';
                    glyph = '0';
                }
            }

            if (pointerActive) {
                const dx = x - pointer.x;
                const dy = y - pointer.y;
                const distance = Math.hypot(dx, dy);

                if (distance < radius) {
                    const force = (1 - distance / radius);
                    alpha += force * 0.22;
                    size += force * 1.2;
                }
            }

            ripples.forEach(function(ripple) {
                const distance = Math.hypot(x - ripple.x, y - ripple.y);
                const band = Math.abs(distance - ripple.radius);

                if (band < 18) {
                    const force = (1 - band / 18) * ripple.life;
                    alpha += force * 0.25;
                    size += force * 1.8;
                }
            });

            ctx.font = '700 ' + size + 'px Menlo, Consolas, monospace';
            ctx.fillStyle = active > 0.04
                ? 'rgba(0, 224, 255, ' + alpha + ')'
                : 'rgba(118, 184, 196, ' + alpha + ')';
            ctx.fillText(glyph, x, y);
        });
    }

    function drawScanlines(now) {
        const lineGap = width < 768 ? 54 : 68;
        const offset = (now * 0.018) % lineGap;

        ctx.lineWidth = 1;
        for (let y = offset; y < height; y += lineGap) {
            ctx.strokeStyle = 'rgba(0, 224, 255, 0.035)';
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
    }

    function drawRipples() {
        for (let i = ripples.length - 1; i >= 0; i -= 1) {
            const ripple = ripples[i];
            ripple.radius += width < 768 ? 4.1 : 5.2;
            ripple.life -= 0.018;

            if (ripple.life <= 0) {
                ripples.splice(i, 1);
                continue;
            }

            ctx.strokeStyle = 'rgba(199, 36, 177, ' + (ripple.life * 0.22) + ')';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    function draw(now) {
        pointer.x += (pointer.targetX - pointer.x) * 0.16;
        pointer.y += (pointer.targetY - pointer.y) * 0.16;

        ctx.clearRect(0, 0, width, height);
        drawAmbientGlow(now);
        drawScanlines(now);
        drawMesh(now);
        drawRipples();

        if (!prefersReducedMotion) {
            animationFrame = requestAnimationFrame(draw);
        }
    }

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', function(event) {
        setPointer(event.clientX, event.clientY, 650);
        addTrail(event.clientX, event.clientY);

        if (prefersReducedMotion) {
            draw(performance.now());
        }
    }, { passive: true });
    window.addEventListener('pointerdown', function(event) {
        addRipple(event.clientX, event.clientY);

        if (prefersReducedMotion) {
            draw(performance.now());
        }
    }, { passive: true });

    resize();
    draw(0);

    window.addEventListener('beforeunload', function() {
        cancelAnimationFrame(animationFrame);
    });
}());
