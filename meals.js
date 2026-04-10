// ── MEAL PLANNER ──────────────────────────────────────────────────────────────

// ── STATE ─────────────────────────────────────────────────────────────────────
var allRecipes = [];
var allMealPlan = [];
var allGroceryList = [];
var mealPageTab = 'planner';   // 'planner' | 'recipes' | 'grocery'
var mealWeekStart = null;       // Date object — Monday of current week
var recipeEditId = null;
var recipeFormIngredients = [];
var recipePersonPrefs = {};     // { personName: 'loves'|'likes'|'tolerates'|'hates'|'' }
var addMealSlot = null;         // { dateStr, mealType } — slot being filled
var recipeDetailId = null;
var recipeDetailChecked = new Set();

// ── LOADERS ───────────────────────────────────────────────────────────────────
async function loadRecipes() {
  var { data, error } = await sb.from('recipes').select('*').order('name');
  if (!error && data) allRecipes = data;
}

async function loadMealPlan() {
  // Load a 5-week window around the current week
  var start = new Date(mealWeekStart);
  start.setDate(start.getDate() - 7);
  var end = new Date(mealWeekStart);
  end.setDate(end.getDate() + 28);
  var { data, error } = await sb.from('meal_plan').select('*')
    .gte('plan_date', start.toISOString().slice(0, 10))
    .lte('plan_date', end.toISOString().slice(0, 10))
    .order('plan_date');
  if (!error && data) allMealPlan = data;
}

async function loadGroceryList() {
  var { data, error } = await sb.from('grocery_list').select('*').order('source_recipe').order('name');
  if (!error && data) allGroceryList = data;
}

// ── INIT ──────────────────────────────────────────────────────────────────────
async function initMealsPage() {
  if (!mealWeekStart) resetToCurrentWeek();
  renderMealTabBar();
  renderMealContent(); // show loading state
  await Promise.all([
    allRecipes.length ? Promise.resolve() : loadRecipes(),
    loadMealPlan(),
    loadGroceryList(),
  ]);
  renderMealContent();
}

function resetToCurrentWeek() {
  var today = new Date();
  var day = today.getDay();
  var diff = day === 0 ? -6 : 1 - day; // back to Monday
  mealWeekStart = new Date(today);
  mealWeekStart.setDate(today.getDate() + diff);
  mealWeekStart.setHours(0, 0, 0, 0);
}

// ── TABS ──────────────────────────────────────────────────────────────────────
function setMealTab(tab) {
  mealPageTab = tab;
  renderMealTabBar();
  renderMealContent();
}

function renderMealTabBar() {
  var el = document.getElementById('meal-tab-bar');
  if (!el) return;
  var tabs = [
    { id: 'planner', label: 'Meal Planner' },
    { id: 'recipes', label: 'Recipe Bank' },
    { id: 'grocery', label: 'Grocery List' },
  ];
  el.innerHTML = tabs.map(function (t) {
    return '<button class="kchip' + (mealPageTab === t.id ? ' on' : '') + '" onclick="setMealTab(\'' + t.id + '\')" style="font-size:13px;padding:6px 18px;">' + t.label + '</button>';
  }).join('');
}

function renderMealContent() {
  var views = { planner: 'meal-planner-view', recipes: 'meal-recipes-view', grocery: 'meal-grocery-view' };
  Object.keys(views).forEach(function (tab) {
    var el = document.getElementById(views[tab]);
    if (el) el.style.display = mealPageTab === tab ? '' : 'none';
  });
  if (mealPageTab === 'planner') renderMealPlanner();
  if (mealPageTab === 'recipes') renderRecipeBank();
  if (mealPageTab === 'grocery') renderGroceryListView();
}

// ── MEAL PLANNER — WEEK VIEW ──────────────────────────────────────────────────
function getMealWeekDays() {
  var days = [];
  for (var i = 0; i < 7; i++) {
    var d = new Date(mealWeekStart);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

function mealDateStr(d) {
  return d.toISOString().slice(0, 10);
}

function renderMealPlanner() {
  var el = document.getElementById('meal-planner-view');
  if (!el) return;

  var days = getMealWeekDays();
  var weekLabel = days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' – ' + days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  var html = '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:1.25rem;">';
  html += '<button class="btn" onclick="shiftMealWeek(-1)">← Prev</button>';
  html += '<span style="font-size:14px;font-weight:600;color:var(--text2);flex:1;text-align:center;white-space:nowrap;">Week of ' + weekLabel + '</span>';
  html += '<button class="btn" onclick="shiftMealWeek(1)">Next →</button>';
  html += '<button class="btn" onclick="goToCurrentWeek()" style="font-size:12px;padding:5px 12px;">Today</button>';
  html += '<button class="btn btn-p" onclick="printMealPlan()" style="font-size:12px;padding:5px 12px;">Print</button>';
  html += '</div>';

  var mealTypes = ['Breakfast', 'Lunch', 'Dinner'];
  var today = new Date();
  today.setHours(0, 0, 0, 0);

  html += '<div class="meal-week-grid">';

  // Column headers
  html += '<div class="meal-col-hdr"></div>';
  mealTypes.forEach(function (type) {
    html += '<div class="meal-col-hdr">' + type + '</div>';
  });

  // Day rows
  days.forEach(function (day) {
    var ds = mealDateStr(day);
    var isToday = day.getTime() === today.getTime();
    html += '<div class="meal-day-lbl' + (isToday ? ' today' : '') + '">';
    html += '<div style="font-weight:600;font-size:13px;">' + day.toLocaleDateString('en-US', { weekday: 'short' }) + '</div>';
    html += '<div style="font-size:11px;color:var(--text3);">' + day.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }) + '</div>';
    html += '</div>';

    mealTypes.forEach(function (type) {
      var slotMeals = allMealPlan.filter(function (m) { return m.plan_date === ds && m.meal_type === type; });
      html += '<div class="meal-grid-cell">';
      slotMeals.forEach(function (m) {
        var recipe = m.recipe_id ? allRecipes.find(function (r) { return r.id === m.recipe_id; }) : null;
        var mealName = recipe ? recipe.name : (m.custom_name || '?');
        html += '<div class="meal-cell-item">';
        html += '<span class="meal-cell-name"' + (recipe ? ' onclick="openRecipeDetail(\'' + recipe.id + '\')" style="cursor:pointer;"' : '') + '>' + esc(mealName) + '</span>';
        html += '<button class="meal-cell-x" onclick="removeMealFromPlan(\'' + m.id + '\')">×</button>';
        html += '</div>';
      });
      html += '<button class="meal-add-btn" onclick="openAddMeal(\'' + ds + '\',\'' + type + '\')">+</button>';
      html += '</div>';
    });
  });

  html += '</div>';
  el.innerHTML = html;
}

function shiftMealWeek(dir) {
  mealWeekStart = new Date(mealWeekStart);
  mealWeekStart.setDate(mealWeekStart.getDate() + dir * 7);
  loadMealPlan().then(renderMealPlanner);
}

function goToCurrentWeek() {
  resetToCurrentWeek();
  loadMealPlan().then(renderMealPlanner);
}

// ── ADD MEAL MODAL ────────────────────────────────────────────────────────────
function openAddMeal(ds, mealType) {
  addMealSlot = { dateStr: ds, mealType: mealType };
  var dateLabel = new Date(ds + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  document.getElementById('meal-add-title').textContent = 'Add ' + mealType + ' — ' + dateLabel;
  document.getElementById('meal-add-search').value = '';
  document.getElementById('meal-add-custom').value = '';
  renderAddMealRecipes('');
  document.getElementById('meal-add-overlay').classList.add('open');
}

function renderAddMealRecipes(filter) {
  var el = document.getElementById('meal-add-recipes');
  var list = filter
    ? allRecipes.filter(function (r) { return r.name.toLowerCase().includes(filter.toLowerCase()); })
    : allRecipes;
  if (!list.length) {
    el.innerHTML = '<div class="empty" style="padding:1rem 0;">' + (allRecipes.length ? 'No matches.' : 'No recipes yet — add some in Recipe Bank first.') + '</div>';
    return;
  }
  el.innerHTML = list.map(function (r) {
    var meta = [r.meal_type, r.cook_time_minutes ? r.cook_time_minutes + ' min' : ''].filter(Boolean).join(' · ');
    return '<div class="meal-recipe-option" onclick="addMealFromRecipe(\'' + r.id + '\')">' +
      '<div style="font-size:13px;font-weight:500;">' + esc(r.name) + '</div>' +
      (meta ? '<div style="font-size:11px;color:var(--text3);">' + esc(meta) + '</div>' : '') +
      '</div>';
  }).join('');
}

function closeMealAdd() { document.getElementById('meal-add-overlay').classList.remove('open'); }
function closeMealAddOverlay(e) { if (e.target === document.getElementById('meal-add-overlay')) closeMealAdd(); }

async function addMealFromRecipe(recipeId) {
  if (!addMealSlot) return;
  var { data, error } = await sb.from('meal_plan').insert({
    plan_date: addMealSlot.dateStr, meal_type: addMealSlot.mealType, recipe_id: recipeId,
  }).select();
  if (!error && data) { allMealPlan.push(data[0]); closeMealAdd(); renderMealPlanner(); }
}

async function addCustomMeal() {
  if (!addMealSlot) return;
  var name = document.getElementById('meal-add-custom').value.trim();
  if (!name) return;
  var { data, error } = await sb.from('meal_plan').insert({
    plan_date: addMealSlot.dateStr, meal_type: addMealSlot.mealType, custom_name: name,
  }).select();
  if (!error && data) { allMealPlan.push(data[0]); closeMealAdd(); renderMealPlanner(); }
}

async function removeMealFromPlan(id) {
  await sb.from('meal_plan').delete().eq('id', id);
  allMealPlan = allMealPlan.filter(function (m) { return m.id !== id; });
  renderMealPlanner();
}

// ── PRINT MEAL PLAN ───────────────────────────────────────────────────────────
function printMealPlan() {
  var days = getMealWeekDays();
  var weekLabel = days[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) +
    ' – ' + days[6].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  var types = ['Breakfast', 'Lunch', 'Dinner'];

  var html = '<div style="font-family:\'Jost\',sans-serif;padding:24px;">';
  html += '<h2 style="font-size:22px;margin-bottom:4px;color:#222;">Weekly Meal Plan</h2>';
  html += '<div style="font-size:13px;color:#888;margin-bottom:20px;">Week of ' + weekLabel + '</div>';
  html += '<table style="width:100%;border-collapse:collapse;font-size:13px;">';
  html += '<tr style="background:#f5ced9;"><th style="padding:10px 12px;text-align:left;border:1px solid #ddd;">Day</th>';
  types.forEach(function (t) { html += '<th style="padding:10px 12px;text-align:left;border:1px solid #ddd;">' + t + '</th>'; });
  html += '</tr>';

  days.forEach(function (day, i) {
    var ds = mealDateStr(day);
    var dayLabel = day.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    html += '<tr style="background:' + (i % 2 === 0 ? '#fff' : '#fdf5f7') + ';">';
    html += '<td style="padding:10px 12px;border:1px solid #ddd;font-weight:600;">' + dayLabel + '</td>';
    types.forEach(function (type) {
      var meals = allMealPlan.filter(function (m) { return m.plan_date === ds && m.meal_type === type; });
      var names = meals.map(function (m) {
        var r = m.recipe_id ? allRecipes.find(function (r) { return r.id === m.recipe_id; }) : null;
        return r ? r.name : (m.custom_meal || '');
      }).filter(Boolean);
      html += '<td style="padding:10px 12px;border:1px solid #ddd;">' + (names.length ? names.join(', ') : '—') + '</td>';
    });
    html += '</tr>';
  });

  html += '</table></div>';
  document.getElementById('chore-print-root').innerHTML = html;
  window.print();
}

// ── RECIPE BANK ───────────────────────────────────────────────────────────────
function renderRecipeBank() {
  var el = document.getElementById('meal-recipes-view');
  if (!el) return;

  var html = '<div style="display:flex;justify-content:flex-end;margin-bottom:1rem;">';
  html += '<button class="btn btn-p" onclick="openRecipeForm(null)">+ New Recipe</button></div>';

  if (!allRecipes.length) {
    el.innerHTML = html + '<div class="card"><div class="empty">No recipes yet. Add your first one!</div></div>';
    return;
  }

  var typeOrder = MEAL_TYPES;
  var groups = {};
  allRecipes.forEach(function (r) {
    var t = r.meal_type || 'Other';
    if (!groups[t]) groups[t] = [];
    groups[t].push(r);
  });

  typeOrder.forEach(function (type) {
    if (!groups[type] || !groups[type].length) return;
    html += '<div class="card" style="margin-bottom:12px;">';
    html += '<div class="ct">' + type + '</div>';
    groups[type].forEach(function (r) {
      html += '<div class="chore-item" style="cursor:default;">';
      html += '<div class="chore-body">';
      html += '<div class="chore-name">' + esc(r.name) + '</div>';
      if (r.cook_time_minutes) html += '<div class="chore-meta">' + r.cook_time_minutes + ' min</div>';
      // Preference chips
      var prefRows = [
        { key: 'loves', color: 'var(--accent)', people: r.loves || [] },
        { key: 'likes', color: 'var(--sage)', people: r.likes || [] },
        { key: 'tolerates', color: 'var(--amber)', people: r.tolerates || [] },
        { key: 'hates', color: 'var(--mauve)', people: r.hates || [] },
      ].filter(function (p) { return p.people.length; });
      if (prefRows.length) {
        html += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:5px;">';
        prefRows.forEach(function (p) {
          p.people.forEach(function (name) {
            html += '<span style="font-size:10px;padding:2px 8px;border-radius:100px;background:' + p.color + '22;color:' + p.color + ';font-weight:600;border:1px solid ' + p.color + '44;">' + esc(name) + '</span>';
          });
        });
        html += '</div>';
      }
      html += '</div>';
      html += '<div style="display:flex;gap:6px;flex-shrink:0;">';
      if ((r.ingredients || []).length) {
        html += '<button class="btn" style="font-size:12px;padding:4px 10px;" onclick="openRecipeDetail(\'' + r.id + '\')">Ingredients</button>';
      }
      html += '<button class="btn" style="font-size:12px;padding:4px 10px;" onclick="openRecipeForm(\'' + r.id + '\')">Edit</button>';
      html += '</div></div>';
    });
    html += '</div>';
  });

  el.innerHTML = html;
}

// ── RECIPE FORM ───────────────────────────────────────────────────────────────
function openRecipeForm(id) {
  recipeEditId = id || null;
  recipeFormIngredients = [];
  recipePersonPrefs = {};
  MEAL_PEOPLE.forEach(function (p) { recipePersonPrefs[p] = ''; });

  var recipe = id ? allRecipes.find(function (r) { return r.id === id; }) : null;
  document.getElementById('rf-title').textContent = recipe ? 'Edit Recipe' : 'New Recipe';
  document.getElementById('rf-name').value = recipe ? (recipe.name || '') : '';
  document.getElementById('rf-time').value = recipe ? (recipe.cook_time_minutes || '') : '';
  document.getElementById('rf-instructions').value = recipe ? (recipe.instructions || '') : '';
  document.getElementById('rf-delete-btn').style.display = recipe ? '' : 'none';
  document.getElementById('rf-ok').textContent = '';
  document.getElementById('rf-err').textContent = '';

  // Type select
  var typeEl = document.getElementById('rf-type');
  typeEl.innerHTML = MEAL_TYPES.map(function (t) { return '<option value="' + t + '">' + t + '</option>'; }).join('');
  typeEl.value = recipe ? (recipe.meal_type || 'Dinner') : 'Dinner';

  // Ingredients
  if (recipe && (recipe.ingredients || []).length) {
    recipeFormIngredients = recipe.ingredients.map(function (i) { return { name: i.name || '', quantity: i.quantity || '', unit: i.unit || '' }; });
  } else {
    recipeFormIngredients = [{ name: '', quantity: '', unit: '' }];
  }

  // Preferences
  if (recipe) {
    MEAL_PEOPLE.forEach(function (p) {
      if ((recipe.loves || []).includes(p)) recipePersonPrefs[p] = 'loves';
      else if ((recipe.likes || []).includes(p)) recipePersonPrefs[p] = 'likes';
      else if ((recipe.tolerates || []).includes(p)) recipePersonPrefs[p] = 'tolerates';
      else if ((recipe.hates || []).includes(p)) recipePersonPrefs[p] = 'hates';
      else recipePersonPrefs[p] = '';
    });
  }

  renderRecipeIngredients();
  renderRecipePrefs();
  document.getElementById('recipe-form-overlay').classList.add('open');
}

var MEAL_UNITS = ['', 'tsp', 'tbsp', 'cup', 'oz', 'lb', 'g', 'ml', 'L', 'can (10 oz)', 'can (15 oz)', 'pkg', 'slice', 'piece', 'pinch', 'to taste'];

function renderRecipeIngredients() {
  var el = document.getElementById('rf-ingredients');
  el.innerHTML = recipeFormIngredients.map(function (ing, idx) {
    var unitOpts = MEAL_UNITS.map(function (u) {
      return '<option value="' + u + '"' + (ing.unit === u ? ' selected' : '') + '>' + (u || '—') + '</option>';
    }).join('');
    return '<div style="display:flex;gap:5px;align-items:center;margin-bottom:5px;">' +
      '<input type="text" placeholder="#" value="' + esc(ing.quantity) + '" oninput="updateIngredient(' + idx + ',\'quantity\',this.value)" style="width:44px;flex-shrink:0;" />' +
      '<select onchange="updateIngredient(' + idx + ',\'unit\',this.value)" style="width:108px;flex-shrink:0;">' + unitOpts + '</select>' +
      '<input type="text" placeholder="Ingredient" value="' + esc(ing.name) + '" oninput="updateIngredient(' + idx + ',\'name\',this.value)" onkeydown="ingKeydown(event)" style="flex:1;" />' +
      '<button onclick="removeIngredient(' + idx + ')" style="background:none;border:none;cursor:pointer;font-size:18px;color:var(--text3);padding:0 4px;line-height:1;">×</button>' +
      '</div>';
  }).join('');
}

function updateIngredient(idx, field, val) { recipeFormIngredients[idx][field] = val; }

function ingKeydown(e) {
  if (e.key === 'Enter') { e.preventDefault(); addIngredientRow(); }
}

function addIngredientRow() {
  recipeFormIngredients.push({ name: '', quantity: '', unit: '' });
  renderRecipeIngredients();
  var inputs = document.querySelectorAll('#rf-ingredients input[placeholder="Ingredient"]');
  if (inputs.length) inputs[inputs.length - 1].focus();
}

function removeIngredient(idx) {
  recipeFormIngredients.splice(idx, 1);
  if (!recipeFormIngredients.length) recipeFormIngredients.push({ name: '', quantity: '' });
  renderRecipeIngredients();
}

function renderRecipePrefs() {
  var el = document.getElementById('rf-prefs');
  var prefOptions = [
    { id: 'loves', label: 'Loves', color: 'var(--accent)' },
    { id: 'likes', label: 'Likes', color: 'var(--sage)' },
    { id: 'tolerates', label: 'Tolerates', color: 'var(--amber)' },
    { id: 'hates', label: 'Hates', color: 'var(--mauve)' },
  ];
  el.innerHTML = MEAL_PEOPLE.map(function (person) {
    var cur = recipePersonPrefs[person] || '';
    return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;">' +
      '<div style="font-size:12px;font-weight:600;color:var(--text2);width:56px;flex-shrink:0;">' + esc(person) + '</div>' +
      '<div style="display:flex;gap:5px;flex-wrap:wrap;">' +
      prefOptions.map(function (opt) {
        var isOn = cur === opt.id;
        var style = isOn ? 'background:' + opt.color + ';border-color:' + opt.color + ';color:#fff;border-style:solid;' : '';
        return '<button class="chore-kid-bubble" style="' + style + '" onclick="setPersonPref(\'' + person + '\',\'' + opt.id + '\')">' + opt.label + '</button>';
      }).join('') +
      (cur ? '<button class="chore-kid-bubble" onclick="setPersonPref(\'' + person + '\',\'\')" style="color:var(--text3);font-size:10px;">✕ clear</button>' : '') +
      '</div></div>';
  }).join('');
}

function setPersonPref(person, pref) { recipePersonPrefs[person] = pref; renderRecipePrefs(); }
function closeRecipeForm() { document.getElementById('recipe-form-overlay').classList.remove('open'); }
function closeRecipeFormOverlay(e) { if (e.target === document.getElementById('recipe-form-overlay')) closeRecipeForm(); }

async function saveRecipe() {
  var name = document.getElementById('rf-name').value.trim();
  if (!name) { showToast('rf', 'err', 'Please enter a recipe name.'); return; }

  var loves = [], likes = [], tolerates = [], hates = [];
  MEAL_PEOPLE.forEach(function (p) {
    var pref = recipePersonPrefs[p];
    if (pref === 'loves') loves.push(p);
    else if (pref === 'likes') likes.push(p);
    else if (pref === 'tolerates') tolerates.push(p);
    else if (pref === 'hates') hates.push(p);
  });

  var payload = {
    name: name,
    meal_type: document.getElementById('rf-type').value,
    cook_time_minutes: parseInt(document.getElementById('rf-time').value) || null,
    instructions: document.getElementById('rf-instructions').value.trim() || null,
    ingredients: recipeFormIngredients.filter(function (i) { return i.name.trim(); }),
    loves: loves, likes: likes, tolerates: tolerates, hates: hates,
  };

  var error;
  if (recipeEditId) {
    var res = await sb.from('recipes').update(payload).eq('id', recipeEditId).select();
    error = res.error;
    if (!error && res.data) {
      var idx = allRecipes.findIndex(function (r) { return r.id === recipeEditId; });
      if (idx >= 0) allRecipes[idx] = res.data[0];
    }
  } else {
    var res2 = await sb.from('recipes').insert(payload).select();
    error = res2.error;
    if (!error && res2.data) allRecipes.push(res2.data[0]);
  }

  if (error) { showToast('rf', 'err', 'Save failed: ' + error.message); return; }
  showToast('rf', 'ok', recipeEditId ? 'Recipe updated.' : 'Recipe saved!');
  allRecipes.sort(function (a, b) { return a.name.localeCompare(b.name); });
  renderRecipeBank();
  setTimeout(closeRecipeForm, 900);
}

async function deleteRecipeConfirm() {
  if (!recipeEditId) return;
  if (!confirm('Delete this recipe?')) return;
  await sb.from('recipes').update({ active: false }).eq('id', recipeEditId);
  allRecipes = allRecipes.filter(function (r) { return r.id !== recipeEditId; });
  closeRecipeForm();
  renderRecipeBank();
}

// ── RECIPE DETAIL — INGREDIENTS CHECKLIST ─────────────────────────────────────
function openRecipeDetail(id) {
  recipeDetailId = id;
  recipeDetailChecked = new Set();
  var recipe = allRecipes.find(function (r) { return r.id === id; });
  if (!recipe) return;
  document.getElementById('recipe-detail-title').textContent = recipe.name;
  renderRecipeDetail();
  document.getElementById('recipe-detail-overlay').classList.add('open');
}

function renderRecipeDetail() {
  var recipe = allRecipes.find(function (r) { return r.id === recipeDetailId; });
  if (!recipe) return;
  var el = document.getElementById('recipe-detail-body');
  var ingredients = recipe.ingredients || [];

  if (!ingredients.length) {
    el.innerHTML = '<div class="empty">No ingredients listed for this recipe.</div>';
    return;
  }

  var allChecked = ingredients.length > 0 && ingredients.every(function (_, i) { return recipeDetailChecked.has(i); });

  var html = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;gap:8px;flex-wrap:wrap;">';
  html += '<label style="font-size:13px;display:flex;align-items:center;gap:6px;cursor:pointer;">';
  html += '<input type="checkbox"' + (allChecked ? ' checked' : '') + ' onchange="toggleAllIngredients(this.checked)"> Select all';
  html += '</label>';
  html += '<button class="btn btn-p" onclick="addCheckedToGrocery()" style="font-size:12px;padding:5px 14px;">Add to Grocery List</button>';
  html += '</div>';

  ingredients.forEach(function (ing, idx) {
    var isChecked = recipeDetailChecked.has(idx);
    html += '<label style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border);cursor:pointer;font-size:13px;">';
    html += '<input type="checkbox"' + (isChecked ? ' checked' : '') + ' onchange="toggleDetailIngredient(' + idx + ',this.checked)">';
    html += '<span style="flex:1;' + (isChecked ? 'text-decoration:line-through;color:var(--text3);' : '') + '">' + esc(ing.name) + '</span>';
    if (ing.quantity) html += '<span style="font-size:12px;color:var(--text3);white-space:nowrap;">' + esc(ing.quantity) + '</span>';
    html += '</label>';
  });

  el.innerHTML = html;
}

function toggleDetailIngredient(idx, checked) {
  if (checked) recipeDetailChecked.add(idx);
  else recipeDetailChecked.delete(idx);
  renderRecipeDetail();
}

function toggleAllIngredients(checked) {
  var recipe = allRecipes.find(function (r) { return r.id === recipeDetailId; });
  recipeDetailChecked = new Set();
  if (checked) (recipe.ingredients || []).forEach(function (_, i) { recipeDetailChecked.add(i); });
  renderRecipeDetail();
}

async function addCheckedToGrocery() {
  var recipe = allRecipes.find(function (r) { return r.id === recipeDetailId; });
  if (!recipe || !recipeDetailChecked.size) { alert('Select at least one ingredient first.'); return; }
  var rows = [];
  recipeDetailChecked.forEach(function (idx) {
    var ing = (recipe.ingredients || [])[idx];
    if (ing && ing.name) rows.push({ name: ing.name, quantity: ing.quantity || null, source_recipe: recipe.name, checked: false });
  });
  if (!rows.length) return;
  var { data, error } = await sb.from('grocery_list').insert(rows).select();
  if (!error && data) {
    data.forEach(function (item) { allGroceryList.push(item); });
    closeRecipeDetail();
    setMealTab('grocery');
  } else if (error) {
    alert('Failed to add items: ' + error.message);
  }
}

function closeRecipeDetail() { document.getElementById('recipe-detail-overlay').classList.remove('open'); }
function closeRecipeDetailOverlay(e) { if (e.target === document.getElementById('recipe-detail-overlay')) closeRecipeDetail(); }

// ── GROCERY LIST ──────────────────────────────────────────────────────────────
function renderGroceryListView() {
  var el = document.getElementById('meal-grocery-view');
  if (!el) return;

  var checkedCount = allGroceryList.filter(function (i) { return i.checked; }).length;

  var html = '<div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-bottom:1rem;">';
  html += '<button class="btn" onclick="addManualGroceryItem()" style="font-size:12px;padding:5px 12px;">+ Add Item</button>';
  if (checkedCount) html += '<button class="btn" onclick="clearCheckedGrocery()" style="font-size:12px;padding:5px 12px;">Clear Checked (' + checkedCount + ')</button>';
  if (allGroceryList.length) html += '<button class="btn" onclick="clearAllGrocery()" style="font-size:12px;padding:5px 12px;color:var(--danger);">Clear All</button>';
  html += '</div>';

  if (!allGroceryList.length) {
    el.innerHTML = html + '<div class="card"><div class="empty">Your grocery list is empty. Add items from a recipe\'s ingredients or manually above.</div></div>';
    return;
  }

  // Group by source recipe
  var groups = {};
  allGroceryList.forEach(function (item) {
    var src = item.source_recipe || 'Other Items';
    if (!groups[src]) groups[src] = [];
    groups[src].push(item);
  });

  Object.keys(groups).sort(function (a, b) {
    if (a === 'Other Items') return 1;
    if (b === 'Other Items') return -1;
    return a.localeCompare(b);
  }).forEach(function (src) {
    html += '<div class="card" style="margin-bottom:12px;">';
    html += '<div class="ct">' + esc(src) + '</div>';
    groups[src].forEach(function (item) {
      html += '<label style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border);cursor:pointer;">';
      html += '<input type="checkbox"' + (item.checked ? ' checked' : '') + ' onchange="toggleGroceryItem(\'' + item.id + '\',this.checked)">';
      html += '<span style="flex:1;font-size:13px;' + (item.checked ? 'text-decoration:line-through;color:var(--text3);' : '') + '">' + esc(item.name) + '</span>';
      if (item.quantity) html += '<span style="font-size:12px;color:var(--text3);white-space:nowrap;">' + esc(item.quantity) + '</span>';
      html += '</label>';
    });
    html += '</div>';
  });

  el.innerHTML = html;
}

async function toggleGroceryItem(id, checked) {
  var item = allGroceryList.find(function (i) { return i.id === id; });
  if (item) item.checked = checked;
  await sb.from('grocery_list').update({ checked: checked }).eq('id', id);
  renderGroceryListView();
}

async function clearCheckedGrocery() {
  var ids = allGroceryList.filter(function (i) { return i.checked; }).map(function (i) { return i.id; });
  if (!ids.length) return;
  if (!confirm('Remove ' + ids.length + ' checked item(s)?')) return;
  await sb.from('grocery_list').delete().in('id', ids);
  allGroceryList = allGroceryList.filter(function (i) { return !i.checked; });
  renderGroceryListView();
}

async function clearAllGrocery() {
  if (!allGroceryList.length) return;
  if (!confirm('Clear the entire grocery list?')) return;
  var ids = allGroceryList.map(function (i) { return i.id; });
  await sb.from('grocery_list').delete().in('id', ids);
  allGroceryList = [];
  renderGroceryListView();
}

async function addManualGroceryItem() {
  var name = prompt('Item name:');
  if (!name || !name.trim()) return;
  var qty = prompt('Amount/quantity (optional, e.g. "2 lbs"):') || '';
  var { data, error } = await sb.from('grocery_list').insert({
    name: name.trim(), quantity: qty.trim() || null, checked: false,
  }).select();
  if (!error && data) { allGroceryList.push(data[0]); renderGroceryListView(); }
}
