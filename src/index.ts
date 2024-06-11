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

    function getCurrentDate() {
        return new Date(new BigInt(ic.time()).valueOf() / 1000_000);
    }

    // Add a new menu item
    app.post("/menu", (req, res) => {
        const requiredFields = ['name', 'cost'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            return res.status(400).send(`Missing required fields: ${missingFields.join(', ')}`);
        }

        const menuItem: MenuItem = { id: uuidv4(), createdAt: getCurrentDate(), updatedAt: null, ...req.body };
        try {
            menuStorage.insert(menuItem.id, menuItem);
            res.status(201).json(menuItem); // Use 201 for created resources
        } catch (error) {
            console.error(`Error adding menu item: ${error}`);
            res.status(500).send('Internal Server Error');
        }
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

    // Update the cost of a menu item (consider using PATCH for partial updates)
    app.put("/menu/:id", (req, res) => {
        const itemId = req.params.id;
        const menuItemOpt = menuStorage.get(itemId);
        if ("None" in menuItemOpt) {
            res.status(400).send(`Couldn't update the menu item with id=${itemId}. Item not found`);
        } else {
            const menuItem = menuItemOpt.Some;
            const updatedData = { ...req.body, updatedAt: getCurrentDate() };
            const updatedMenuItem = { ...menuItem, ...updatedData };
            try {
                menuStorage.insert(itemId, updatedMenuItem);
                res.json(updatedMenuItem);
            } catch (error) {
                console.error(`Error updating menu item: ${error}`);
                res.status(500).send('Internal Server Error');
            }
        }
    });

    // Delete a menu item
    app.delete("/menu/:id", (req, res) => {
        const itemId = req.params.id;
        const deletedMenuItem = menuStorage.remove(itemId);
        if ("None" in deletedMenuItem) {
            res.status(404).send(`Menu item with id=${itemId} not found`);
        } else {
            res.status(204).send(); // No content on successful deletion
        }
    });

    return app.listen();
});
