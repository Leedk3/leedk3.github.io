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
    const hotGlyphs = ['>', '*'];
    const trailGlyphs = ['1', '-'];
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
    let lastDrawAt = -Infinity;

    if (!ctx) {
        return;
    }

    canvas.className = 'digital-background';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);

    function randomHotGlyph() {
        return hotGlyphs[Math.floor(Math.random() * hotGlyphs.length)];
    }

    function randomTrailGlyph() {
        return trailGlyphs[Math.floor(Math.random() * trailGlyphs.length)];
    }

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 1.35);
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
        cellSize = isSmall ? 16 : 18;
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
                    hotGlyph: randomHotGlyph(),
                    trailGlyph: randomTrailGlyph(),
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

                    if (force > 0.72) {
                        cell.hotGlyph = randomHotGlyph();
                    } else if (cell.intensity < 0.18) {
                        cell.trailGlyph = randomTrailGlyph();
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
            let glyph = '0';
            let alpha = 0.034 + wave * 0.034 + cell.noise * 0.018;
            let size = width < 768 ? 9 : 10;
            let x = cell.x;
            let y = cell.y;

            if (active > 0) {
                glyph = active > 0.62 ? cell.hotGlyph : cell.trailGlyph;
                alpha += active * 0.64;
                size += active * 3.2;
                cell.intensity *= prefersReducedMotion ? 0.9 : 0.985;

                if (cell.intensity < 0.025) {
                    cell.intensity = 0;
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
        const targetFrameDuration = width < 768 ? 50 : 33;

        if (now - lastDrawAt < targetFrameDuration) {
            if (!prefersReducedMotion) {
                animationFrame = requestAnimationFrame(draw);
            }
            return;
        }

        lastDrawAt = now;
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

    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            cancelAnimationFrame(animationFrame);
            return;
        }

        lastDrawAt = 0;
        animationFrame = requestAnimationFrame(draw);
    });
}());

// 히어로 AI 흐름 배경
(function() {
    const hero = document.querySelector('.hero');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!hero) {
        return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let dpr = 1;
    let animationFrame = 0;
    let pointerX = 0.58;
    let pointerY = 0.42;
    let targetX = 0.58;
    let targetY = 0.42;
    let lastDrawAt = -Infinity;

    if (!ctx) {
        return;
    }

    canvas.className = 'ai-flow-background';
    canvas.setAttribute('aria-hidden', 'true');
    hero.prepend(canvas);

    function resize() {
        const rect = hero.getBoundingClientRect();
        dpr = Math.min(window.devicePixelRatio || 1, 1.35);
        width = Math.max(1, rect.width);
        height = Math.max(1, rect.height);
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function waveY(progress, baseY, amplitude, speed, index, influenceX, influenceY) {
        const main = Math.sin(progress * Math.PI * 2.4 + speed + index * 0.7);
        const secondary = Math.sin(progress * Math.PI * 5.2 - speed * 0.72 + index) * 0.42;
        const swell = Math.sin(progress * Math.PI * 1.1 + speed * 0.45) * 0.28;
        const x = progress * width;
        const pull = Math.exp(-Math.abs(x - influenceX) / (width * 0.26));

        return baseY + (main + secondary + swell) * amplitude + (influenceY - baseY) * pull * 0.08;
    }

    function drawWaveBand(now, index, fillColor, strokeColor) {
        const waveCount = 26;
        const baseY = height * (0.33 + index * 0.115);
        const amplitude = height * (0.045 + index * 0.014);
        const thickness = height * (0.16 + index * 0.035);
        const speed = now * (0.00046 + index * 0.00006);
        const influenceX = pointerX * width;
        const influenceY = pointerY * height;

        ctx.beginPath();

        for (let i = 0; i <= waveCount; i += 1) {
            const progress = i / waveCount;
            const x = progress * width;
            const y = waveY(progress, baseY, amplitude, speed, index, influenceX, influenceY);

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                const prevProgress = (i - 0.5) / waveCount;
                const cpX = prevProgress * width;
                const cpY = waveY(prevProgress, baseY, amplitude, speed, index, influenceX, influenceY);
                ctx.quadraticCurveTo(cpX, cpY, x, y);
            }
        }

        for (let i = waveCount; i >= 0; i -= 1) {
            const progress = i / waveCount;
            const x = progress * width;
            const y = waveY(progress, baseY + thickness, amplitude * 0.62, speed + 1.8, index, influenceX, influenceY);
            ctx.lineTo(x, y);
        }

        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();

        ctx.beginPath();
        for (let i = 0; i <= waveCount; i += 1) {
            const progress = i / waveCount;
            const x = progress * width;
            const y = waveY(progress, baseY, amplitude, speed, index, influenceX, influenceY);

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                const prevProgress = (i - 0.5) / waveCount;
                const cpX = prevProgress * width;
                const cpY = waveY(prevProgress, baseY, amplitude, speed, index, influenceX, influenceY);
                ctx.quadraticCurveTo(cpX, cpY, x, y);
            }
        }

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = Math.max(1.2, height * (0.006 - index * 0.00045));
        ctx.lineCap = 'round';
        ctx.shadowColor = strokeColor;
        ctx.shadowBlur = 22 + index * 4;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    function drawField(now) {
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#02050B');
        gradient.addColorStop(0.45, '#07101D');
        gradient.addColorStop(1, '#130818');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        pointerX += (targetX - pointerX) * 0.035;
        pointerY += (targetY - pointerY) * 0.035;

        const glowX = pointerX * width;
        const glowY = pointerY * height;
        const glow = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, Math.max(width, height) * 0.72);
        glow.addColorStop(0, 'rgba(0, 224, 255, 0.24)');
        glow.addColorStop(0.34, 'rgba(199, 36, 177, 0.13)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, width, height);

        ctx.globalCompositeOperation = 'screen';
        drawWaveBand(now, 0, 'rgba(0, 194, 224, 0.080)', 'rgba(0, 224, 255, 0.30)');
        drawWaveBand(now, 1, 'rgba(77, 210, 255, 0.060)', 'rgba(77, 210, 255, 0.22)');
        drawWaveBand(now, 2, 'rgba(199, 36, 177, 0.075)', 'rgba(199, 36, 177, 0.25)');
        drawWaveBand(now, 3, 'rgba(0, 194, 224, 0.050)', 'rgba(0, 194, 224, 0.17)');
        drawWaveBand(now, 4, 'rgba(255, 255, 255, 0.030)', 'rgba(255, 255, 255, 0.10)');
        ctx.globalCompositeOperation = 'source-over';

        const meshStep = width < 768 ? 44 : 58;
        ctx.strokeStyle = 'rgba(0, 224, 255, 0.035)';
        ctx.lineWidth = 1;

        for (let x = (now * 0.012) % meshStep; x < width; x += meshStep) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x + Math.sin(now * 0.0009 + x) * 18, height);
            ctx.stroke();
        }
    }

    function draw(now) {
        const targetFrameDuration = width < 768 ? 50 : 33;

        if (now - lastDrawAt < targetFrameDuration) {
            if (!prefersReducedMotion) {
                animationFrame = requestAnimationFrame(draw);
            }
            return;
        }

        lastDrawAt = now;
        ctx.clearRect(0, 0, width, height);
        drawField(now);

        if (!prefersReducedMotion) {
            animationFrame = requestAnimationFrame(draw);
        }
    }

    hero.addEventListener('pointermove', function(event) {
        const rect = hero.getBoundingClientRect();
        targetX = (event.clientX - rect.left) / rect.width;
        targetY = (event.clientY - rect.top) / rect.height;

        if (prefersReducedMotion) {
            draw(performance.now());
        }
    }, { passive: true });

    window.addEventListener('resize', resize);

    resize();
    draw(0);

    window.addEventListener('beforeunload', function() {
        cancelAnimationFrame(animationFrame);
    });

    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            cancelAnimationFrame(animationFrame);
            return;
        }

        lastDrawAt = 0;
        animationFrame = requestAnimationFrame(draw);
    });
}());
