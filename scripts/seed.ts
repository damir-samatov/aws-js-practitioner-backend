import {DynamoDBDocument} from "@aws-sdk/lib-dynamodb";
import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {PRODUCT_TABLE_NAME, STOCK_TABLE_NAME} from "../shared/constants";

const products = [
    {
        id: '1',
        title: 'Wireless Mouse',
        description: 'A sleek and ergonomic wireless mouse for precise control.',
        price: 29.99,
    },
    {
        id: '2',
        title: 'Gaming Keyboard',
        description: 'A mechanical keyboard with RGB lighting for gaming enthusiasts.',
        price: 89.99
    },
    {
        id: '3',
        title: 'Noise-Canceling Headphones',
        description: 'High-quality headphones that block out external noises.',
        price: 199.99
    },
    {
        id: '4',
        title: 'Smartphone Stand',
        description: 'Adjustable stand to hold your smartphone during video calls or streaming.',
        price: 14.99
    },
    {
        id: '5',
        title: 'Portable Charger',
        description: 'Compact power bank for charging devices on the go.',
        price: 24.99
    },
    {
        id: '6',
        title: '4K Monitor',
        description: 'Crystal-clear 4K monitor for productivity and entertainment.',
        price: 299.99
    },
    {
        id: '7',
        title: 'Laptop Backpack',
        description: 'Durable backpack with spacious compartments for your laptop and accessories.',
        price: 59.99
    },
    {
        id: '8',
        title: 'LED Desk Lamp',
        description: 'Adjustable LED desk lamp with multiple brightness settings.',
        price: 39.99
    },
    {
        id: '9',
        title: 'Fitness Tracker',
        description: 'Track your daily activity and heart rate with this wearable device.',
        price: 49.99
    },
    {
        id: '10',
        title: 'Bluetooth Speaker',
        description: 'Portable speaker with rich sound and long battery life.',
        price: 79.99
    }
]

const stocks = [
    {
        product_id: '1',
        count: 10,
    },
    {
        product_id: '2',
        count: 10,
    },
    {
        product_id: '3',
        count: 10,
    },
    {
        product_id: '4',
        count: 10,
    },
    {
        product_id: '5',
        count: 10,
    },
    {
        product_id: '6',
        count: 10,
    },
    {
        product_id: '7',
        count: 10,
    },
    {
        product_id: '8',
        count: 10,
    },
    {
        product_id: '9',
        count: 10,
    },
    {
        product_id: '10',
        count: 10,
    }
]

const dynamoDBDocClient = DynamoDBDocument.from(new DynamoDBClient());

try {
    products.forEach(async (product) => {
        await dynamoDBDocClient.put({
            TableName: PRODUCT_TABLE_NAME,
            Item: {
                id: product.id,
                title: product.title,
                description: product.description,
                price: product.price,
            },
        });
    });

    stocks.forEach(async (stock) => {
        await dynamoDBDocClient.put({
            TableName: STOCK_TABLE_NAME,
            Item: {
                product_id: stock.product_id,
                count: stock.count,
            },
        });
    });
} catch (error) {
    console.error("Error seeding data:", error);
}

