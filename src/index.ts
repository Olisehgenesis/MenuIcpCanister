import { v4 as uuidv4 } from 'uuid';
import { Server, StableBTreeMap, ic } from 'azle';
import express from 'express';



class MenuItem {
    id: string;
    name: string;
    cost: number;
    createdAt: Date;
    updatedAt: Date | null;
}

const menuStorage = StableBTreeMap<string, MenuItem>(0);

export default Server(() => {
    const app = express();
    app.use(express.json());

    // Add a new menu item
    app.post("/menu", (req, res) => {
        const menuItem: MenuItem = { id: uuidv4(), createdAt: getCurrentDate(), updatedAt: null, ...req.body };
        menuStorage.insert(menuItem.id, menuItem);
        res.json(menuItem);
    });

    // Get all menu items
    app.get("/menu", (req, res) => {
        res.json(menuStorage.values());
    });

    // Get a menu item by id
    app.get("/menu/:id", (req, res) => {
        const itemId = req.params.id;
        const menuItemOpt = menuStorage.get(itemId);
        if ("None" in menuItemOpt) {
            res.status(404).send(`The menu item with id=${itemId} not found`);
        } else {
            res.json(menuItemOpt.Some);
        }
    });

    // Update the cost of a menu item
    app.put("/menu/:id", (req, res) => {
        const itemId = req.params.id;
        const menuItemOpt = menuStorage.get(itemId);
        if ("None" in menuItemOpt) {
            res.status(400).send(`Couldn't update the menu item with id=${itemId}. Item not found`);
        } else {
            const menuItem = menuItemOpt.Some;
            const updatedMenuItem = { ...menuItem, ...req.body, updatedAt: getCurrentDate() };
            menuStorage.insert(menuItem.id, updatedMenuItem);
            res.json(updatedMenuItem);
        }
    });

    // Delete a menu item
    app.delete("/menu/:id", (req, res) => {
        const itemId = req.params.id;
        const deletedMenuItem = menuStorage.remove(itemId);
        if ("None" in deletedMenuItem) {
            res.status(400).send(`Couldn't delete the menu item with id=${itemId}. Item not found`);
        } else {
            res.json(deletedMenuItem.Some);
        }
    });
    return app.listen();
});

function getCurrentDate() {
    const timestamp = new Number(ic.time());
    return new Date(timestamp.valueOf() / 1000_000);
}
