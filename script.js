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

        save(shouldRender = true) {
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
            this.save(false); // Save without re-rendering everything immediately
        },

        remove(id) {
            this.items = this.items.filter(item => item.id !== parseInt(id));
            this.save();
        },

        increment(id) {
            const parsedId = parseInt(id);
            const item = this.items.find(item => item.id === parsedId);
            if (item) {
                item.quantity++;
                this.save();
            }
        },

        decrement(id) {
            const parsedId = parseInt(id);
            const item = this.items.find(item => item.id === parsedId);
            if (item) {
                item.quantity--;
                if (item.quantity <= 0) {
                    this.remove(parsedId);
                } else {
                    this.save();
                }
            }
        },

        emptyCart() {
            this.items = [];
            this.save();
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

            }
        },

        init() {
            this.updateCount();
            this.render();
            this.attachListeners();
        },

        attachListeners() {
            const cartItemsContainer = document.querySelector('.cart-items');
            if (!cartItemsContainer) return;

            cartItemsContainer.addEventListener('click', (e) => {
                const target = e.target.closest('.qty-btn, .remove-btn');
                if (!target) return;

                const id = target.dataset.id;
                if (target.classList.contains('plus')) {
                    this.increment(id);
                } else if (target.classList.contains('minus')) {
                    this.decrement(id);
                } else if (target.classList.contains('remove-btn')) {
                    this.remove(id);
                }
            });

            const emptyCartBtn = document.querySelector('.empty-cart-btn');
            if (emptyCartBtn) {
                emptyCartBtn.addEventListener('click', () => this.emptyCart());
            }
        }
    };

    // Initialize Cart
    cart.init();

    let allProducts = []; // To store all products for searching
    let currentPage = 1;
    let currentFilteredProducts = [];

    // Items per page control (default 9). Persist in localStorage.
    const itemsPerPageSelect = document.getElementById('items-per-page');
    let productsPerPage = 9;
    if (itemsPerPageSelect) {
        const saved = localStorage.getItem('luxeItemsPerPage');
        if (saved) {
            itemsPerPageSelect.value = saved;
            productsPerPage = parseInt(saved, 10) || 9;
        } else {
            productsPerPage = parseInt(itemsPerPageSelect.value, 10) || 9;
        }

        itemsPerPageSelect.addEventListener('change', (e) => {
            const v = parseInt(e.target.value, 10) || 9;
            productsPerPage = v;
            localStorage.setItem('luxeItemsPerPage', String(v));
            currentPage = 1;
            renderPage(currentFilteredProducts);
        });
    }

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
            allProducts = products;
            currentFilteredProducts = allProducts;
            renderPage(currentFilteredProducts);

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

    function renderPage(products) {
        renderProducts(products);
        renderPagination(products);
    }

    function renderProducts(productsToRender) {
        const productGrid = document.querySelector('.product-grid');
        if (!productGrid) return;

        if (productsToRender.length === 0) {
            productGrid.innerHTML = '<p>No products found matching your search.</p>';
            return;
        }

        const startIndex = (currentPage - 1) * productsPerPage;
        const endIndex = startIndex + productsPerPage;
        const paginatedProducts = productsToRender.slice(startIndex, endIndex);

        productGrid.innerHTML = paginatedProducts.map(product => `
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
    }

    function renderPagination(products) {
        const paginationContainer = document.getElementById('pagination-container');
        if (!paginationContainer) return;

        const totalPages = Math.ceil(products.length / productsPerPage);
        paginationContainer.innerHTML = '';

        if (totalPages <= 1) return;

        const createPaginationButton = (content, page, isDisabled = false) => {
            const btn = document.createElement('button');
            btn.innerHTML = content;
            btn.classList.add('pagination-btn');
            btn.disabled = isDisabled;
            btn.addEventListener('click', () => {
                currentPage = page;
                renderPage(products);
                document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
            });
            return btn;
        };

        // First Page Button
        paginationContainer.appendChild(
            createPaginationButton('&laquo;', 1, currentPage === 1)
        );

        // Previous Page Button
        paginationContainer.appendChild(
            createPaginationButton('&lsaquo;', currentPage - 1, currentPage === 1)
        );

        // Numbered Page Buttons
        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('button');
            btn.textContent = i;
            btn.classList.add('pagination-btn');
            if (i === currentPage) {
                btn.classList.add('active');
            }
            btn.addEventListener('click', () => {
                currentPage = i;
                renderPage(products);
                document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
            });
            paginationContainer.appendChild(btn);
        }

        // Next Page Button
        paginationContainer.appendChild(
            createPaginationButton('&rsaquo;', currentPage + 1, currentPage === totalPages)
        );

        // Last Page Button
        paginationContainer.appendChild(
            createPaginationButton('&raquo;', totalPages, currentPage === totalPages)
        );
    }

    // Search Logic
    const searchInput = document.getElementById('search-input');
    const searchForm = document.getElementById('search-form');

    if (searchForm) {
        searchForm.addEventListener('submit', e => e.preventDefault());
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            currentPage = 1; // Reset to first page on new search
            currentFilteredProducts = allProducts.filter(product =>
                product.name.toLowerCase().includes(searchTerm)
            );
            renderPage(currentFilteredProducts);
        });
    }

    // Initial Load
    loadProducts();
});
