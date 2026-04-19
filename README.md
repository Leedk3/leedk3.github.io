# IRDL Lab Website

Official website of the **Intelligent Robotics for Defense Lab (IRDL)** at Jeonbuk National University, led by **Prof. Daegyu Lee**.

🌐 **Live Site**: [https://leedk3.github.io](https://leedk3.github.io)

---

## Research Areas

- **Spatial AI** — 3D scene understanding, SLAM, state estimation, and learning-based navigation
- **Autonomous Systems** — Advanced Air Mobility (AAM), mobile robots, and autonomous vehicles
- **RL-based Adaptive Control** — Fault-tolerant control and cross-morphology adaptation for heterogeneous robots

---

## Project Structure

```
irdl-lab-jbnu.github.io/
├── index.html              # Home
├── team.html               # Members
├── projects.html           # Research projects
├── publications.html       # Papers
├── patents.html            # Patents
├── news.html               # News & activities
├── gallery.html            # Gallery
├── css/
│   └── style.css           # Global stylesheet
├── js/
│   └── main.js
└── assets/
    ├── images/
    │   ├── main-logo.png
    │   ├── team/           # Member profile photos
    │   ├── projects/       # Project images
    │   └── gallery/        # Gallery photos
    └── videos/             # Research demo videos
```

---

## Development

No build tools required. Edit HTML/CSS files directly and push to GitHub.

### CSS Cache Busting

After modifying `style.css`, increment the version query string in **all HTML files**:

```html
<link rel="stylesheet" href="css/style.css?v=2">
```

This ensures browsers load the latest CSS without cache issues.

### Adding Team Members

1. Add photo to `assets/images/team/` (`.jpeg` or `.jpg`)
2. Add entry in `team.html` under the appropriate section

### Adding News

Add a new `<li>` entry at the top of the list in `news.html`:

```html
<li>
    <span class="date">YYYY.MM</span>
    Event description — <a href="URL">Link</a>
</li>
```

---

## Contact

**Prof. Daegyu Lee**
Department of Advanced Defense Technology and Industry, JBNU
✉️ lee.dk@jbnu.ac.kr
