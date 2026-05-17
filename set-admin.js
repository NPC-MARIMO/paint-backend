const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const result = await mongoose.connection.db.collection('users').updateOne(
        { email: 'admin@ashirwadcoating.com' },
        { $set: { role: 'admin' } }
    );
    console.log('Updated:', JSON.stringify(result));
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});
