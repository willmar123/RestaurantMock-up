# Library for JSON parsing
import json

import random
import numpy as np

import time

# Firebase management libraries
import firebase_admin
from firebase_admin import credentials, firestore

credBackup2 = credentials.Certificate(
    './polito-se2-21-01-spg-backup-2-firebase-adminsdk-rdqbs-c08f51d712.json'
)
appBackup2 = firebase_admin.initialize_app(credBackup2, {
    'projectId': 'polito-se2-21-01-spg-backup-2'
}, 'Backup2')

credBackup3 = credentials.Certificate(
    './polito-se2-21-01-spg-backup-3-firebase-adminsdk-kn5e2-979f8d4105.json'
)
appBackup3 = firebase_admin.initialize_app(credBackup3, {
    'projectId': 'polito-se2-21-01-spg-backup-3'
}, 'Backup3')

credTest = credentials.Certificate(
    './polito-se2-21-01-spg-test-firebase-adminsdk-r0o33-6fb9897bce.json'
)
appTest = firebase_admin.initialize_app(credTest, {
    'projectId': 'polito-se2-21-01-spg-test'
}, 'Test')

db = firestore.client(appBackup2)

# Global variables for products, users and farmers
global JSONData
global JSONProducts
global JSONUsers
global JSONFarmers
global JSONOrders

# Load all data from JSON file
file = open('FirebaseDataFill.json')
JSONData = json.load(file)

JSONProducts = JSONData['products']
JSONUsers = JSONData['users']
JSONFarmers = JSONData['farmers']
JSONOrders = JSONData['orders']

# Remove old data from Firebase
def cleanFirebase():
    # User
    docs = db.collection(u'User').get()
    for doc in docs:
        db.collection(u'User').document(doc.id).delete()

    # Farmer
    docs = db.collection(u'Farmer').get()
    for doc in docs:
        db.collection(u'Farmer').document(doc.id).delete()

    # Product
    docs = db.collection(u'Product').get()
    for doc in docs:
        db.collection(u'Product').document(doc.id).delete()

    # Order
    docs = db.collection(u'Order').get()
    for doc in docs:
        db.collection(u'Order').document(doc.id).delete()

    # Product by Farmers
    docs = db.collection(u'Product by Farmers').get()
    for doc in docs:
        db.collection(u'Product by Farmers').document(doc.id).delete()

# Load users inside 'User' table in Firebase
def loadUsers():

    count = 0

    for user in JSONUsers:
        print(json.dumps(user, indent=4))
        db.collection(u'User').document(user['ID']).set({
            'Name': user['Name'],
			'Surname': user['Surname'],
			'Email': user['Email'],
			'Phoneno': user['Phoneno'],
			'Address': user['Address'],
			'City': user['City'],
			'State': user['State'],
			'Zipcode': user['Zipcode'],
			'Password': user['Password'],
			'Role': user['Role'],
			'Wallet': user['Wallet']
        })
        count += 1

        #print(count)
    print('Inserted ' + str(count) + ' users!')

# Load farmers inside 'Farmer' adn 'User' tables in Firebase
def loadFarmers():

    count = 0

    for farmer in JSONFarmers:
        print(json.dumps(farmer, indent=4))
        db.collection(u'Farmer').document(farmer['ID']).set({
            'Name': farmer['Name'],
			'Surname': farmer['Surname'],
			'Email': farmer['Email'],
            'Company': farmer['Company'],
			'Phoneno': farmer['Phoneno'],
			'Address': farmer['Address'],
			'State': farmer['State'],
			'Zipcode': farmer['Zipcode'],
			'Distance': farmer['Distance']
        })
        db.collection(u'User').document(farmer['ID']).set({
            'Name': farmer['Name'],
			'Surname': farmer['Surname'],
			'Email': farmer['Email'],
            'Company': farmer['Company'],
			'Phoneno': farmer['Phoneno'],
			'Address': farmer['Address'],
			'City': farmer['City'],
			'State': farmer['State'],
			'Zipcode': farmer['Zipcode'],
			'Password': farmer['Password'],
			'Role': farmer['Role'],
			'Wallet': farmer['Wallet']
        })
        count += 1

        #print(count)
    print('Inserted ' + str(count) + ' farmers!')

# Load products inside 'Product' table in Firebase
def loadProducts():
    count = 0

    for product in JSONProducts:

        data = {
            'Name': product['name'],
            'Description': product['description'],
            'ImageID': product['photoId']
        }
        print(json.dumps(data, indent=4))
        productId = db.collection(u'Product').document(product['id']).set(data)

        count += 1

        #print(count)
    print('Inserted ' + str(count) + ' products!')

# Load products by farmers inside 'Product by Farmers' table in Firebase
def loadProductsByFarmers():
    productsInserted = []
    for indexFarmer, farmer in enumerate(JSONFarmers):

        print('  - Farmer ' + str(indexFarmer) + ': ', end = '')

        for week in range(2,5):
            print('Week ' + str(week) + ': ')
            for i in range(1, 10):
                # Find a random product not already inserted
                randomProductIndex = random.choice(range(0, len(JSONProducts)))
                while randomProductIndex in productsInserted:
                    randomProductIndex = random.choice(range(0, len(JSONProducts)))

                productsInserted.append(randomProductIndex)
                randomProduct = JSONProducts[randomProductIndex]

                quantity = randomProduct['offers'][indexFarmer]['quantity']
                unit = randomProduct['offers'][indexFarmer]['unitofmeasurement']
                price = randomProduct['offers'][indexFarmer]['price']

                data = {
                    'FarmerID': farmer['ID'],
                    'ProductID': randomProduct['id'],
                    'Quantity': quantity,
                    'Unitofmeasurement': unit,
                    'Price': price,
                    'Week': week
                }
                #print(json.dumps(data, indent=4))
                db.collection(u'Product by Farmers').add(data)
                print('.', end = '')
            print('\n')
            productsInserted.clear()
        print('- Product by Farmers uploaded')

# Load products by farmers inside 'Product by Farmers' table in Firebase
def loadFarmer6():
    productsInserted = []

    indexFarmer = 6
    farmer = JSONFarmers[6]

    print('  - Farmer ' + str(indexFarmer) + ': ', end = '')
    for week in range(2, 5):
        print('Week ' + str(week) + ': ')
        for i in range(1, random.choice(range(10, 20))):
            # Find a random product not already inserted
            randomProductIndex = random.choice(range(0, len(JSONProducts)))
            while randomProductIndex in productsInserted:
                randomProductIndex = random.choice(range(0, len(JSONProducts)))
            productsInserted.append(randomProductIndex)
            randomProduct = JSONProducts[randomProductIndex]
            quantity = randomProduct['offers'][indexFarmer]['quantity']
            unit = randomProduct['offers'][indexFarmer]['unitofmeasurement']
            price = randomProduct['offers'][indexFarmer]['price']
            data = {
                'FarmerID': farmer['ID'],
                'ProductID': randomProduct['id'],
                'Quantity': quantity,
                'Unitofmeasurement': unit,
                'Price': price,
                'Week': week
            }
            #print(json.dumps(data, indent=4))
            db.collection(u'Product by Farmers').add(data)
            print('.', end = '')
        print('\n')
        productsInserted.clear()
    print('- Product by Farmers uploaded')

# Load orders inside 'Order' table in Firebase
def loadOrders():

    count = 0

    for order in JSONOrders:
        print(json.dumps(order, indent=4))
        db.collection(u'Order').document(order['OrderID']).set({
			'ClientID': order['ClientID'],
            'DeliveryDate': order['DeliveryDate'],
            'DeliveryPlace': order['DeliveryPlace'],
            'Price': order['Price'],
            'Products': order['ListOfProducts'],
            'Status': order['Status'],
            'Timestamp': order['Timestamp'],
            'notRetired': 'false',
            'pickupTimestamp': ''
        })
        count += 1

        #print(count)
    print('Inserted ' + str(count) + ' orders!')

if __name__ == '__main__':
    cleanFirebase()
    print('Cleaning done')

    loadUsers()

    loadFarmers()

    loadProducts()

    loadProductsByFarmers()

    #loadOrders()

    #loadFarmer6()

    print('DONE')