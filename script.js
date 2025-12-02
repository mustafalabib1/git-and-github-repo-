document.addEventListener('DOMContentLoaded', () => {
    // Sticky Header
    const header = document.querySelector('.header');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Mobile Menu Toggle
    const mobileToggle = document.querySelector('.mobile-toggle');
    const nav = document.querySelector('.nav');
    const navLinks = document.querySelectorAll('.nav-link');

    mobileToggle.addEventListener('click', () => {
        nav.classList.toggle('active');
        const icon = mobileToggle.querySelector('i');
        if (nav.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });

    // Close mobile menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('active');
            const icon = mobileToggle.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        });
    });

    // Cart Logic
    console.log('Initializing Cart...');
    const cart = window.cart = {
        items: JSON.parse(localStorage.getItem('luxeCart')) || [],

        save() {
            localStorage.setItem('luxeCart', JSON.stringify(this.items));
            this.updateCount();
            this.render();
        },

        add(product) {
            const existing = this.items.find(item => item.id === product.id);
            if (existing) {
                existing.quantity++;
            } else {
                this.items.push({ ...product, quantity: 1 });
            }
            this.save();
        },

        remove(id) {
            this.items = this.items.filter(item => item.id !== id);
            this.save();
        },

        updateQuantity(id, change) {
            const item = this.items.find(item => item.id === id);
            if (item) {
                item.quantity += change;
                if (item.quantity <= 0) {
                    this.remove(id);
                } else {
                    this.save();
                }
            }
        },

        updateCount() {
            const count = this.items.reduce((sum, item) => sum + item.quantity, 0);
            document.querySelectorAll('.cart-count').forEach(el => el.textContent = count);
        },

        render() {
            const cartContent = document.getElementById('cart-content');
            const cartEmpty = document.getElementById('cart-empty');
            const cartItemsContainer = document.querySelector('.cart-items');
            const subtotalEl = document.getElementById('cart-subtotal');
            const totalEl = document.getElementById('cart-total');

            // Only run render if we are on the cart page
            if (!cartContent) return;

            if (this.items.length === 0) {
                cartContent.style.display = 'none';
                cartEmpty.style.display = 'block';
            } else {
                cartContent.style.display = 'grid';
                cartEmpty.style.display = 'none';

                cartItemsContainer.innerHTML = this.items.map(item => `
                    <div class="cart-item">
                        <img src="${item.image}" alt="${item.title}" class="cart-item-img">
                        <div class="cart-item-details">
                            <h3 class="cart-item-title">${item.title}</h3>
                            <p class="cart-item-price">$${item.price}</p>
                        </div>
                        <div class="cart-item-actions">
                            <div class="quantity-controls">
                                <button class="qty-btn minus" data-id="${item.id}"><i class="fas fa-minus"></i></button>
                                <span class="qty-input">${item.quantity}</span>
                                <button class="qty-btn plus" data-id="${item.id}"><i class="fas fa-plus"></i></button>
                            </div>
                            <button class="remove-btn" data-id="${item.id}"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                `).join('');

                const subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
                totalEl.textContent = `$${subtotal.toFixed(2)}`;

                // Re-attach listeners
                this.attachListeners();
            }
        },

        attachListeners() {
            document.querySelectorAll('.qty-btn.plus').forEach(btn => {
                btn.onclick = () => this.updateQuantity(btn.dataset.id, 1);
            });
            document.querySelectorAll('.qty-btn.minus').forEach(btn => {
                btn.onclick = () => this.updateQuantity(btn.dataset.id, -1);
            });
            document.querySelectorAll('.remove-btn').forEach(btn => {
                btn.onclick = () => this.remove(btn.dataset.id);
            });
        }
    };

    // Initialize Cart
    cart.updateCount();
    cart.render();

    // Load Products
    async function loadProducts() {
        const productGrid = document.querySelector('.product-grid');
        if (!productGrid) return;

        try {
            const response = await fetch('produts.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const products = await response.json();

            productGrid.innerHTML = products.map(product => `
                <article class="product-card" data-id="${product.id}">
                    <div class="product-image">
                        <img class="product-img" src="${product.image_url}" alt="${product.name}">
                        <button class="add-to-cart-btn" aria-label="Add to Cart"><i class="fas fa-plus"></i></button>
                    </div>
                    <div class="product-info">
                        <span class="product-category">${product.category}</span>
                        <h3 class="product-title">${product.name}</h3>
                        <p class="product-price">$${product.price.toFixed(2)}</p>
                    </div>
                </article>
            `).join('');

            // Re-attach listeners for the new buttons
            attachAddToCartListeners();

        } catch (error) {
            console.error("Could not load products:", error);
            productGrid.innerHTML = '<p>Could not load products. Please try again later.</p>';
        }
    }

    function attachAddToCartListeners() {
        const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');
        addToCartBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();

                const card = btn.closest('.product-card');
                const product = {
                    id: parseInt(card.dataset.id),
                    title: card.querySelector('.product-title').textContent,
                    price: parseFloat(card.querySelector('.product-price').textContent.replace('$', '')),
                    image: card.querySelector('.product-img').src
                };

                cart.add(product);

                const icon = btn.querySelector('i');
                icon.classList.remove('fa-plus');
                icon.classList.add('fa-check');
                setTimeout(() => {
                    icon.classList.remove('fa-check');
                    icon.classList.add('fa-plus');
                }, 1500);

                const cartBtn = document.querySelector('.icon-btn[aria-label="Cart"]');
                if (cartBtn) {
                    cartBtn.style.transform = 'scale(1.2)';
                    setTimeout(() => cartBtn.style.transform = 'scale(1)', 200);
                }
            });
        });
    }

    // Initial Load
    loadProducts();
});
