/**
 * GASTRONOTE LYON - Chef's Editorial Recipe Scaler
 * 100% Vanilla ES6+ - Architecture, 3D Background Engine & State Controller
 */

// 1. VANILLA 3D INTERACTIVE BACKGROUND CANVAS ENGINE
class Interactive3DBackground {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext("2d");
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    // 3D Camera & Parallax State
    this.camera = {
      x: 0,
      y: 0,
      z: -480,
      rotX: 0.15,
      rotY: 0,
      targetRotX: 0.15,
      targetRotY: 0,
      fov: 400
    };

    // Cursor 3D Interaction
    this.mouse = {
      x: this.width / 2,
      y: this.height / 2,
      targetX: this.width / 2,
      targetY: this.height / 2,
      radius: 180
    };

    this.particles = [];
    this.particleCount = 75;
    this.gridLines = [];
    this.animId = null;
    this.isRunning = true;

    this.init();
  }

  init() {
    this.resize();
    this.create3DScene();
    this.bindEvents();
    this.loop();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
    this.camera.fov = Math.max(340, Math.min(this.width, this.height) * 0.65);
  }

  create3DScene() {
    this.particles = [];
    // Generate floating 3D spice & herb geometric crystals
    const palette = [
      { r: 200, g: 75, b: 49 },  // Terracotta
      { r: 180, g: 131, b: 62 }, // Ochre Gold
      { r: 45, g: 106, b: 79 },  // Sage Green
      { r: 160, g: 140, b: 120 } // Fine Parchment
    ];

    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: (Math.random() - 0.5) * 1100,
        y: (Math.random() - 0.5) * 800,
        z: (Math.random() - 0.5) * 600,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        vz: (Math.random() - 0.5) * 0.35,
        size: Math.random() * 3.5 + 1.5,
        color: palette[Math.floor(Math.random() * palette.length)],
        polySides: Math.random() > 0.4 ? 3 : 4,
        rotAngle: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02
      });
    }

    // Perspective 3D horizon grid vertices
    this.gridLines = [];
    const gridSize = 700;
    const step = 70;
    const yFloor = 240;

    for (let x = -gridSize; x <= gridSize; x += step) {
      this.gridLines.push([
        { x: x, y: yFloor, z: -300 },
        { x: x, y: yFloor, z: 450 }
      ]);
    }
    for (let z = -300; z <= 450; z += step) {
      this.gridLines.push([
        { x: -gridSize, y: yFloor, z: z },
        { x: gridSize, y: yFloor, z: z }
      ]);
    }
  }

  project(p) {
    // 3D Euler Matrix Rotation (Camera pitch and yaw)
    const cosY = Math.cos(this.camera.rotY);
    const sinY = Math.sin(this.camera.rotY);
    const cosX = Math.cos(this.camera.rotX);
    const sinX = Math.sin(this.camera.rotX);

    // Y-rotation
    let x1 = p.x * cosY + p.z * sinY;
    let z1 = -p.x * sinY + p.z * cosY;

    // X-rotation
    let y2 = p.y * cosX - z1 * sinX;
    let z2 = p.y * sinX + z1 * cosX;

    // Perspective transformation
    const depth = z2 - this.camera.z;
    if (depth <= 10) return null; // Behind camera plane

    const scale = this.camera.fov / depth;
    return {
      x: x1 * scale + this.width / 2,
      y: y2 * scale + this.height / 2,
      scale: scale,
      depth: depth
    };
  }

  update() {
    // Smooth camera interpolation towards cursor
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.06;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.06;

    this.camera.targetRotY = ((this.mouse.x / this.width) - 0.5) * 0.35;
    this.camera.targetRotX = 0.15 + ((this.mouse.y / this.height) - 0.5) * 0.22;

    this.camera.rotY += (this.camera.targetRotY - this.camera.rotY) * 0.05;
    this.camera.rotX += (this.camera.targetRotX - this.camera.rotX) * 0.05;

    // Update floating particles
    for (let p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.z += p.vz;
      p.rotAngle += p.rotSpeed;

      // Soft boundary bounce
      if (p.x < -600 || p.x > 600) p.vx *= -1;
      if (p.y < -450 || p.y > 450) p.vy *= -1;
      if (p.z < -350 || p.z > 350) p.vz *= -1;
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    const isDark = document.body.getAttribute("data-theme") === "dark";
    const gridColor = isDark ? "rgba(226, 93, 67, 0.04)" : "rgba(200, 75, 49, 0.05)";
    const filamentColor = isDark ? "rgba(212, 163, 89, 0.08)" : "rgba(180, 131, 62, 0.09)";

    // 1. Render 3D Perspective Floor Grid
    this.ctx.beginPath();
    this.ctx.strokeStyle = gridColor;
    this.ctx.lineWidth = 1;

    for (let line of this.gridLines) {
      const p1 = this.project(line[0]);
      const p2 = this.project(line[1]);
      if (p1 && p2) {
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
      }
    }
    this.ctx.stroke();

    // 2. Project Particles and Sort by Depth
    const projected = [];
    for (let i = 0; i < this.particles.length; i++) {
      const proj = this.project(this.particles[i]);
      if (proj) {
        projected.push({
          p: this.particles[i],
          proj: proj,
          distToMouse: Math.hypot(proj.x - this.mouse.x, proj.y - this.mouse.y)
        });
      }
    }

    // Depth Sorting (painter's algorithm)
    projected.sort((a, b) => b.proj.depth - a.proj.depth);

    // 3. Draw Connecting 3D Constellation Filaments
    this.ctx.beginPath();
    this.ctx.strokeStyle = filamentColor;
    this.ctx.lineWidth = 0.8;
    for (let i = 0; i < projected.length; i++) {
      for (let j = i + 1; j < Math.min(i + 6, projected.length); j++) {
        const dx = projected[i].p.x - projected[j].p.x;
        const dy = projected[i].p.y - projected[j].p.y;
        const dz = projected[i].p.z - projected[j].p.z;
        const dist3D = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist3D < 190) {
          this.ctx.moveTo(projected[i].proj.x, projected[i].proj.y);
          this.ctx.lineTo(projected[j].proj.x, projected[j].proj.y);
        }
      }
    }
    this.ctx.stroke();

    // 4. Render 3D Geometric Nodes
    for (let item of projected) {
      const { p, proj, distToMouse } = item;
      const alpha = Math.max(0.12, Math.min(0.85, 1 - (proj.depth / 850)));
      const baseRadius = p.size * proj.scale;

      // Mouse Proximity Shimmer
      const hoverBoost = distToMouse < 140 ? (1 - distToMouse / 140) * 1.5 : 0;
      const radius = baseRadius + hoverBoost;

      this.ctx.save();
      this.ctx.translate(proj.x, proj.y);
      this.ctx.rotate(p.rotAngle);

      this.ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${alpha})`;
      this.ctx.beginPath();

      if (p.polySides === 3) {
        // Equilateral triangle
        const h = radius * 1.5;
        this.ctx.moveTo(0, -h / 2);
        this.ctx.lineTo(radius, h / 2);
        this.ctx.lineTo(-radius, h / 2);
      } else {
        // Diamond / Rhombus
        this.ctx.moveTo(0, -radius);
        this.ctx.lineTo(radius * 0.8, 0);
        this.ctx.lineTo(0, radius);
        this.ctx.lineTo(-radius * 0.8, 0);
      }

      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.restore();
    }
  }

  loop() {
    if (!this.isRunning) return;
    this.update();
    this.render();
    this.animId = requestAnimationFrame(() => this.loop());
  }

  bindEvents() {
    window.addEventListener("resize", () => this.resize());

    window.addEventListener("mousemove", (e) => {
      this.mouse.targetX = e.clientX;
      this.mouse.targetY = e.clientY;
    });

    window.addEventListener("touchmove", (e) => {
      if (e.touches.length > 0) {
        this.mouse.targetX = e.touches[0].clientX;
        this.mouse.targetY = e.touches[0].clientY;
      }
    }, { passive: true });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.isRunning = false;
        cancelAnimationFrame(this.animId);
      } else {
        this.isRunning = true;
        this.loop();
      }
    });
  }
}

// 2. APPLICATION DEFAULT STATE & LYON BOUCHON CATALOG
const LYON_PRESETS = [
  {
    id: "salade-lyonnaise",
    name: "Traditional Salade Lyonnaise",
    quarter: "Saint-Jean (Vieux-Lyon)",
    servingsMakes: 4,
    servingsWanted: 6,
    ingredients: [
      { id: "ing-1", name: "Frisée Curly Endive", amount: 300, unit: "g" },
      { id: "ing-2", name: "Smoked Bacon Lardons", amount: 200, unit: "g" },
      { id: "ing-3", name: "Farm Fresh Eggs", amount: 4, unit: "whole" }
    ]
  },
  {
    id: "quenelles-brochet",
    name: "Quenelles de Brochet Nantua",
    quarter: "Presqu'île (Mercière)",
    servingsMakes: 4,
    servingsWanted: 8,
    ingredients: [
      { id: "ing-1", name: "Fresh Pike Fillet (Brochet)", amount: 350, unit: "g" },
      { id: "ing-2", name: "Panade Pastry Base", amount: 250, unit: "g" },
      { id: "ing-3", name: "Nantua Crayfish Butter Sauce", amount: 400, unit: "ml" }
    ]
  },
  {
    id: "tarte-pralines",
    name: "Tarte aux Pralines Roses",
    quarter: "Croix-Rousse (Canut)",
    servingsMakes: 6,
    servingsWanted: 12,
    ingredients: [
      { id: "ing-1", name: "Pink Almond Pralines (Crushed)", amount: 300, unit: "g" },
      { id: "ing-2", name: "Double Crème Fraîche (40%)", amount: 300, unit: "g" },
      { id: "ing-3", name: "Sweet Sablé Pastry Crust", amount: 1, unit: "disk" }
    ]
  },
  {
    id: "cervelle-canut",
    name: "Cervelle de Canut Spread",
    quarter: "Pentes de la Croix-Rousse",
    servingsMakes: 4,
    servingsWanted: 10,
    ingredients: [
      { id: "ing-1", name: "Fromage Blanc / Curd", amount: 500, unit: "g" },
      { id: "ing-2", name: "Shallots & Fine Chives", amount: 60, unit: "g" },
      { id: "ing-3", name: "White Wine & Walnut Oil", amount: 45, unit: "ml" }
    ]
  }
];

// Single Source of Truth
const state = {
  dishName: "Traditional Salade Lyonnaise",
  servingsMakes: 4,
  servingsWanted: 6,
  ingredients: [
    { id: "ing-1", name: "Frisée Curly Endive", amount: 300, unit: "g" },
    { id: "ing-2", name: "Smoked Bacon Lardons", amount: 200, unit: "g" },
    { id: "ing-3", name: "Farm Fresh Eggs", amount: 4, unit: "whole" }
  ],
  theme: "light"
};

const STORAGE_KEY = "gastronote_lyon_state";

// 3. DOM CACHE
const elements = {
  dishNameInput: document.getElementById("recipe-dish-name"),
  servingsMakesInput: document.getElementById("recipe-servings-makes"),
  servingsWantedInput: document.getElementById("recipe-servings-wanted"),
  ingredientsContainer: document.getElementById("ingredients-input-list"),
  btnAddIngredient: document.getElementById("btn-add-ingredient"),
  btnCalculate: document.getElementById("btn-calculate"),
  btnResetDemo: document.getElementById("btn-reset-demo"),
  btnCopyJson: document.getElementById("btn-copy-json"),
  btnCopyYields: document.getElementById("btn-copy-yields"),
  btnPrintRecipe: document.getElementById("btn-print-recipe"),
  toggleTableBtn: document.getElementById("toggle-table-btn"),
  auditTableWrapper: document.getElementById("audit-table-wrapper"),
  
  // Recipe Output Targets
  displayDishName: document.getElementById("display-dish-name"),
  displayServingsMakes: document.getElementById("display-servings-makes"),
  displayServingsWanted: document.getElementById("display-servings-wanted"),
  scaleFactorBadge: document.getElementById("scale-factor-badge"),
  scaleFactorVal: document.getElementById("scale-factor-val"),
  metricRatio: document.getElementById("metric-ratio"),
  chefIngredientsList: document.getElementById("chef-ingredients-list"),
  yieldTbody: document.getElementById("yield-tbody"),
  yieldInvalidState: document.getElementById("yield-invalid-state"),
  yieldInvalidMessage: document.getElementById("yield-invalid-message"),
  errorBanner: document.getElementById("error-banner"),
  errorBannerText: document.getElementById("error-banner-text"),
  
  // Storage & Presets
  storageRawDisplay: document.getElementById("storage-raw-display"),
  presetsContainer: document.getElementById("presets-container"),
  presetSearch: document.getElementById("preset-search"),
  
  // Utilities
  themeToggle: document.getElementById("theme-toggle"),
  hamburgerBtn: document.getElementById("hamburger-btn"),
  navMenu: document.getElementById("nav-menu"),
  toastContainer: document.getElementById("toast-container")
};

// 4. SERVINGS VALIDATION LOGIC
function validateServings(makes, wanted) {
  if (makes === "" || wanted === "" || isNaN(makes) || isNaN(wanted)) {
    return {
      isValid: false,
      message: "Please enter valid, positive servings to calculate proportions. Servings cannot be empty."
    };
  }

  const numMakes = parseFloat(makes);
  const numWanted = parseFloat(wanted);

  if (numMakes <= 0 && numWanted <= 0) {
    return {
      isValid: false,
      message: "Both Original Servings and Servings Wanted must be strictly greater than zero."
    };
  }
  if (numMakes <= 0) {
    return {
      isValid: false,
      message: "Original Servings (yield recipe makes) must be strictly greater than zero."
    };
  }
  if (numWanted <= 0) {
    return {
      isValid: false,
      message: "Servings Wanted (target yield) must be strictly greater than zero."
    };
  }

  return { isValid: true, makes: numMakes, wanted: numWanted };
}

// 5. RENDERING FUNCTIONS
function renderIngredientInputs() {
  elements.ingredientsContainer.innerHTML = "";
  
  state.ingredients.forEach((ing, index) => {
    const row = document.createElement("div");
    row.className = "ingredient-row";
    row.dataset.id = ing.id;
    
    row.innerHTML = `
      <input 
        type="text" 
        class="form-control form-control-sm ing-name-input" 
        placeholder="Ingredient Name" 
        value="${escapeHtml(ing.name)}" 
        data-index="${index}"
        aria-label="Ingredient name"
        required
      >
      <input 
        type="number" 
        class="form-control form-control-sm ing-amount-input" 
        placeholder="Amount" 
        value="${ing.amount}" 
        min="0" 
        step="any" 
        data-index="${index}"
        aria-label="Ingredient amount"
        required
      >
      <input 
        type="text" 
        class="form-control form-control-sm ing-unit-input" 
        placeholder="Unit (g, ml, whole)" 
        value="${escapeHtml(ing.unit)}" 
        data-index="${index}"
        aria-label="Ingredient unit"
        required
      >
      <button 
        type="button" 
        class="btn-remove-row" 
        data-index="${index}" 
        title="Remove ingredient" 
        ${state.ingredients.length <= 3 ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ""}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
      </button>
    `;
    elements.ingredientsContainer.appendChild(row);
  });
}

function updateCalculations() {
  const makesVal = elements.servingsMakesInput.value.trim();
  const wantedVal = elements.servingsWantedInput.value.trim();
  const validation = validateServings(makesVal, wantedVal);

  const dishTitle = elements.dishNameInput.value.trim() || "Traditional Lyonnais Recipe";
  elements.displayDishName.textContent = dishTitle;
  elements.displayServingsMakes.textContent = makesVal || "—";
  elements.displayServingsWanted.textContent = wantedVal || "—";

  if (!validation.isValid) {
    elements.scaleFactorBadge.classList.add("invalid");
    elements.scaleFactorVal.textContent = "—x";
    elements.metricRatio.textContent = "—x";

    elements.errorBanner.classList.remove("hidden");
    elements.errorBannerText.textContent = validation.message;
    
    elements.chefIngredientsList.innerHTML = "";
    elements.yieldInvalidState.classList.remove("hidden");
    elements.yieldInvalidMessage.textContent = validation.message;

    elements.yieldTbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center" style="padding: 1.25rem; color: var(--danger); text-align: center;">
          <em>Enter valid servings to calculate proportions</em>
        </td>
      </tr>
    `;

    saveStateToLocalStorage();
    return;
  }

  elements.errorBanner.classList.add("hidden");
  elements.yieldInvalidState.classList.add("hidden");
  elements.scaleFactorBadge.classList.remove("invalid");

  const makes = validation.makes;
  const wanted = validation.wanted;
  const scaleMultiplier = wanted / makes;

  const ratioText = `${scaleMultiplier.toFixed(2)}×`;
  elements.scaleFactorVal.textContent = ratioText;
  elements.metricRatio.textContent = ratioText;

  elements.chefIngredientsList.innerHTML = "";
  elements.yieldTbody.innerHTML = "";

  state.ingredients.forEach((ing, i) => {
    const rawAmt = parseFloat(ing.amount) || 0;
    const scaled = (rawAmt * wanted) / makes;
    const formattedYield = Number.isInteger(scaled) ? scaled : scaled.toFixed(2);

    const card = document.createElement("div");
    card.className = "chef-ingredient-card";
    card.innerHTML = `
      <div class="ing-card-left">
        <div class="ing-badge-idx">${i + 1}</div>
        <div class="ing-info-meta">
          <h4>${escapeHtml(ing.name || `Ingredient #${i + 1}`)}</h4>
          <div class="ing-breakdown">
            Base: ${rawAmt} ${escapeHtml(ing.unit)} 
            <span class="math-subtle">&bull; (${rawAmt} &times; ${wanted} &divide; ${makes})</span>
          </div>
        </div>
      </div>
      <div class="chef-yield-pill">
        <span>${formattedYield}</span>
        <span class="yield-unit">${escapeHtml(ing.unit)}</span>
      </div>
    `;
    elements.chefIngredientsList.appendChild(card);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td><strong>${escapeHtml(ing.name)}</strong></td>
      <td>${rawAmt} <small class="text-muted">${escapeHtml(ing.unit)}</small></td>
      <td><code>${rawAmt} &times; ${wanted} &divide; ${makes}</code></td>
      <td class="text-right">
        <span class="yield-table-val">${formattedYield}</span> ${escapeHtml(ing.unit)}
      </td>
    `;
    elements.yieldTbody.appendChild(tr);
  });

  saveStateToLocalStorage();
}

function renderPresets(filter = "") {
  elements.presetsContainer.innerHTML = "";
  const query = filter.toLowerCase().trim();

  const filtered = LYON_PRESETS.filter(p => 
    p.name.toLowerCase().includes(query) ||
    p.quarter.toLowerCase().includes(query) ||
    p.ingredients.some(ing => ing.name.toLowerCase().includes(query))
  );

  if (filtered.length === 0) {
    elements.presetsContainer.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 1.5rem; text-align: center; color: var(--text-muted);">
        No Bouchon recipes found matching "${escapeHtml(filter)}".
      </div>
    `;
    return;
  }

  filtered.forEach(preset => {
    const card = document.createElement("div");
    card.className = "preset-card";
    card.innerHTML = `
      <div>
        <div class="preset-district">${escapeHtml(preset.quarter)}</div>
        <div class="preset-title">${escapeHtml(preset.name)}</div>
        <ul class="preset-ingredients-list">
          ${preset.ingredients.map(ing => `<li>&bull; ${ing.amount} ${escapeHtml(ing.unit)} &ndash; ${escapeHtml(ing.name)}</li>`).join("")}
        </ul>
      </div>
      <span class="preset-load-link" data-preset-id="${preset.id}">Load into Scaler &rarr;</span>
    `;
    elements.presetsContainer.appendChild(card);
  });
}

// 6. LOCAL STORAGE PERSISTENCE
function saveStateToLocalStorage() {
  state.dishName = elements.dishNameInput.value;
  state.servingsMakes = elements.servingsMakesInput.value;
  state.servingsWanted = elements.servingsWantedInput.value;

  try {
    const jsonStr = JSON.stringify(state, null, 2);
    localStorage.setItem(STORAGE_KEY, jsonStr);
    elements.storageRawDisplay.querySelector("code").textContent = jsonStr;
  } catch (err) {
    console.warn("Gastronote Lyon: LocalStorage inaccessible", err);
  }
}

function loadStateFromLocalStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object") {
        state.dishName = parsed.dishName || state.dishName;
        state.servingsMakes = parsed.servingsMakes !== undefined ? parsed.servingsMakes : state.servingsMakes;
        state.servingsWanted = parsed.servingsWanted !== undefined ? parsed.servingsWanted : state.servingsWanted;
        if (Array.isArray(parsed.ingredients) && parsed.ingredients.length >= 3) {
          state.ingredients = parsed.ingredients;
        }
        if (parsed.theme) {
          state.theme = parsed.theme;
        }
      }
    }
  } catch (err) {
    console.warn("Gastronote Lyon: Error parsing state", err);
  }

  elements.dishNameInput.value = state.dishName;
  elements.servingsMakesInput.value = state.servingsMakes;
  elements.servingsWantedInput.value = state.servingsWanted;
  applyTheme(state.theme || "light");
}

// 7. UI HELPERS
function applyTheme(theme) {
  state.theme = theme;
  document.body.setAttribute("data-theme", theme);
  saveStateToLocalStorage();
}

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${escapeHtml(message)}</span>
  `;
  elements.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
    setTimeout(() => toast.remove(), 250);
  }, 3000);
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function loadPreset(presetId) {
  const preset = LYON_PRESETS.find(p => p.id === presetId);
  if (!preset) return;

  state.dishName = preset.name;
  state.servingsMakes = preset.servingsMakes;
  state.servingsWanted = preset.servingsWanted;
  state.ingredients = JSON.parse(JSON.stringify(preset.ingredients));

  elements.dishNameInput.value = state.dishName;
  elements.servingsMakesInput.value = state.servingsMakes;
  elements.servingsWantedInput.value = state.servingsWanted;

  renderIngredientInputs();
  updateCalculations();
  showToast(`Loaded Bouchon recipe: ${preset.name}`);
}

// 8. EVENT HANDLERS
function setupEventListeners() {
  elements.dishNameInput.addEventListener("input", updateCalculations);
  elements.servingsMakesInput.addEventListener("input", updateCalculations);
  elements.servingsWantedInput.addEventListener("input", updateCalculations);

  elements.btnCalculate.addEventListener("click", () => {
    updateCalculations();
    const val = validateServings(elements.servingsMakesInput.value, elements.servingsWantedInput.value);
    if (val.isValid) {
      showToast("Chef's Card recalculated successfully!");
      document.getElementById("scaled-recipe-card").scrollIntoView({ behavior: "smooth" });
    } else {
      showToast("Please enter positive servings", "danger");
    }
  });

  document.querySelectorAll(".btn-step").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = btn.dataset.target;
      const delta = parseFloat(btn.dataset.delta) || 0;
      const input = document.getElementById(targetId);
      if (input) {
        let current = parseFloat(input.value) || 0;
        input.value = Math.max(0, current + delta);
        updateCalculations();
      }
    });
  });

  elements.ingredientsContainer.addEventListener("input", (e) => {
    const target = e.target;
    const index = parseInt(target.dataset.index, 10);
    if (isNaN(index) || !state.ingredients[index]) return;

    if (target.classList.contains("ing-name-input")) {
      state.ingredients[index].name = target.value;
    } else if (target.classList.contains("ing-amount-input")) {
      state.ingredients[index].amount = parseFloat(target.value) || 0;
    } else if (target.classList.contains("ing-unit-input")) {
      state.ingredients[index].unit = target.value;
    }
    updateCalculations();
  });

  elements.ingredientsContainer.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-remove-row");
    if (!btn || btn.disabled) return;
    const index = parseInt(btn.dataset.index, 10);
    if (!isNaN(index) && state.ingredients.length > 3) {
      const removed = state.ingredients.splice(index, 1);
      renderIngredientInputs();
      updateCalculations();
      showToast(`Removed: ${removed[0].name || "item"}`);
    }
  });

  elements.btnAddIngredient.addEventListener("click", () => {
    state.ingredients.push({
      id: `ing-${Date.now()}`,
      name: `Specialty Ingredient #${state.ingredients.length + 1}`,
      amount: 100,
      unit: "g"
    });
    renderIngredientInputs();
    updateCalculations();
    showToast("Added ingredient row");
  });

  elements.btnResetDemo.addEventListener("click", () => {
    if (confirm("Reset recipe scaler back to default Lyon Bouchon recipe?")) {
      localStorage.removeItem(STORAGE_KEY);
      const defaultPreset = LYON_PRESETS[0];
      state.dishName = defaultPreset.name;
      state.servingsMakes = defaultPreset.servingsMakes;
      state.servingsWanted = defaultPreset.servingsWanted;
      state.ingredients = JSON.parse(JSON.stringify(defaultPreset.ingredients));

      elements.dishNameInput.value = state.dishName;
      elements.servingsMakesInput.value = state.servingsMakes;
      elements.servingsWantedInput.value = state.servingsWanted;

      renderIngredientInputs();
      updateCalculations();
      showToast("Defaults restored successfully");
    }
  });

  elements.toggleTableBtn.addEventListener("click", () => {
    elements.auditTableWrapper.classList.toggle("hidden");
  });

  elements.btnCopyJson.addEventListener("click", () => {
    const json = JSON.stringify(state, null, 2);
    navigator.clipboard.writeText(json).then(() => {
      showToast("State JSON copied to clipboard!");
    });
  });

  elements.btnCopyYields.addEventListener("click", () => {
    const val = validateServings(elements.servingsMakesInput.value, elements.servingsWantedInput.value);
    if (!val.isValid) {
      showToast("Cannot export invalid proportions", "danger");
      return;
    }
    const lines = [
      `CHEF PREP SHEET: ${state.dishName.toUpperCase()}`,
      `Original Servings: ${val.makes} | Target Servings: ${val.wanted} (${(val.wanted / val.makes).toFixed(2)}x)`,
      `----------------------------------------------`
    ];
    state.ingredients.forEach(ing => {
      const scaled = (ing.amount * val.wanted) / val.makes;
      const formatted = Number.isInteger(scaled) ? scaled : scaled.toFixed(2);
      lines.push(`• ${ing.name}: ${formatted} ${ing.unit} (Original: ${ing.amount} ${ing.unit})`);
    });
    lines.push(`----------------------------------------------`);
    lines.push(`Gastronote Lyon - Bouchon Scaler`);

    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      showToast("Prep sheet copied to clipboard!");
    });
  });

  elements.btnPrintRecipe.addEventListener("click", () => {
    window.print();
  });

  elements.presetsContainer.addEventListener("click", (e) => {
    const link = e.target.closest("[data-preset-id]");
    if (link) {
      loadPreset(link.dataset.presetId);
    }
  });

  elements.presetSearch.addEventListener("input", (e) => {
    renderPresets(e.target.value);
  });

  elements.themeToggle.addEventListener("click", () => {
    const current = document.body.getAttribute("data-theme") || "light";
    const next = current === "light" ? "dark" : "light";
    applyTheme(next);
  });

  elements.hamburgerBtn.addEventListener("click", () => {
    elements.navMenu.classList.toggle("active");
  });

  elements.navMenu.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", () => {
      elements.navMenu.classList.remove("active");
    });
  });
}

// 9. INITIALIZE
document.addEventListener("DOMContentLoaded", () => {
  // Start 3D Interactive Canvas
  new Interactive3DBackground("bg-canvas-3d");

  // Load Saved Proportions & Render
  loadStateFromLocalStorage();
  renderIngredientInputs();
  renderPresets();
  setupEventListeners();
  updateCalculations();
});