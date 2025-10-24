const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/veriloc';
console.log('Connecting to MongoDB at:', MONGODB_URI);
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Get the Room collection
      const db = mongoose.connection.db;
      const collection = db.collection('rooms');
      
      // List all indexes
      console.log('Current indexes:');
      const indexes = await collection.indexes();
      console.log(indexes);
      
      // Drop the problematic index if it exists
      const roomNumberIndex = indexes.find(index => 
        index.key && 
        Object.keys(index.key).length === 1 && 
        index.key.roomNumber === 1 && 
        index.unique === true
      );
      
      if (roomNumberIndex) {
        console.log('Found problematic unique index on roomNumber, dropping it...');
        await collection.dropIndex(roomNumberIndex.name);
        console.log('Index dropped successfully');
      } else {
        console.log('No problematic unique index found on roomNumber');
      }
      
      // List indexes after changes
      console.log('Updated indexes:');
      const updatedIndexes = await collection.indexes();
      console.log(updatedIndexes);
      
      console.log('Done!');
    } catch (error) {
      console.error('Error fixing indexes:', error);
    } finally {
      mongoose.disconnect();
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
