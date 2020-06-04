const express = require('express');
const cartsRepo = require('../repositories/carts');
const productsRepo = require('../repositories/products');
const cartShowTemplate = require('../views/carts/show');

const router = express.Router();

//recieve a post request to add an item to a cart
router.post('/cart/products', async (req, res) => {
    console.log(req.body.productId);
    //figure out if there is a cart (by using the cartId in the cookie's cartId property)
    let cart;
    if (!req.session.cartId) {
        //we dont have a cart, we need to create one and store the cart id on req.session.cartId property
        cart = await cartsRepo.create({ items: [] });  //create a cart with no items
        req.session.cartId = cart.id;  //take the id of the created cart and assign it to the session.cartId property in the cookie
    } else {
        //we have a cart! get it from the repository
        cart = await cartsRepo.getOne(req.session.cartId);  //if the cart exists, retrive that cart using the cart id
        
    }

    //increment the quantity for existing product (update the quantity) add new product to items array (add a new product to the cart)
    const existingItem = cart.items.find(item => item.id == req.body.productId);
    if (existingItem) {
        //increment quantity and save cart
        existingItem.quantity++;
    } else {
        //add new product id to items array
        cart.items.push({ id: req.body.productId, quantity: 1 });
    }
    await cartsRepo.update(cart.id, {
        items: cart.items
    });

    res.redirect('/cart');
});

//recieve a get request to show all the items in a cart
router.get('/cart', async (req, res) => {
    if (!req.session.cartId) {
        return res.redirect('/');
    }

    const cart = await cartsRepo.getOne(req.session.cartId);

    for (let item of cart.items) {
        //item will be an object with the product id and quantity
        const product = await productsRepo.getOne(item.id);

        item.product = product;
    }

    res.send(cartShowTemplate({ items: cart.items }));
});

//recieve a post request to delete an item from a cart
router.post('/cart/products/delete', async (req, res) => {
    const { itemId } = req.body;
    const cart = await cartsRepo.getOne(req.session.cartId);

    const items = cart.items.filter(item => item.id !== itemId);

    await cartsRepo.update(req.session.cartId, { items });

    res.redirect('/cart');
});

module.exports = router;