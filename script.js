// --- CONFIGURATION ---

function getBasePricePerSqFt(sqFt) {
    if (sqFt <= 10) return 5.20;
    if (sqFt >= 80) return 2.75;
    // Curve: -0.000333333*x^2 - 0.005*x + 5.2833333
    return (-0.000333333 * Math.pow(sqFt, 2)) - (0.005 * sqFt) + 5.2833333;
}

// Updated Fixed Prices
const FIXED_PRICES = {
    // Amp Flags / Cab Mesh common pricing
    "small": 49,    // Half-stack or smaller
    "large": 59,    // Large Bass
    "full": 69      // Full stack / Oversized
};

// --- STATE ---
let qty = 1;

// --- DOM ELEMENTS ---
const els = {
    w: document.getElementById('widthInput'),
    h: document.getElementById('heightInput'),
    size: document.getElementById('sizeSelect'),
    mat: document.getElementById('materialInput'),
    qty: document.getElementById('qtyDisplay'),
    priceEach: document.getElementById('priceEach'),
    totalPrice: document.getElementById('totalPrice'),
    discount: document.getElementById('discountTag')
};

// --- INITIALIZATION ---
function init(productType) {
    const inputs = [els.w, els.h, els.size, els.mat];
    inputs.forEach(el => {
        if (el) el.addEventListener('input', () => {
            validateConstraints();
            calculate(productType);
        });
    });

    // Initial check
    validateConstraints();
    calculate(productType);
}

// --- VALIDATION LOGIC ---
function validateConstraints() {
    const pageName = document.body.dataset.name;
    
    if (pageName === 'battleFlags' && els.w && els.h) {
        let w = parseFloat(els.w.value) || 0;
        
        // Enforce Height Limits based on Width
        let maxH = 18;
        if (w >= 4) {
            maxH = 7;
        }
        
        const heightInput = document.getElementById('heightInput');
        if (heightInput) heightInput.setAttribute('max', maxH);
    }
}

// --- ACTIONS ---
function adjustQty(delta) {
    qty += delta;
    if(qty < 1) qty = 1;
    updateQtyUI();
    const productType = document.body.dataset.product;
    calculate(productType);
}

function updateQtyUI() {
    els.qty.innerText = qty;
}

// --- CORE CALCULATION ENGINE ---
function calculate(productType) {
    let unitPrice = 0;
    let discountMsg = "";
    let isDiscounted = false;
    const material = els.mat ? els.mat.value : null;

    // 1. Determine Base Unit Price
    if (productType === 'dimension') {
        const w = parseFloat(els.w.value) || 0;
        const h = parseFloat(els.h.value) || 0;
        const sqFt = w * h;
        if (sqFt <= 0) {
            updateUI(0, 0, "", false);
            return;
        }
        unitPrice = getBasePricePerSqFt(sqFt) * sqFt;
    } else {
        // Preset sizes
        unitPrice = FIXED_PRICES[els.size.value];
    }

    let finalUnitPrice = unitPrice;
    let totalPrice = unitPrice * qty;

    // 2. Apply Specific Discounts

    // RULE: Scrims - 30% off pairs
    if (productType === 'dimension' && document.body.dataset.name === 'scrims' && qty >= 2) {
        if (material === 'lightpass' || material === 'mesh') {
            finalUnitPrice = unitPrice * 0.70;
            totalPrice = finalUnitPrice * qty;
            discountMsg = "30% OFF PAIR APPLIED";
            isDiscounted = true;
        }
    }

    // RULE: Battle Flags
    if (document.body.dataset.name === 'battleFlags') {
        if (qty === 2) {
            finalUnitPrice = unitPrice * 0.90;
            totalPrice = finalUnitPrice * qty;
            discountMsg = "10% BULK DISCOUNT";
            isDiscounted = true;
        } else if (qty >= 3) {
            finalUnitPrice = unitPrice * 0.85;
            totalPrice = finalUnitPrice * qty;
            discountMsg = "15% BULK DISCOUNT";
            isDiscounted = true;
        }
    }

    // RULE: War Flags
    if (document.body.dataset.name === 'warFlags') {
        if (qty === 2) {
            finalUnitPrice = unitPrice * 0.95;
            totalPrice = finalUnitPrice * qty;
            discountMsg = "5% DISCOUNT";
            isDiscounted = true;
        } else if (qty === 3) {
            finalUnitPrice = unitPrice * 0.92;
            totalPrice = finalUnitPrice * qty;
            discountMsg = "8% DISCOUNT";
            isDiscounted = true;
        } else if (qty >= 4) {
            finalUnitPrice = unitPrice * 0.90;
            totalPrice = finalUnitPrice * qty;
            discountMsg = "10% DISCOUNT";
            isDiscounted = true;
        }
    }

    // RULE: Amp Flags / Cab Mesh - Buy 3 Get +1 Free Logic
    if (productType === 'preset') {
        // Price per unit stays constant (No discount on price)
        finalUnitPrice = unitPrice; 
        totalPrice = unitPrice * qty; // Simple multiplication

        // Calculate how many free ones they get (Floor of Qty / 3)
        // e.g. Qty 3 = 1 Free. Qty 5 = 1 Free. Qty 6 = 2 Free.
        const freeItems = Math.floor(qty / 3);

        if (freeItems > 0) {
            const pageName = document.body.dataset.name;
            const itemName = pageName === 'ampFlags' ? "AMP FLAG" : "CABINET MESH";
            
            // Plural logic: "FLAGS" gets an S, "MESH" does not
            let suffix = "";
            if (pageName === 'ampFlags') {
                suffix = freeItems > 1 ? "S" : "";
            }

            discountMsg = `+${freeItems} FREE ${itemName}${suffix}`;
            isDiscounted = true;
        }
    }

    // 3. Update UI
    updateUI(finalUnitPrice, totalPrice, discountMsg, isDiscounted);
}

function updateUI(unitPrice, totalPrice, discountMsg, isDiscounted) {
    els.priceEach.innerText = "$" + Math.round(unitPrice);
    els.totalPrice.innerText = "$" + Math.round(totalPrice);

    if (isDiscounted) {
        els.discount.innerText = discountMsg;
        els.discount.classList.add('visible');
    } else {
        els.discount.classList.remove('visible');
    }
}